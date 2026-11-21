import type { Script, SkillId, Tone } from "../content/scripts";

/** 台本の矛盾(存在しない行き先、たどり着けない場面、終わりに行けない場面)を列挙する */
export function validateScript(s: Script): string[] {
  const errs: string[] = [];
  const ids = Object.keys(s.nodes);
  if (!s.nodes[s.start]) errs.push(`${s.id}: start "${s.start}" がない`);
  for (const [id, n] of Object.entries(s.nodes)) {
    if (n.end && n.choices?.length) errs.push(`${s.id}/${id}: 終わりの場面に選択肢がある`);
    if (!n.end && !n.choices?.length) errs.push(`${s.id}/${id}: 選択肢がない`);
    if (!n.says && !n.context) errs.push(`${s.id}/${id}: セリフも状況もない`);
    for (const c of n.choices ?? []) if (!s.nodes[c.next]) errs.push(`${s.id}/${id}: 行き先 "${c.next}" がない`);
  }
  // 開始からたどれる場面
  const reach = new Set<string>();
  const stack = [s.start];
  while (stack.length) {
    const id = stack.pop()!;
    if (reach.has(id) || !s.nodes[id]) continue;
    reach.add(id);
    for (const c of s.nodes[id].choices ?? []) stack.push(c.next);
  }
  for (const id of ids) if (!reach.has(id)) errs.push(`${s.id}/${id}: 開始からたどり着けない`);
  // どの場面からも終わりに行けること(逆向きにたどる)
  const canEnd = new Set(ids.filter((id) => s.nodes[id].end));
  let grew = true;
  while (grew) {
    grew = false;
    for (const id of ids) {
      if (canEnd.has(id)) continue;
      if (s.nodes[id].choices?.some((c) => canEnd.has(c.next))) {
        canEnd.add(id);
        grew = true;
      }
    }
  }
  for (const id of ids) if (!canEnd.has(id)) errs.push(`${s.id}/${id}: 終わりに行けない`);
  return errs;
}

export interface TalkTurn {
  nodeId: string;
  choice: number;
  tone: Tone;
  skill?: SkillId;
  /** 声に出したとき: 話し始めるまでの ms(話さなかったら null) */
  latencyMs?: number | null;
  /** 声に出したとき: 声が出ていた合計 ms */
  speakMs?: number;
}

export interface TalkSummary {
  turns: number;
  good: number;
  skills: SkillId[];
  voiced: number;
  medianLatencyMs: number | null;
  speakMs: number;
}

export function summarizeTalk(turns: TalkTurn[]): TalkSummary {
  const skills = [...new Set(turns.filter((t) => t.tone === "good" && t.skill).map((t) => t.skill!))];
  const voicedTurns = turns.filter((t) => t.speakMs !== undefined);
  const lat = voicedTurns.map((t) => t.latencyMs).filter((x): x is number => typeof x === "number").sort((a, b) => a - b);
  const median = lat.length ? (lat.length % 2 ? lat[(lat.length - 1) / 2] : (lat[lat.length / 2 - 1] + lat[lat.length / 2]) / 2) : null;
  return {
    turns: turns.length,
    good: turns.filter((t) => t.tone === "good").length,
    skills,
    voiced: voicedTurns.filter((t) => (t.speakMs ?? 0) > 0).length,
    medianLatencyMs: median,
    speakMs: voicedTurns.reduce((a, t) => a + (t.speakMs ?? 0), 0),
  };
}

/**
 * マイクの音量(RMS)から、話し始めと話していた時間を推定する。
 * 雑音の大きさを追いかけて閾値を決めるので、静かな部屋でも騒がしい場所でもおおむね動く。
 * 音声の中身は扱わず、数値だけを使う。
 */
export class SpeechDetector {
  private noise: number | null = null;
  private aboveSince: number | null = null;
  private lastVoice: number | null = null;
  private segStart: number | null = null;
  private total = 0;
  /** 話していた区間 [始まり, 終わり] */
  private segs: [number, number][] = [];
  private t0: number | null = null;
  onsetAt: number | null = null;

  constructor(
    private opts = { minThreshold: 0.015, ratio: 3, onsetMs: 120, hangoverMs: 400 },
  ) {}

  threshold() {
    return Math.max(this.opts.minThreshold, (this.noise ?? 0) * this.opts.ratio);
  }

  push(rms: number, t: number) {
    if (this.t0 === null) this.t0 = t;
    const th = this.threshold();
    const loud = rms > th;
    // 雑音の推定: 静かなときは素早く下げ、うるさいときはゆっくりしか上げない
    if (this.noise === null) this.noise = Math.min(rms, this.opts.minThreshold);
    else if (!loud) this.noise = rms < this.noise ? rms : this.noise * 0.98 + rms * 0.02;

    if (loud) {
      if (this.aboveSince === null) this.aboveSince = t;
      if (this.segStart === null && t - this.aboveSince >= this.opts.onsetMs) {
        this.segStart = this.aboveSince;
        if (this.onsetAt === null) this.onsetAt = this.aboveSince;
      }
      this.lastVoice = t;
    } else {
      this.aboveSince = null;
      if (this.segStart !== null && this.lastVoice !== null && t - this.lastVoice > this.opts.hangoverMs) {
        this.total += this.lastVoice - this.segStart;
        this.segs.push([this.segStart, this.lastVoice]);
        this.segStart = null;
      }
    }
  }

  /** 話し始めるまでの ms。まだなら null */
  latencyMs() {
    return this.onsetAt === null || this.t0 === null ? null : this.onsetAt - this.t0;
  }

  /** 声が出ていた合計 ms(いま話している区間も含める) */
  speakingMs() {
    const cur = this.segStart !== null && this.lastVoice !== null ? this.lastVoice - this.segStart : 0;
    return this.total + cur;
  }

  /** 話し始めてから、minMs 以上の間をとった回数と、一番長い間(ms) */
  pauses(minMs: number) {
    const segs = this.segStart !== null && this.lastVoice !== null ? [...this.segs, [this.segStart, this.lastVoice] as [number, number]] : this.segs;
    let count = 0;
    let longest = 0;
    for (let i = 1; i < segs.length; i++) {
      const g = segs[i][0] - segs[i - 1][1];
      if (g >= minMs) count++;
      longest = Math.max(longest, g);
    }
    return { count, longest };
  }

  /** 話していて、いまは silenceMs 以上黙っているか */
  finishedSpeaking(t: number, silenceMs: number) {
    return this.onsetAt !== null && this.lastVoice !== null && t - this.lastVoice >= silenceMs;
  }
}

export function rms(buf: Float32Array) {
  let s = 0;
  for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
  return Math.sqrt(s / buf.length);
}
