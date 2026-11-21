import { addDays, localDate } from "./date";
import { trackOf } from "../content/missions";
import type { Experiment, Level, SleepQuality, Track } from "./types";

export const done = (xs: Experiment[]) =>
  xs.filter((x) => x.status === "done" && x.cameTrue !== undefined && x.peakAnxiety !== undefined);

/** 予想と結果の差。正の値ほど「思ったより大丈夫だった」 */
export function gap(x: Experiment) {
  return {
    belief: x.confidence - (x.cameTrue ?? x.confidence),
    anxiety: x.expectedAnxiety - (x.peakAnxiety ?? x.expectedAnxiety),
  };
}

export interface Summary {
  count: number;
  /** 最悪の予想が「おおむね当たった」(cameTrue>=50)割合 0–1。データがなければ null */
  worstRate: number | null;
  avgConfidence: number | null;
  avgCameTrue: number | null;
  avgExpectedAnxiety: number | null;
  avgPeakAnxiety: number | null;
}

const avg = (ns: number[]) => (ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : null);

export function summarize(xs: Experiment[]): Summary {
  const d = done(xs);
  return {
    count: d.length,
    worstRate: d.length ? d.filter((x) => (x.cameTrue ?? 0) >= 50).length / d.length : null,
    avgConfidence: avg(d.map((x) => x.confidence)),
    avgCameTrue: avg(d.map((x) => x.cameTrue!)),
    avgExpectedAnxiety: avg(d.map((x) => x.expectedAnxiety)),
    avgPeakAnxiety: avg(d.map((x) => x.peakAnxiety!)),
  };
}

export interface Recommendation {
  level: Level;
  reason: string;
}

const clampLevel = (n: number): Level => Math.min(6, Math.max(1, Math.round(n))) as Level;

/**
 * 次に挑む段階を提案する。
 * 不安が下がることではなく「予想が外れた体験」が続いたら上げる(制止学習の考え方)。
 * 睡眠不足の日は対人不安が上がりやすいので 1 段下げる。
 */
export function recommendLevel(xs: Experiment[], sleep?: SleepQuality, track: Track = "chat"): Recommendation {
  const d = done(xs).filter((x) => trackOf(x) === track).sort((a, b) => (a.doneAt ?? 0) - (b.doneAt ?? 0));
  let level: Level = 1;
  let reason = "まずは一番やさしい段から始めましょう。";
  if (d.length) {
    const top = Math.max(...d.map((x) => x.level)) as Level;
    const atTop = d.filter((x) => x.level === top).slice(-3);
    const disconfirmed = atTop.filter((x) => (x.cameTrue ?? 100) < 50).length;
    const overwhelmed = atTop.some((x) => (x.peakAnxiety ?? 0) >= 9);
    if (overwhelmed) {
      level = clampLevel(top - 1);
      reason = "前回かなりきつかったので、1 段下げて足場を固めましょう。";
    } else if (atTop.length >= 2 && disconfirmed >= 2) {
      level = clampLevel(top + 1);
      reason = `段階 ${top} で予想が外れる体験が ${disconfirmed} 回ありました。次の段へ進めます。`;
    } else {
      level = top;
      reason = `段階 ${top} で、相手や場所を変えてもう少し試しましょう。`;
    }
  }
  if (sleep === "poor" && level > 1) {
    level = clampLevel(level - 1);
    reason += " 今日は睡眠が足りないので 1 段軽くしています。";
  }
  return { level, reason };
}

/** 直近 days 日の日別実験回数(古い順) */
export function heatmap(xs: Experiment[], days = 30, now = Date.now()) {
  const counts = new Map<string, number>();
  for (const x of done(xs)) {
    const k = localDate(x.doneAt ?? x.createdAt);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const out: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = localDate(addDays(now, -i));
    out.push({ date, count: counts.get(date) ?? 0 });
  }
  return out;
}

const HOUR = 3600_000;

/**
 * 会話後の反省会チェックを出すべき実験。
 * 終了から 15 分〜48 時間で、まだチェックしていないもの。
 */
export function pendingPep(xs: Experiment[], now = Date.now()) {
  return done(xs).find(
    (x) => !x.pepChecked && x.doneAt !== undefined && now - x.doneAt >= 0.25 * HOUR && now - x.doneAt <= 48 * HOUR,
  );
}

/** その日を含む週の月曜 0:00(端末のローカル時刻) */
export function weekStart(t: number = Date.now()): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // 月曜を 0 にする
  d.setDate(d.getDate() - dow);
  return d.getTime();
}

export const weekKey = (t: number = Date.now()) => localDate(weekStart(t));

export interface WeekSummary {
  key: string;
  /** 週の月曜 0:00 のタイムスタンプ */
  start: number;
  count: number;
  /** 最悪の予想が外れた(cameTrue<50)回数 */
  disconfirmed: number;
  avgBeliefGap: number | null;
  avgAnxietyGap: number | null;
  learned: string[];
  dropped: string[];
}

/** weekStartMs から 7 日間の、終わった実験のまとめ */
export function weekSummary(xs: Experiment[], weekStartMs: number): WeekSummary {
  const end = addDays(weekStartMs, 7);
  const w = done(xs).filter((x) => (x.doneAt ?? 0) >= weekStartMs && (x.doneAt ?? 0) < end);
  return {
    key: localDate(weekStartMs),
    start: weekStartMs,
    count: w.length,
    disconfirmed: w.filter((x) => (x.cameTrue ?? 100) < 50).length,
    avgBeliefGap: avg(w.map((x) => gap(x).belief)),
    avgAnxietyGap: avg(w.map((x) => gap(x).anxiety)),
    learned: w.filter((x) => x.learned).map((x) => x.learned!),
    dropped: [...new Set(w.filter((x) => x.safetyBehaviorDropped).map((x) => x.safetyBehaviorDropped!))],
  };
}

/**
 * 振り返りを出すべき週。先週に実験があり、まだ振り返っていなければ先週を返す。
 * 休んだ週は責めないよう、何も出さない。
 */
export function pendingReview(xs: Experiment[], lastReviewed: string | undefined, now = Date.now()) {
  const prev = addDays(weekStart(now), -7);
  const key = localDate(prev);
  if (lastReviewed !== undefined && lastReviewed >= key) return undefined;
  const s = weekSummary(xs, prev);
  return s.count > 0 ? s : undefined;
}

export const DEFAULT_WEEKLY_GOAL = 3;

/**
 * 週の目標の進み具合。1 回分の休み枠を持たせ、目標より 1 回少なくても達成扱いにする。
 * 休み枠つきの目標は、厳しい目標より続きやすい(Sharif & Shu 2017)。
 */
export function goalProgress(count: number, goal = DEFAULT_WEEKLY_GOAL) {
  if (count >= goal) return { state: "done" as const, text: `今週の目標 ${goal} 回を達成しました` };
  if (goal > 1 && count === goal - 1)
    return { state: "reserve" as const, text: `今週 ${count} 回。休み枠を使えば達成です(もう 1 回できたら満点)` };
  return { state: "todo" as const, text: `今週 ${count} / ${goal} 回(休み枠 1 回つき)` };
}
