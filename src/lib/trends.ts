import { TRACKS, trackOf } from "../content/missions";
import { done } from "./stats";
import { summarizeTalk } from "./talk";
import type { Experiment, Level, Rehearsal, TalkLog, Track } from "./types";

const avg = (ns: number[]) => (ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : null);

/**
 * 最初の数回と最近の数回の平均を比べる。
 * 区間が重ならないよう、各区間は最大 3 回・全体の半分まで。4 回未満なら比べない。
 */
export function firstVsRecent(values: number[]): { first: number; recent: number; n: number } | null {
  if (values.length < 4) return null;
  const n = Math.min(3, Math.floor(values.length / 2));
  return { first: avg(values.slice(0, n))!, recent: avg(values.slice(-n))!, n };
}

export interface TrackStat {
  track: Track;
  count: number;
  topLevel: Level;
  /** 最悪の予想が外れた(当たった度合い 50 未満)回数 */
  disconfirmed: number;
  /** 予想した確信度の、最初と最近の比較 */
  confidence: ReturnType<typeof firstVsRecent>;
  /** 予想した緊張の、最初と最近の比較 */
  expectedAnxiety: ReturnType<typeof firstVsRecent>;
}

/** 場面ごとの、終わった実験のまとめ。実験のない場面は含めない */
export function trackStats(xs: Experiment[]): TrackStat[] {
  const d = done(xs).sort((a, b) => (a.doneAt ?? 0) - (b.doneAt ?? 0));
  return TRACKS.flatMap((track) => {
    const t = d.filter((x) => trackOf(x) === track);
    if (!t.length) return [];
    return [
      {
        track,
        count: t.length,
        topLevel: Math.max(...t.map((x) => x.level)) as Level,
        disconfirmed: t.filter((x) => (x.cameTrue ?? 100) < 50).length,
        confidence: firstVsRecent(t.map((x) => x.confidence)),
        expectedAnxiety: firstVsRecent(t.map((x) => x.expectedAnxiety)),
      },
    ];
  });
}

export interface TalkPoint {
  createdAt: number;
  scriptId: string;
  /** 話し始めるまでの時間の中央値(ms)。声を使わなかった回は null */
  medianLatencyMs: number | null;
  speakMs: number;
  voiced: number;
  good: number;
  turns: number;
}

/** 台本会話の回ごとの数値(古い順)。途中でやめた回は含めない */
export function talkTrend(logs: TalkLog[]): TalkPoint[] {
  return logs
    .filter((l) => l.finished)
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((l) => {
      const s = summarizeTalk(l.turns);
      return { createdAt: l.createdAt, scriptId: l.scriptId, medianLatencyMs: s.medianLatencyMs, speakMs: s.speakMs, voiced: s.voiced, good: s.good, turns: s.turns };
    });
}

/** リハーサルの記録(古い順) */
export const rehearsalTrend = (rs: Rehearsal[]) => [...rs].sort((a, b) => a.createdAt - b.createdAt);

/**
 * 話す前の予想より、話したあとの見積もりが低かった回数。
 * 透明性の錯覚(緊張は思うほど外に伝わらない)に気づけた回の目安。
 */
export const visibleDropped = (rs: Rehearsal[]) =>
  rs.filter((r) => r.afterVisible !== undefined && r.afterVisible < r.predictedVisible).length;
