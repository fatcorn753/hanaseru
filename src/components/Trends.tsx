import { TRACK_INFO } from "../content/missions";
import { scriptById } from "../content/scripts";
import type { TalkPoint, TrackStat } from "../lib/trends";
import { visibleDropped } from "../lib/trends";
import type { Rehearsal } from "../lib/types";

const fmt = (t: number) => new Date(t).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
const sec = (ms: number) => Math.round(ms / 1000);

interface Series {
  label: string;
  color: string;
  values: (number | null)[];
}

/** 折れ線グラフ。null の点は線を切って飛ばす */
export function LineChart({ series, max, label, unit = "" }: { series: Series[]; max: number; label: string; unit?: string }) {
  const W = 320;
  const H = 130;
  const pad = 24;
  const n = Math.max(...series.map((s) => s.values.length));
  const x = (i: number) => pad + (n <= 1 ? (W - pad) / 2 : ((W - pad - 8) * i) / (n - 1));
  const y = (v: number) => H - 16 - ((H - 28) * Math.min(v, max)) / max;
  return (
    <div className="card">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label}>
        {[0, max / 2, max].map((v) => (
          <g key={v}>
            <line x1={pad} x2={W} y1={y(v)} y2={y(v)} stroke="var(--line)" />
            <text x={0} y={y(v) + 4} fontSize="9" fill="var(--muted)">
              {Number.isInteger(v) ? v : v.toFixed(1)}
              {unit}
            </text>
          </g>
        ))}
        {series.map((s) => {
          // null で区切った連続区間ごとに線を引く
          const runs: [number, number][][] = [[]];
          s.values.forEach((v, i) => {
            if (v === null) runs.push([]);
            else runs[runs.length - 1].push([x(i), y(v)]);
          });
          return (
            <g key={s.label}>
              {runs.filter((r) => r.length > 1).map((r, k) => (
                <polyline key={k} points={r.map((p) => p.join(",")).join(" ")} fill="none" stroke={s.color} strokeWidth={2} />
              ))}
              {runs.flat().map(([px, py], k) => (
                <circle key={k} cx={px} cy={py} r={3} fill={s.color} />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="row small muted">
        {series.map((s) => (
          <span key={s.label}>
            <span style={{ color: s.color }}>●</span> {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** 場面ごとの、実験の積み重ねと予想の変わり方 */
export function TrackTable({ stats }: { stats: TrackStat[] }) {
  return (
    <div className="card">
      {stats.map((s) => (
        <div key={s.track} className="list-item">
          <strong>{TRACK_INFO[s.track].name}</strong>
          <p className="small" style={{ margin: "4px 0" }}>
            実験 {s.count} 回・いちばん上は段階 {s.topLevel}・最悪の予想が外れたのは {s.disconfirmed} 回
          </p>
          {s.confidence ? (
            <p className="small" style={{ margin: "4px 0" }}>
              最悪が起きる確信度は、最初の {s.confidence.n} 回の平均 {Math.round(s.confidence.first)}% から、最近の {s.confidence.n} 回は{" "}
              {Math.round(s.confidence.recent)}%。
              {s.expectedAnxiety && (
                <>
                  予想する緊張は {s.expectedAnxiety.first.toFixed(1)} から {s.expectedAnxiety.recent.toFixed(1)}。
                </>
              )}
            </p>
          ) : (
            <p className="small muted" style={{ margin: "4px 0" }}>4 回試すと、最初と最近の予想を比べられます。</p>
          )}
        </div>
      ))}
      <p className="small muted">
        上がる日も下がる日もあります。見てほしいのは、予想した最悪が実際にはどのくらい起きたかです。
      </p>
    </div>
  );
}

export function TalkTrend({ points }: { points: TalkPoint[] }) {
  const voiced = points.filter((p) => p.medianLatencyMs !== null);
  return (
    <>
      {voiced.length >= 2 && (
        <LineChart
          label="台本会話で話し始めるまでの時間の推移"
          unit="秒"
          max={Math.max(3, Math.ceil(Math.max(...voiced.map((p) => p.medianLatencyMs!)) / 1000))}
          series={[{ label: "話し始めるまで(中央値・だいたい)", color: "var(--accent)", values: voiced.map((p) => p.medianLatencyMs! / 1000) }]}
        />
      )}
      <div className="card">
        {[...points].reverse().slice(0, 10).map((p, i) => (
          <div key={i} className="list-item small">
            {fmt(p.createdAt)} {scriptById(p.scriptId)?.title ?? p.scriptId}: よい返し {p.good}/{p.turns}
            {p.medianLatencyMs !== null && (
              <>・話し始めまで約 {(p.medianLatencyMs / 1000).toFixed(1)} 秒・声 {sec(p.speakMs)} 秒</>
            )}
          </div>
        ))}
        <p className="small muted">
          返事の速さはマイクの音量からの目安で、ずれることがあります。速さより、相手の話に乗れたかを大事にしてください。
        </p>
      </div>
    </>
  );
}

export function RehearsalTrend({ rs }: { rs: Rehearsal[] }) {
  const dropped = visibleDropped(rs);
  const rated = rs.filter((r) => r.afterVisible !== undefined).length;
  return (
    <>
      {rs.length >= 2 && (
        <LineChart
          label="リハーサルで、緊張が外から見えると思った度合いの推移"
          max={10}
          series={[
            { label: "話す前の予想", color: "var(--warm)", values: rs.map((r) => r.predictedVisible) },
            { label: "話したあと", color: "var(--accent)", values: rs.map((r) => r.afterVisible ?? null) },
          ]}
        />
      )}
      <div className="card">
        {rated > 0 && (
          <p className="small">
            {rated} 回のうち {dropped} 回は、話したあとの見積もりが話す前より低くなりました。
          </p>
        )}
        {[...rs].reverse().slice(0, 10).map((r) => (
          <div key={r.id ?? r.createdAt} className="list-item small">
            {fmt(r.createdAt)} {r.topic ?? "自由なテーマ"}: {r.seconds} 秒
            {r.speakMs !== undefined && <>・声 {sec(r.speakMs)} 秒・2 秒以上の間 {r.pauses ?? 0} 回</>}
          </div>
        ))}
      </div>
    </>
  );
}
