import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useState } from "react";
import { Back, Refs } from "../components/ui";
import { DRILLS, drillById, type Drill } from "../content/drills";
import { MISSIONS } from "../content/missions";
import { db } from "../lib/db";
import { useNav } from "../lib/nav";

export function Dojo({ drillId }: { drillId?: string }) {
  const go = useNav();
  const attempts = useLiveQuery(() => db.drills.toArray(), []);
  const d = drillId ? drillById(drillId) : undefined;
  if (d) return <DrillRunner key={d.id} drill={d} />;

  return (
    <div>
      <h1>スキル道場</h1>
      <p className="muted">現実の会話で使う「型」を、ひとりで確かめる場所です。知るだけでは身につきにくいので、終わったら現実で 1 回試しましょう。</p>
      <div className="td-card" data-tone="accent">
        <h3>台本会話</h3>
        <p className="small">雑談・職場での質問や報告・頼む・断るの会話を、声に出して練習します。分かれ道つきで、どの返しでも会話は続きます。</p>
        <button className="td-btn" data-variant="primary" type="button" onClick={() => go({ name: "talk" })}>はじめる</button>
      </div>
      <div className="td-card">
        <h3>人前で話すリハーサル</h3>
        <p className="small">時間を決めて声に出して話し、話した時間と間を測ります。録音はしません。</p>
        <button className="td-btn" type="button" onClick={() => go({ name: "rehearsal" })}>はじめる</button>
      </div>
      <h2>型を確かめる</h2>
      {DRILLS.map((x) => {
        const n = attempts?.filter((a) => a.drillId === x.id).length ?? 0;
        return (
          <button key={x.id} className="option" style={{ margin: "var(--space-2) 0" }} onClick={() => go({ name: "dojo", drillId: x.id })}>
            <strong>{x.title}</strong>
            {n > 0 && <span className="small muted">(回答 {n} 回)</span>}
            <br />
            <span className="small muted">{x.rule}</span>
          </button>
        );
      })}
      <div className="td-card">
        <h3>ビデオで自分を見る</h3>
        <p className="small">自分が思っているほど緊張は外から見えていないことを、録画で確かめます。</p>
        <button className="td-btn" type="button" onClick={() => go({ name: "video" })}>はじめる</button>
      </div>
    </div>
  );
}

function DrillRunner({ drill }: { drill: Drill }) {
  const go = useNav();
  const [i, setI] = useState(-1);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  // 正解が先頭に偏らないよう、設問ごとに選択肢の順番を混ぜる
  const items = useMemo(
    () => drill.items.map((it) => ({ ...it, options: [...it.options].sort(() => Math.random() - 0.5) })),
    [drill],
  );
  const item = items[i];
  const related = MISSIONS.filter((m) => m.skillIds?.includes(drill.id));

  const pick = async (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    const correct = item.options[k].good;
    if (correct) setScore((s) => s + 1);
    await db.drills.add({ createdAt: Date.now(), drillId: drill.id, itemId: item.id, correct });
  };

  if (i < 0)
    return (
      <div>
        <Back onClick={() => go({ name: "dojo" })} />
        <h1>{drill.title}</h1>
        <p>{drill.why}</p>
        <div className="td-card" data-tone="accent">
          <p className="small muted">合言葉</p>
          <p><strong>{drill.rule}</strong></p>
        </div>
        <Refs refs={drill.refs} />
        <button className="td-btn block" data-variant="primary" type="button" onClick={() => setI(0)}>{drill.items.length} 問ためす</button>
      </div>
    );

  if (i >= drill.items.length)
    return (
      <div>
        <h1>おつかれさま</h1>
        <p>{drill.items.length} 問中 {score} 問で、よい選択ができました。</p>
        <div className="td-card" data-tone="accent">
          <p className="small muted">合言葉</p>
          <p><strong>{drill.rule}</strong></p>
        </div>
        {related.length > 0 && (
          <>
            <h2>現実で 1 回試す</h2>
            {related.map((m) => (
              <button key={m.id} className="option" style={{ margin: "var(--space-2) 0" }} onClick={() => go({ name: "experiment", missionId: m.id })}>
                <strong>段階 {m.level}: {m.title}</strong>
                <br />
                <span className="small muted">{m.detail}</span>
              </button>
            ))}
          </>
        )}
        <button className="td-btn" type="button" style={{ marginTop: "var(--space-3)" }} onClick={() => go({ name: "dojo" })}>道場にもどる</button>
      </div>
    );

  return (
    <div>
      <Back onClick={() => go({ name: "dojo" })} />
      <p className="muted small">{drill.title} {i + 1} / {drill.items.length}</p>
      <div className="td-card" data-tone="accent">
        <p>{item.prompt}</p>
      </div>
      <p className="small muted">{picked === null ? "どれがよさそう？(よい選択は複数あることも)" : "それぞれの理由"}</p>
      {item.options.map((o, k) => (
        <div key={k}>
          <button
            className={`option ${picked !== null ? (o.good ? "good" : "bad") : ""}`}
            style={{ margin: "var(--space-2) 0" }}
            onClick={() => pick(k)}
            aria-pressed={picked === k}
          >
            {picked === k ? "▶ " : ""}
            {o.text}
          </button>
          {picked !== null && <p className={`feedback ${o.good ? "good" : "bad"}`}>{o.good ? "○" : "△"} {o.feedback}</p>}
        </div>
      ))}
      {picked !== null && (
        <button
          className="td-btn block" data-variant="primary" type="button"
          onClick={() => {
            setPicked(null);
            setI(i + 1);
          }}
        >
          つぎへ
        </button>
      )}
    </div>
  );
}
