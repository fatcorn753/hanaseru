import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Back, Refs, Scale } from "../components/ui";
import { db } from "../lib/db";
import { useNav } from "../lib/nav";
import { Compassion } from "./Foundation";

/**
 * 会話後の反省会(post-event processing)に割り込む。
 * 「考えないようにする」は反動で増えるので、事実の仕分けか自分への思いやりに切り替える。
 */
export function Pep({ experimentId }: { experimentId: number }) {
  const go = useNav();
  const exp = useLiveQuery(() => db.experiments.get(experimentId), [experimentId]);
  const [mode, setMode] = useState<"pick" | "facts" | "compassion" | "end">("pick");
  const [scene, setScene] = useState("");
  const [facts, setFacts] = useState("");
  const [other, setOther] = useState("");
  const [helpful, setHelpful] = useState(30);
  const [via, setVia] = useState<"facts" | "compassion">("facts");

  const finish = async () => {
    await db.experiments.update(experimentId, { pepChecked: true });
  };

  if (!exp) return null;

  if (mode === "compassion")
    return <Compassion experimentId={experimentId} onBack={() => setMode("end")} onDone={finish} />;

  return (
    <div>
      <Back onClick={() => go({ name: "home" })} />
      <h1>反省会を整える</h1>
      <p className="small muted">実験: {exp.title}</p>

      {mode === "pick" && (
        <>
          <p>会話のあと、うまくいかなかった場面を何度も思い返すのは自然なことです。ただ、繰り返すほど次の会話が怖くなりやすいことがわかっています。どちらかを 2 分だけ。</p>
          <button className="option" style={{ margin: "6px 0" }} onClick={() => setMode("facts")}>
            <strong>事実と解釈を分ける</strong>
            <br />
            <span className="small muted">頭の中の場面を、見聞きしたことと想像に仕分ける</span>
          </button>
          <button className="option" style={{ margin: "6px 0" }} onClick={() => { setVia("compassion"); setMode("compassion"); }}>
            <strong>自分に声をかける</strong>
            <br />
            <span className="small muted">友達にかけるような言葉を、自分にかける</span>
          </button>
          <Refs refs={["Brozovich & Heimberg (2008) Clinical Psychology Review", "Shikatani et al. (2014) J. Anxiety Disorders"]} />
        </>
      )}

      {mode === "facts" && (
        <>
          {exp.happened && <div className="card accent small">あなたが記録した事実: {exp.happened}</div>}
          <label htmlFor="scene">頭の中で繰り返している場面</label>
          <textarea id="scene" value={scene} onChange={(e) => setScene(e.target.value)} placeholder="例: 話の途中で言葉に詰まって、相手が一瞬黙った" />
          <label htmlFor="facts">そのうち、実際に見聞きしたこと</label>
          <textarea id="facts" value={facts} onChange={(e) => setFacts(e.target.value)} placeholder="例: 相手は 1 秒黙って、そのあと「うんうん」と言った" />
          <label htmlFor="other">ほかの見方(友達が同じことをしたら、どう思う？)</label>
          <textarea id="other" value={other} onChange={(e) => setOther(e.target.value)} placeholder="例: 考えながら話しているんだな、くらいにしか思わない" />
          <button
            className="primary block"
            style={{ marginTop: 12 }}
            disabled={!facts.trim() || !other.trim()}
            onClick={() => setMode("end")}
          >
            できた
          </button>
        </>
      )}

      {mode === "end" && (
        <>
          <p>最後に一つだけ。</p>
          <Scale label="さっきまでの反省会は、次の会話の役に立ちそう？" value={helpful} onChange={setHelpful} max={100} unit="%" low="全く" high="とても" />
          <p className="small muted">反省を繰り返しても、次がうまくいくとは限りません。ここで区切って、続きは次の実験で確かめましょう。</p>
          <button
            className="primary block"
            onClick={async () => {
              await db.reflections.add({
                createdAt: Date.now(),
                experimentId,
                kind: via,
                // 自分への声かけの本文は Compassion 側で保存済みなので、ここでは評価だけ残す
                text: via === "facts" ? [scene, facts, other].join("\n") : undefined,
                helpful,
              });
              await finish();
              go({ name: "home" });
            }}
          >
            ここで区切る
          </button>
        </>
      )}
    </div>
  );
}
