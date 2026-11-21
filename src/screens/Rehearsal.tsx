import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef, useState } from "react";
import { Back, Chips, Refs, Scale, fmtTime, useCountdown } from "../components/ui";
import { MISSIONS, trackOfMission } from "../content/missions";
import { db } from "../lib/db";
import { useNav } from "../lib/nav";
import { listen, openMic, type Listener, type Mic } from "../lib/speech";
import type { Rehearsal as RehearsalLog } from "../lib/types";

const DURATIONS = [1, 2, 3, 5];
const FOCUSES = [
  "聞いている誰か一人に向けて話す",
  "文の終わりで 1 拍置く",
  "原稿を見ずに、要点だけで話す",
  "言いよどんでも、そのまま続ける",
];
const PAUSE_MS = 2000;

type Phase = "setup" | "run" | "after" | "done";
type Result = { speakMs: number; pauses: number; longestPauseMs: number } | null;

/**
 * 人前で話すリハーサル。声に出して話し、話した時間と間を端末の中で測る。
 * 話す前と後に「緊張は外からどのくらいわかるか」を見積もり、ビデオ振り返りにつなげる(透明性の錯覚)。
 */
export function Rehearsal() {
  const go = useNav();
  const past = useLiveQuery(() => db.rehearsals.orderBy("createdAt").reverse().limit(1).toArray(), []);
  const [phase, setPhase] = useState<Phase>("setup");
  const [topic, setTopic] = useState("");
  const [minutes, setMinutes] = useState(1);
  const [focus, setFocus] = useState<string[]>([FOCUSES[0]]);
  const [predicted, setPredicted] = useState(6);
  const [after, setAfter] = useState(5);
  const [level, setLevel] = useState(0);
  const [micNote, setMicNote] = useState<string | null>(null);
  const [result, setResult] = useState<Result>(null);
  const [startedAt, setStartedAt] = useState(0);
  // 比べる相手は、今回を始める前の最新の記録
  const [prev, setPrev] = useState<RehearsalLog | undefined>(undefined);

  const mic = useRef<Mic | null>(null);
  const lis = useRef<Listener | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const left = useCountdown(minutes * 60, phase === "run");

  const stopMic = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    let r: Result = null;
    if (lis.current) {
      const s = lis.current.stop();
      const p = lis.current.detector.pauses(PAUSE_MS);
      r = { speakMs: s.speakMs, pauses: p.count, longestPauseMs: Math.round(p.longest) };
    }
    lis.current = null;
    mic.current?.close();
    mic.current = null;
    return r;
  };

  useEffect(() => () => void stopMic(), []);

  const finishRun = () => {
    setResult(stopMic());
    setLevel(0);
    setPhase("after");
  };

  useEffect(() => {
    if (phase === "run" && left === 0) finishRun();
    // finishRun は時間切れのときだけ呼ぶ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, phase]);

  const start = async () => {
    setStartedAt(Date.now());
    setPrev(past?.[0]);
    setPhase("run");
    try {
      const m = await openMic();
      mic.current = m;
      lis.current = listen(m);
      timer.current = setInterval(() => setLevel(lis.current?.level() ?? 0), 100);
    } catch {
      setMicNote("マイクを使えなかったので、時間だけ計ります。");
    }
  };

  const save = async () => {
    await db.rehearsals.add({
      createdAt: startedAt,
      seconds: minutes * 60 - left,
      topic: topic.trim() || undefined,
      focus: focus[0],
      predictedVisible: predicted,
      afterVisible: after,
      ...(result ? { speakMs: result.speakMs, pauses: result.pauses, longestPauseMs: result.longestPauseMs } : {}),
    });
    setPhase("done");
  };

  const next = MISSIONS.filter((m) => trackOfMission(m) === "speech" && m.level >= 2 && m.level <= 4);

  if (phase === "setup")
    return (
      <div>
        <Back onClick={() => go({ name: "dojo" })} />
        <h1>人前で話すリハーサル</h1>
        <p className="muted">
          声に出して、決めた時間だけ話します。マイクは音量だけを端末の中で測り、録音はしません。
        </p>
        <div className="card warm small">
          <p>
            人は、自分の緊張が相手にどのくらい伝わっているかを多めに見積もりがちです(透明性の錯覚)。このことを知ってから話すと、話しぶりも落ち着きやすくなります。
          </p>
        </div>
        <label htmlFor="topic">話すテーマ(なくてもよい)</label>
        <input id="topic" type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="例: 最近おもしろかったこと / 来週の発表の冒頭" />
        <p className="small muted">時間</p>
        <div className="row">
          {DURATIONS.map((m) => (
            <button key={m} className="chip" aria-pressed={minutes === m} onClick={() => setMinutes(m)}>
              {m} 分
            </button>
          ))}
        </div>
        <p className="small muted">今回意識すること(1 つ)</p>
        <Chips single options={FOCUSES} value={focus} onChange={setFocus} />
        <Scale label="話しているときの緊張は、外から見てどのくらいわかると思う？" value={predicted} onChange={setPredicted} low="まったく" high="はっきり" />
        <button className="primary block" style={{ marginTop: 12 }} onClick={start}>
          はじめる
        </button>
        <Refs refs={["Savitsky & Gilovich (2003) J. Experimental Social Psychology", "Clark & Wells (1995)"]} />
      </div>
    );

  if (phase === "run")
    return (
      <div>
        <p className="small muted">{topic.trim() || "自由なテーマ"}</p>
        <div className="card accent" style={{ textAlign: "center" }}>
          <p style={{ fontSize: "2.4rem", margin: "8px 0", fontVariantNumeric: "tabular-nums" }}>{fmtTime(left)}</p>
          {mic.current && (
            <div className="meter" aria-hidden="true">
              <span style={{ width: `${Math.round(level * 100)}%` }} />
            </div>
          )}
          <p className="small">意識すること: {focus[0] ?? "なし"}</p>
        </div>
        {micNote && <p className="small muted">{micNote}</p>}
        <p className="small muted">言葉に詰まっても、止めずにそのまま続けてみましょう。</p>
        <button className="primary block" onClick={finishRun}>終える</button>
      </div>
    );

  if (phase === "after")
    return (
      <div>
        <h1>おつかれさま</h1>
        {result && (
          <div className="card">
            <p>
              声が出ていたのは <strong>{Math.round(result.speakMs / 1000)}</strong> 秒。2 秒以上の間は <strong>{result.pauses}</strong> 回
              {result.pauses > 0 && <>(一番長くて {(result.longestPauseMs / 1000).toFixed(1)} 秒)</>}。
            </p>
            <p className="small muted">間は、聞き手にとって内容を受けとめる時間にもなります。間があったこと自体は失敗ではありません。</p>
          </div>
        )}
        <Scale label="話し終えたいま、緊張は外からどのくらい見えていたと思う？" value={after} onChange={setAfter} low="まったく" high="はっきり" />
        <button className="primary block" style={{ marginTop: 12 }} onClick={save}>記録する</button>
      </div>
    );

  return (
    <div>
      <h1>記録しました</h1>
      <div className="card accent">
        <p>
          話す前の予想は {predicted}、話したあとの見積もりは {after} でした。
        </p>
        {prev?.speakMs !== undefined && result && (
          <p className="small">前回は {Math.round(prev.speakMs / 1000)} 秒話し、2 秒以上の間は {prev.pauses ?? 0} 回でした。</p>
        )}
      </div>
      <p>
        本当にそう見えていたかは、自分を録画して、他人のつもりで見ると確かめられます。多くの人は、思っていたより落ち着いて見えます。
      </p>
      <button className="primary block" onClick={() => go({ name: "video" })}>ビデオで確かめる</button>
      <h2>現実で 1 回試す</h2>
      {next.slice(0, 3).map((m) => (
        <button key={m.id} className="option" style={{ margin: "6px 0" }} onClick={() => go({ name: "experiment", missionId: m.id })}>
          <strong>段階 {m.level}: {m.title}</strong>
          <br />
          <span className="small muted">{m.detail}</span>
        </button>
      ))}
      <button style={{ marginTop: 12 }} onClick={() => go({ name: "dojo" })}>道場にもどる</button>
    </div>
  );
}
