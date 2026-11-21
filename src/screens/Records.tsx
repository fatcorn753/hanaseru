import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { LINKS } from "../lib/links";
import { useNav } from "../lib/nav";
import { done, heatmap, summarize } from "../lib/stats";
import type { Experiment } from "../lib/types";

const fmt = (t: number) => new Date(t).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });

export function Records() {
  const go = useNav();
  const exps = useLiveQuery(() => db.experiments.toArray(), []);
  const videos = useLiveQuery(() => db.videos.orderBy("createdAt").reverse().toArray(), []);
  if (!exps || !videos) return null;
  const s = summarize(exps);
  const d = done(exps).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
  const heat = heatmap(exps, 30);
  const learned = d.filter((x) => x.learned);

  if (!d.length && !videos.length)
    return (
      <div>
        <h1>記録</h1>
        <p>まだ記録がありません。最初の実験をしてみましょう。</p>
        <button className="primary" onClick={() => go({ name: "experiment" })}>実験を始める</button>
      </div>
    );

  return (
    <div>
      <h1>記録</h1>
      {s.count > 0 && (
        <div className="card">
          <div className="row" style={{ gap: 24 }}>
            <div>
              <div className="muted small">実験</div>
              <div className="big-number">{s.count}</div>
            </div>
            <div>
              <div className="muted small">最悪の予想が当たった割合</div>
              <div className="big-number">{Math.round((s.worstRate ?? 0) * 100)}%</div>
            </div>
          </div>
          <p className="small">
            予想した確信度は平均 {Math.round(s.avgConfidence!)}%、実際に当たった度合いは平均 {Math.round(s.avgCameTrue!)}%。
            緊張は予想 {s.avgExpectedAnxiety!.toFixed(1)} に対して実際 {s.avgPeakAnxiety!.toFixed(1)}。
          </p>
        </div>
      )}

      {d.length > 0 && (
        <>
          <h2>予想と結果(最近 12 回)</h2>
          <GapChart xs={d.slice(0, 12).reverse()} />
        </>
      )}

      <h2>この 30 日</h2>
      <div className="heat" role="img" aria-label={`30 日間で実験した日は ${heat.filter((h) => h.count).length} 日`}>
        {heat.map((h) => (
          <div key={h.date} className={h.count >= 2 ? "l2" : h.count === 1 ? "l1" : ""} title={`${h.date}: ${h.count} 回`} />
        ))}
      </div>
      <p className="small muted">続けて毎日やる必要はありません。休んだ日があっても、積み重ねは消えません。</p>

      {learned.length > 0 && (
        <>
          <h2>わかったこと</h2>
          <div className="card">
            {learned.map((x) => (
              <div key={x.id} className="list-item">
                「{x.learned}」<span className="muted small"> — {x.title}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {d.length > 0 && (
        <>
          <h2>実験の履歴</h2>
          <div className="card">
            {d.map((x) => (
              <details key={x.id} className="list-item">
                <summary>
                  {fmt(x.doneAt!)} 段階 {x.level} {x.title}
                </summary>
                <p className="small">予想: {x.prediction}(確信度 {x.confidence}% → 当たった度合い {x.cameTrue}%)</p>
                <p className="small">起きたこと: {x.happened}</p>
                {x.safetyBehaviorDropped && <p className="small">やめたお守り行動: {x.safetyBehaviorDropped}</p>}
                <button
                  className="ghost small"
                  onClick={() => {
                    if (confirm("この実験の記録を削除します。元に戻せません。よろしいですか？")) db.experiments.delete(x.id!);
                  }}
                >
                  削除
                </button>
              </details>
            ))}
          </div>
        </>
      )}

      {s.count >= 3 && (
        <div className="card accent small">
          <p>3 回以上実験しましたね。続けやすさや、わかりにくかったところを教えてもらえませんか？</p>
          <a href={LINKS.feedback} target="_blank" rel="noreferrer">感想を送る(GitHub・内容は公開されます)</a>
        </div>
      )}

      {videos.length > 0 && (
        <>
          <h2>ビデオ振り返り</h2>
          <div className="card">
            {videos.map((v) => {
              const p = Math.round((v.predicted.nervous + v.predicted.shaky + v.predicted.awkward) / 3);
              const o = Math.round((v.observed.nervous + v.observed.shaky + v.observed.awkward) / 3);
              return (
                <div key={v.id} className="list-item small">
                  {fmt(v.createdAt)} 予想 {p}% → 見たあと {o}%
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/** 予想した確信度(橙)と実際に当たった度合い(緑)を並べた棒グラフ */
function GapChart({ xs }: { xs: Experiment[] }) {
  const W = 320;
  const H = 140;
  const pad = 22;
  // 件数が少ないときに棒が太くなりすぎないよう、最低 6 本分の幅で割る
  const bw = (W - pad) / Math.max(xs.length, 6);
  const y = (v: number) => H - pad - ((H - pad * 1.5) * v) / 100;
  return (
    <div className="card">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="予想と結果の比較グラフ">
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line x1={pad} x2={W} y1={y(v)} y2={y(v)} stroke="var(--line)" />
            <text x={0} y={y(v) + 4} fontSize="9" fill="var(--muted)">{v}</text>
          </g>
        ))}
        {xs.map((x, i) => {
          const x0 = pad + i * bw + bw * 0.15;
          const w = bw * 0.33;
          return (
            <g key={x.id}>
              <rect x={x0} y={y(x.confidence)} width={w} height={y(0) - y(x.confidence)} fill="var(--warm)" rx={2} />
              <rect x={x0 + w + 1} y={y(x.cameTrue!)} width={w} height={Math.max(1, y(0) - y(x.cameTrue!))} fill="var(--accent)" rx={2} />
            </g>
          );
        })}
      </svg>
      <div className="row small muted">
        <span><span style={{ color: "var(--warm)" }}>■</span> 予想した確信度</span>
        <span><span style={{ color: "var(--accent)" }}>■</span> 実際に当たった度合い</span>
      </div>
    </div>
  );
}
