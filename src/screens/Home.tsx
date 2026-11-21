import { useLiveQuery } from "dexie-react-hooks";
import { LEVEL_NAMES } from "../content/missions";
import { localDate } from "../lib/date";
import { db, getProfile } from "../lib/db";
import { useNav } from "../lib/nav";
import { DEFAULT_WEEKLY_GOAL, goalProgress, pendingPep, pendingReview, recommendLevel, summarize, weekStart, weekSummary } from "../lib/stats";
import type { SleepQuality } from "../lib/types";

const SLEEP: { q: SleepQuality; label: string }[] = [
  { q: "poor", label: "足りない" },
  { q: "ok", label: "ふつう" },
  { q: "good", label: "よく眠れた" },
];

export function Home() {
  const go = useNav();
  const today = localDate();
  const exps = useLiveQuery(() => db.experiments.toArray(), []);
  const sleep = useLiveQuery(() => db.sleep.get(today), [today]);
  const profile = useLiveQuery(() => getProfile(), []);
  if (!exps || !profile) return null;

  const rec = recommendLevel(exps, sleep?.quality);
  const pep = pendingPep(exps);
  const planned = exps.filter((x) => x.status === "planned").sort((a, b) => b.createdAt - a.createdAt);
  const s = summarize(exps);
  const review = pendingReview(exps, profile.lastReviewedWeek);
  const thisWeek = weekSummary(exps, weekStart());
  const goal = goalProgress(thisWeek.count, profile.weeklyGoal ?? DEFAULT_WEEKLY_GOAL);

  return (
    <div>
      <div className="row">
        <h1>はなせる</h1>
        <span className="spacer" />
        <button className="ghost" onClick={() => go({ name: "settings" })} aria-label="設定">設定</button>
      </div>

      {pep && (
        <div className="card warm">
          <p><strong>「{pep.title}」のあと、頭の中で反省会をしていませんか？</strong></p>
          <div className="row">
            <button className="primary" onClick={() => go({ name: "pep", experimentId: pep.id! })}>2 分で整える</button>
            <button onClick={() => db.experiments.update(pep.id!, { pepChecked: true })}>していない</button>
          </div>
        </div>
      )}

      {review && (
        <div className="card accent">
          <p>
            <strong>先週の振り返り</strong> — 実験 {review.count} 回、最悪の予想が外れたのは {review.disconfirmed} 回。
          </p>
          <button className="primary" onClick={() => go({ name: "review", weekStart: review.start })}>
            2 分で振り返る
          </button>
        </div>
      )}

      <div className="card">
        <p className="muted small">昨夜の睡眠</p>
        <div className="row">
          {SLEEP.map((o) => (
            <button key={o.q} className="chip" aria-pressed={sleep?.quality === o.q} onClick={() => db.sleep.put({ date: today, quality: o.q })}>
              {o.label}
            </button>
          ))}
        </div>
        {sleep?.quality === "poor" && <p className="small muted">睡眠が足りない日は対人の不安が強まりやすいので、今日は軽めでかまいません。</p>}
      </div>

      {planned.length > 0 && (
        <div className="card accent">
          <h3>結果を待っている実験</h3>
          {planned.map((x) => (
            <div key={x.id} className="row list-item">
              <span>{x.title}</span>
              <span className="spacer" />
              <button className="primary" onClick={() => go({ name: "experiment", resumeId: x.id })}>結果を書く</button>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <p className="muted small">今日のおすすめ</p>
        <h2 style={{ marginTop: 0 }}>段階 {rec.level}: {LEVEL_NAMES[rec.level]}</h2>
        <p className="small">{rec.reason}</p>
        <button className="primary block" onClick={() => go({ name: "experiment" })}>実験を始める</button>
      </div>

      <p className="small">{goal.state === "todo" ? "" : "✓ "}{goal.text}</p>
      {profile.weeklyFocus && <p className="small">今週意識すること: {profile.weeklyFocus}</p>}
      {profile.ifThen && (
        <p className="muted small">あなたのきっかけ: もし{profile.ifThen.when}、{profile.ifThen.then}。</p>
      )}

      <h2>会話の直前に</h2>
      <div className="row">
        <button onClick={() => go({ name: "foundation", tool: "breath" })}>ため息呼吸 1 分</button>
        <button onClick={() => go({ name: "foundation", tool: "reappraisal" })}>ドキドキの読み替え</button>
        <button onClick={() => go({ name: "foundation", tool: "worry" })}>心配の書き出し</button>
      </div>

      <h2>ひとりで練習</h2>
      <div className="row">
        <button onClick={() => go({ name: "dojo" })}>スキル道場</button>
        <button onClick={() => go({ name: "video" })}>ビデオで自分を見る</button>
      </div>

      {s.count > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <p className="muted small">これまで</p>
          <p>
            実験 <strong>{s.count}</strong> 回。最悪の予想がおおむね当たったのは{" "}
            <strong>{Math.round((s.worstRate ?? 0) * 100)}%</strong>。
          </p>
          <button className="ghost" onClick={() => go({ name: "records" })}>記録を見る →</button>
        </div>
      )}
    </div>
  );
}
