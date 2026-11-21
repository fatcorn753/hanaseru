import { useEffect, useMemo, useState } from "react";
import { Back, Refs, fmtTime, useCountdown } from "../components/ui";
import { BREATHS, PMR, PMR_STEPS, REAPPRAISAL, SELF_COMPASSION, WORRY_DUMP, type BreathPattern } from "../content/foundation";
import { db } from "../lib/db";
import { useNav, type Route } from "../lib/nav";

type Tool = NonNullable<Extract<Route, { name: "foundation" }>["tool"]>;

const TOOLS: { id: Tool; title: string; desc: string }[] = [
  { id: "breath", title: "呼吸", desc: "直前の 1 分、または朝晩の 5 分" },
  { id: "reappraisal", title: "ドキドキの読み替え", desc: "落ち着こうとせず、エネルギーとして使う" },
  { id: "worry", title: "心配の書き出し", desc: "3 分だけ頭の中を外に出す" },
  { id: "pmr", title: "力を入れて抜く", desc: "肩や手のこわばりをゆるめる 1 分" },
  { id: "compassion", title: "反省会を止める", desc: "会話のあとの自分にかける言葉" },
];

export function Foundation({ tool }: { tool?: Tool }) {
  const go = useNav();
  const back = () => history.back();
  if (tool === "breath") return <Breath onBack={back} />;
  if (tool === "reappraisal") return <Reappraisal onBack={back} />;
  if (tool === "worry") return <WorryDump onBack={back} />;
  if (tool === "pmr") return <Pmr onBack={back} />;
  if (tool === "compassion") return <Compassion onBack={back} />;
  return (
    <div>
      <h1>整える</h1>
      <p className="muted">会話そのものではなく、会話を支える体と心の土台です。単体で続けるより、実験の前後に使うと効果的です。</p>
      {TOOLS.map((t) => (
        <button key={t.id} className="option" style={{ margin: "var(--space-2) 0" }} onClick={() => go({ name: "foundation", tool: t.id })}>
          <strong>{t.title}</strong>
          <br />
          <span className="small muted">{t.desc}</span>
        </button>
      ))}
      <div className="td-card">
        <h3>睡眠と運動</h3>
        <p className="small">
          睡眠が足りないと、人との距離をとりたくなり、不安も強まりやすくなります。ホームで睡眠を記録すると、その日の課題が軽めになります。会う前の 5〜10 分の散歩も、緊張をやわらげる助けになります。
        </p>
        <Refs refs={["Ben Simon & Walker (2018) Nature Communications", "Singh et al. (2023) Br. J. Sports Medicine"]} />
      </div>
    </div>
  );
}

function Breath({ onBack }: { onBack: () => void }) {
  const [p, setP] = useState<BreathPattern>(BREATHS[0]);
  const [running, setRunning] = useState(false);
  const left = useCountdown(p.defaultSeconds, running);
  const cycle = p.phases.reduce((a, x) => a + x.sec, 0);
  const elapsed = p.defaultSeconds - left;
  const [tick, setTick] = useState(0);

  // 0.1 秒刻みで段階を進める(カウントダウンは 1 秒単位なので別に持つ)
  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    const t = setInterval(() => setTick((Date.now() - start) / 1000), 100);
    return () => clearInterval(t);
  }, [running]);

  const { phase, scale } = useMemo(() => {
    let t = tick % cycle;
    let size = 0.6;
    for (const ph of p.phases) {
      if (t < ph.sec) {
        const r = t / ph.sec;
        if (ph.kind === "吸う") size = 0.6 + 0.3 * r;
        else if (ph.kind === "もう一度吸う") size = 0.9 + 0.1 * r;
        else if (ph.kind === "吐く") size = 1 - 0.4 * r;
        return { phase: ph.kind, scale: size };
      }
      t -= ph.sec;
    }
    return { phase: p.phases[0].kind, scale: 0.6 };
  }, [tick, cycle, p]);

  // 段階が変わったときに短く振動させる(対応端末のみ)。人前でも画面を見ずに使える
  useEffect(() => {
    if (running && "vibrate" in navigator) navigator.vibrate?.(phase === "吐く" ? 60 : 20);
  }, [phase, running]);

  useEffect(() => {
    if (left === 0) setRunning(false);
  }, [left]);

  return (
    <div>
      <Back onClick={onBack} />
      <h1>呼吸</h1>
      <div className="row">
        {BREATHS.map((b) => (
          <button key={b.id} className="chip" aria-pressed={b.id === p.id} onClick={() => { setRunning(false); setTick(0); setP(b); }}>
            {b.name}
          </button>
        ))}
      </div>
      <p className="small muted">{p.when}。{p.phases.map((x) => `${x.kind} ${x.sec} 秒`).join(" → ")}</p>
      <div className="pacer" style={{ transform: `scale(${running ? scale : 0.8})`, transitionDuration: "100ms" }} aria-live="polite">
        {running ? phase : left === 0 ? "おわり" : "準備"}
      </div>
      <p style={{ textAlign: "center" }} className="big-number">{fmtTime(left)}</p>
      <div className="row" style={{ justifyContent: "center" }}>
        {left === 0 ? (
          <button className="td-btn" data-variant="primary" type="button" onClick={onBack}>もどる</button>
        ) : (
          <button className="td-btn" data-variant="primary" type="button" onClick={() => setRunning(!running)}>{running ? "一時停止" : elapsed ? "再開" : "はじめる"}</button>
        )}
      </div>
      <p className="small muted">息苦しくなったら、普通の呼吸に戻してかまいません。息を止める練習はしません。</p>
      <Refs refs={[p.ref]} />
    </div>
  );
}

function Reappraisal({ onBack }: { onBack: () => void }) {
  const [chosen, setChosen] = useState<string | null>(null);
  return (
    <div>
      <Back onClick={onBack} />
      <h1>{REAPPRAISAL.title}</h1>
      <div className="td-card stack" data-tone="accent">
        {REAPPRAISAL.body.map((b) => <p key={b}>{b}</p>)}
      </div>
      {REAPPRAISAL.choices.map((c) => (
        <button key={c} className="option" style={{ margin: "var(--space-2) 0" }} aria-pressed={chosen === c} onClick={() => setChosen(c)}>
          「{c}」
        </button>
      ))}
      {chosen && <p><strong>「{chosen}」</strong> — そのドキドキのまま、行ってらっしゃい。</p>}
      <p className="small muted">{REAPPRAISAL.caution}</p>
      <Refs refs={[REAPPRAISAL.ref]} />
    </div>
  );
}

function WorryDump({ onBack }: { onBack: () => void }) {
  const [text, setText] = useState("");
  const [running, setRunning] = useState(false);
  const left = useCountdown(WORRY_DUMP.seconds, running);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (left === 0 && running) {
      setRunning(false);
      setDone(true);
    }
  }, [left, running]);

  return (
    <div>
      <Back onClick={onBack} />
      <h1>{WORRY_DUMP.title}</h1>
      <p>{WORRY_DUMP.body}</p>
      {!done ? (
        <>
          <p className="big-number">{fmtTime(left)}</p>
          <textarea className="td-input"
            aria-label="心配ごと"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (!running && !done) setRunning(true);
            }}
            placeholder="書き始めるとタイマーが動きます"
            style={{ minHeight: 200 }}
          />
          <button className="td-btn" type="button" style={{ marginTop: "var(--space-2)" }} onClick={() => { setRunning(false); setDone(true); }}>書き終えた</button>
        </>
      ) : (
        <div className="td-card" data-tone="accent">
          <p>書き出せました。この文章は保存しません。</p>
          <p className="small">ここからは、相手のことに注意を向けましょう。</p>
          <button
            className="td-btn" data-variant="primary" type="button"
            onClick={() => {
              setText("");
              onBack();
            }}
          >
            閉じる
          </button>
          <button
            className="td-btn" data-variant="ghost" type="button"
            onClick={async () => {
              await db.reflections.add({ createdAt: Date.now(), kind: "worry-dump", text });
              setText("");
              onBack();
            }}
          >
            残しておきたい場合は保存
          </button>
        </div>
      )}
      <Refs refs={[WORRY_DUMP.ref]} />
    </div>
  );
}

function Pmr({ onBack }: { onBack: () => void }) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (startedAt === null) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [startedAt]);
  // 経過時間から「何か所目・力を入れる/抜く・残り秒」を導く。状態を連鎖させないので段の飛ばしが起きない
  const per = PMR.tenseSec + PMR.releaseSec;
  const elapsed = startedAt === null ? -1 : (now - startedAt) / 1000;
  const i = elapsed < 0 ? -1 : Math.floor(elapsed / per);
  const inStep = elapsed - i * per;
  const tense = inStep < PMR.tenseSec;
  const left = Math.ceil(tense ? PMR.tenseSec - inStep : per - inStep);
  const step = i >= 0 ? PMR_STEPS[i] : undefined;
  return (
    <div>
      <Back onClick={onBack} />
      <h1>{PMR.title}</h1>
      {i < 0 && (
        <>
          <p>体の 4 か所に、{PMR.tenseSec} 秒力を入れて、{PMR.releaseSec} 秒ゆるめます。座ったままでも、人前でも目立たずにできます。</p>
          <p className="small muted">{PMR.caution}</p>
          <button className="td-btn" data-variant="primary" type="button" onClick={() => { setNow(Date.now()); setStartedAt(Date.now()); }}>はじめる</button>
        </>
      )}
      {step && (
        <div className="td-card" data-tone="accent" aria-live="polite">
          <p className="muted small">{i + 1} / {PMR_STEPS.length}</p>
          <h2>{step.part}</h2>
          <p className="big-number">{tense ? step.tense : "ふっとゆるめる"}</p>
          <p>{left} 秒</p>
        </div>
      )}
      {i >= PMR_STEPS.length && (
        <div className="td-card" data-tone="accent">
          <p>おわりです。ゆるんだ感じを少し味わってから戻りましょう。</p>
          <button className="td-btn" data-variant="primary" type="button" onClick={onBack}>もどる</button>
        </div>
      )}
      <Refs refs={[PMR.ref]} />
    </div>
  );
}

export function Compassion({ onBack, experimentId, onDone }: { onBack: () => void; experimentId?: number; onDone?: () => void }) {
  const [texts, setTexts] = useState<string[]>(SELF_COMPASSION.steps.map(() => ""));
  const [saved, setSaved] = useState(false);
  return (
    <div>
      <Back onClick={onBack} />
      <h1>{SELF_COMPASSION.title}</h1>
      <p className="small muted">{SELF_COMPASSION.note}</p>
      {SELF_COMPASSION.steps.map((s, k) => (
        <div key={k}>
          <label className="td-label" htmlFor={`sc${k}`}>{k + 1}. {s.label}</label>
          <textarea className="td-input" id={`sc${k}`} value={texts[k]} placeholder={s.hint} onChange={(e) => setTexts(texts.map((t, j) => (j === k ? e.target.value : t)))} />
        </div>
      ))}
      {!saved ? (
        <button
          className="td-btn block" data-variant="primary" type="button"
          style={{ marginTop: "var(--space-3)" }}
          disabled={!texts[2].trim()}
          onClick={async () => {
            await db.reflections.add({ createdAt: Date.now(), kind: "compassion", experimentId, text: texts.join("\n") });
            setSaved(true);
            onDone?.();
          }}
        >
          書けた
        </button>
      ) : (
        <div className="td-card" data-tone="accent">
          <p>自分にかけた言葉: 「{texts[2]}」</p>
          <button className="td-btn" data-variant="primary" type="button" onClick={onBack}>もどる</button>
        </div>
      )}
      <Refs refs={[SELF_COMPASSION.ref]} />
    </div>
  );
}
