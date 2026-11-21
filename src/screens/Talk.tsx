import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useMemo, useRef, useState } from "react";
import { Back, Refs } from "../components/ui";
import { DRILLS } from "../content/drills";
import { MISSIONS } from "../content/missions";
import { SCENE_NAMES, SCRIPTS, scriptById, type Script } from "../content/scripts";
import { db, getProfile, saveProfile } from "../lib/db";
import { useNav } from "../lib/nav";
import {
  canRecognize, canSpeak, listen, openMic, recognizesLocally, speak, stopSpeaking, transcribe, type Mic,
} from "../lib/speech";
import { summarizeTalk, type TalkTurn } from "../lib/talk";
import { DEFAULT_TALK, type TalkSettings } from "../lib/types";

export function Talk({ scriptId }: { scriptId?: string }) {
  const s = scriptId ? scriptById(scriptId) : undefined;
  return s ? <TalkRunner key={s.id} script={s} /> : <TalkList />;
}

const sec = (ms: number) => (ms / 1000).toFixed(1);

function TalkList() {
  const go = useNav();
  const profile = useLiveQuery(() => getProfile(), []);
  const logs = useLiveQuery(() => db.talks.toArray(), []);
  const [local, setLocal] = useState(false);
  useEffect(() => {
    recognizesLocally().then(setLocal);
  }, []);
  if (!profile || !logs) return null;
  const t: TalkSettings = { ...DEFAULT_TALK, ...profile.talk };
  const set = (p: Partial<TalkSettings>) => saveProfile({ ...profile, talk: { ...t, ...p } });

  return (
    <div>
      <Back onClick={() => go({ name: "dojo" })} />
      <h1>台本会話</h1>
      <p className="muted">
        よくある場面の会話を、分かれ道つきで練習します。相手のセリフに、まず自分の言葉で声に出して答えてから、近い返しを選びます。どれを選んでも会話は続きます。
      </p>

      <div className="card">
        <p className="small muted">答え方</p>
        <div className="row">
          <button className="chip" aria-pressed={t.voice} onClick={() => set({ voice: true })}>声に出してから選ぶ</button>
          <button className="chip" aria-pressed={!t.voice} onClick={() => set({ voice: false })}>選ぶだけ</button>
        </div>
        {!t.voice && <p className="small muted">声を出せない場所向けです。声に出すほうが、本番に近い練習になります。</p>}
        {canSpeak() && (
          <>
            <p className="small muted">相手のセリフ</p>
            <div className="row">
              <button className="chip" aria-pressed={t.tts} onClick={() => set({ tts: true })}>読み上げる</button>
              <button className="chip" aria-pressed={!t.tts} onClick={() => set({ tts: false })}>文字だけ</button>
            </div>
          </>
        )}
        {t.voice && canRecognize() && (
          <>
            <p className="small muted">話した言葉を文字にする</p>
            <div className="row">
              <button className="chip" aria-pressed={!t.recognition} onClick={() => set({ recognition: false })}>しない</button>
              <button className="chip" aria-pressed={t.recognition} onClick={() => set({ recognition: true })}>する</button>
            </div>
            <p className="small muted">
              {local
                ? "このブラウザでは、端末の中で文字にします。"
                : "このブラウザで文字にすると、音声がブラウザの提供元(Google や Apple)のサーバーに送られます。"}
              文字にした内容は保存しません。「しない」なら、マイクの音量だけを端末の中で測ります。
            </p>
          </>
        )}
      </div>

      {SCRIPTS.map((s) => {
        const n = logs.filter((l) => l.scriptId === s.id && l.finished).length;
        return (
          <button key={s.id} className="option" style={{ margin: "6px 0" }} onClick={() => go({ name: "talk", scriptId: s.id })}>
            <span className="small muted">{SCENE_NAMES[s.scene]}</span>
            <br />
            <strong>{s.title}</strong>
            {n > 0 && <span className="small muted">({n} 回)</span>}
            <br />
            <span className="small muted">{s.setting}</span>
          </button>
        );
      })}
      <Refs refs={["Mayo-Wilson et al. (2014) Lancet Psychiatry", "Templeton et al. (2022) PNAS"]} />
    </div>
  );
}

type Phase = "intro" | "partner" | "speak" | "choose" | "picked" | "done";
type VoiceResult = { latencyMs: number | null; speakMs: number };

const TONE_MARK = { good: "○", ok: "・", closed: "△" } as const;

function TalkRunner({ script }: { script: Script }) {
  const go = useNav();
  const profile = useLiveQuery(() => getProfile(), []);
  const [nodeId, setNodeId] = useState(script.start);
  const [phase, setPhase] = useState<Phase>("intro");
  const [turns, setTurns] = useState<TalkTurn[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [voiceRes, setVoiceRes] = useState<VoiceResult | null>(null);
  const [heard, setHeard] = useState("");
  const [level, setLevel] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [micNote, setMicNote] = useState<string | null>(null);
  const [prevMedian, setPrevMedian] = useState<number | null>(null);

  const alive = useRef(true);
  const mic = useRef<Mic | null>(null);
  const micReady = useRef<Promise<void>>(Promise.resolve());
  const localRec = useRef(false);
  const cap = useRef<{ finish: () => Promise<void> } | null>(null);
  const turnsRef = useRef<TalkTurn[]>([]);
  const saved = useRef(false);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      stopSpeaking();
      void cap.current?.finish();
      mic.current?.close();
    };
  }, []);

  const node = script.nodes[nodeId];
  // 「よい返し」がいつも同じ位置に来ないよう、場面ごとに並びを混ぜる
  const order = useMemo(
    () => (node.choices ?? []).map((c, i) => ({ c, i })).sort(() => Math.random() - 0.5),
    [node],
  );

  if (!profile) return null;
  const t: TalkSettings = { ...DEFAULT_TALK, ...profile.talk };
  const useRec = t.voice && t.recognition && canRecognize();

  const startTurn = async () => {
    if (!t.voice) return setPhase("choose");
    await micReady.current;
    if (!alive.current) return;
    setPhase("speak");
    setElapsed(0);
    setLevel(0);
    const begin = performance.now();
    let done = false;
    if (useRec) {
      const tr = transcribe(localRec.current);
      if (tr) {
        tr.onText(setHeard);
        const timer = setInterval(() => setElapsed(Math.floor((performance.now() - begin) / 1000)), 250);
        cap.current = {
          finish: async () => {
            if (done) return;
            done = true;
            clearInterval(timer);
            const r = await tr.stop();
            setVoiceRes({ latencyMs: r.latencyMs, speakMs: r.speakMs });
            setHeard(r.text);
          },
        };
        return;
      }
    }
    const m = mic.current;
    const l = m ? listen(m) : null;
    const timer = setInterval(() => {
      const now = performance.now();
      setElapsed(Math.floor((now - begin) / 1000));
      if (!l) return;
      setLevel(l.level());
      // 話し終えて 1.5 秒黙ったら、自動で次へ進む
      if (l.detector.finishedSpeaking(now, 1500) || now - begin > 30000) void endTurn();
    }, 100);
    cap.current = {
      finish: async () => {
        if (done) return;
        done = true;
        clearInterval(timer);
        if (l) setVoiceRes(l.stop());
        setLevel(0);
      },
    };
  };

  const endTurn = async () => {
    const c = cap.current;
    cap.current = null;
    await c?.finish();
    if (alive.current) setPhase("choose");
  };

  const finish = async () => {
    setPhase("done");
    if (saved.current) return;
    saved.current = true;
    await db.talks.add({ createdAt: Date.now(), scriptId: script.id, turns: turnsRef.current, finished: true });
  };

  // 読み上げは iOS ではタップの処理の中で始める必要があるので、ボタンの処理から直接呼ぶ
  const enterNode = (id: string) => {
    const n = script.nodes[id];
    setNodeId(id);
    setPicked(null);
    setVoiceRes(null);
    setHeard("");
    setPhase("partner");
    const p = t.tts && n.says ? speak(n.says, script.voice) : Promise.resolve();
    void p.then(() => {
      if (!alive.current) return;
      if (n.end) void finish();
      else void startTurn();
    });
  };

  const begin = () => {
    enterNode(script.start);
    void db.talks
      .where("scriptId")
      .equals(script.id)
      .toArray()
      .then((xs) => {
        const last = xs.filter((x) => x.finished).sort((a, b) => b.createdAt - a.createdAt)[0];
        setPrevMedian(last ? summarizeTalk(last.turns).medianLatencyMs : null);
      });
    if (useRec) {
      micReady.current = recognizesLocally().then((v) => {
        localRec.current = v;
      });
    } else if (t.voice) {
      micReady.current = openMic()
        .then((m) => {
          if (alive.current) mic.current = m;
          else m.close();
        })
        .catch(() => setMicNote("マイクを使えなかったので、声の計測はしません。声に出す練習はそのまま続けられます。"));
    }
  };

  const skipSpeech = () => {
    stopSpeaking();
  };

  const pick = (i: number) => {
    const c = node.choices![i];
    const turn: TalkTurn = { nodeId, choice: i, tone: c.tone, skill: c.skill, ...(voiceRes ?? {}) };
    turnsRef.current = [...turnsRef.current, turn];
    setTurns(turnsRef.current);
    setPicked(i);
    setPhase("picked");
  };

  if (phase === "intro")
    return (
      <div>
        <Back onClick={() => go({ name: "talk" })} />
        <p className="small muted">{SCENE_NAMES[script.scene]}</p>
        <h1>{script.title}</h1>
        <div className="card accent">
          <p>{script.setting}</p>
          <p className="small muted">相手: {script.partner}</p>
        </div>
        {t.voice ? (
          <p className="small">
            相手のセリフのあと、自分の言葉で声に出して答えてみましょう。うまく言えなくても、「えーと」からでもかまいません。そのあと、言いたかったことに近い返しを選びます。
          </p>
        ) : (
          <p className="small">相手のセリフに、どう返すかを選びます。</p>
        )}
        <button className="primary block" onClick={begin}>はじめる</button>
      </div>
    );

  const sum = summarizeTalk(turns);
  const related = MISSIONS.filter((m) => m.level <= 4 && m.skillIds?.some((k) => (sum.skills as string[]).includes(k))).slice(0, 2);

  return (
    <div>
      <Back onClick={() => go({ name: "talk" })} />
      <p className="small muted">{script.title}</p>
      {micNote && <p className="small muted">{micNote}</p>}

      <div className="talk-log" aria-live="polite">
        {turns.map((tu, k) => {
          const n = script.nodes[tu.nodeId];
          const last = k === turns.length - 1 && phase === "picked";
          return (
            <div key={k} style={last ? { display: "none" } : undefined}>
              {n.context && <p className="ctx">{n.context}</p>}
              {n.says && <p className="bubble them">{n.says}</p>}
              <p className="bubble me">{n.choices![tu.choice].text}</p>
            </div>
          );
        })}
        {node.context && <p className="ctx">{node.context}</p>}
        {node.says && <p className="bubble them">{node.says}</p>}
      </div>

      {phase === "partner" && t.tts && node.says && (
        <button className="ghost" onClick={skipSpeech}>読み上げをとばす</button>
      )}

      {phase === "speak" && (
        <div className="card accent">
          <p><strong>あなたの番です。</strong>自分の言葉で、声に出して答えてみましょう。</p>
          {!useRec && mic.current && (
            <div className="meter" aria-hidden="true">
              <span style={{ width: `${Math.round(level * 100)}%` }} />
            </div>
          )}
          {useRec && <p className="small">{heard || "(聞きとり中…)"}</p>}
          <p className="small muted">{elapsed} 秒{!useRec && mic.current ? "。話し終えて少し黙ると、自動で次へ進みます" : ""}</p>
          <div className="row">
            <button className="primary" onClick={() => void endTurn()}>言い終えた</button>
            <button className="ghost" onClick={() => void endTurn()}>今回は声に出さない</button>
          </div>
        </div>
      )}

      {(phase === "choose" || phase === "picked") && (
        <>
          {heard && <p className="small muted">あなたの言葉: 「{heard}」</p>}
          <p className="small muted">
            {phase === "picked" ? "それぞれの返しについて" : t.voice ? "言いたかったことに近い返しは？" : "どう返す？"}
          </p>
          {order.map(({ c, i }) => (
            <div key={i}>
              <button
                className={`option ${phase === "picked" && picked === i ? (c.tone === "closed" ? "bad" : "good") : ""}`}
                style={{ margin: "6px 0" }}
                onClick={() => phase === "choose" && pick(i)}
                aria-pressed={picked === i}
              >
                {picked === i ? "▶ " : ""}
                {c.text}
              </button>
              {phase === "picked" && (picked === i || c.tone === "good") && (
                <p className={`feedback ${c.tone === "closed" ? "bad" : "good"}`}>{TONE_MARK[c.tone]} {c.note}</p>
              )}
            </div>
          ))}
          {phase === "picked" && picked !== null && (
            <button className="primary block" style={{ marginTop: 8 }} onClick={() => enterNode(node.choices![picked].next)}>
              つづける
            </button>
          )}
        </>
      )}

      {phase === "done" && (
        <>
          <h2>おつかれさま</h2>
          <div className="card accent">
            <p>
              {sum.turns} 回のやりとりのうち、話が広がる返しは {sum.good} 回。
            </p>
            {sum.skills.length > 0 && (
              <p className="small">使えた型: {sum.skills.map((k) => DRILLS.find((d) => d.id === k)?.title ?? k).join("、")}</p>
            )}
            {sum.voiced > 0 && (
              <p className="small">
                声に出せたのは {sum.voiced} 回、合わせて {sec(sum.speakMs)} 秒。
                {sum.medianLatencyMs !== null && <>話し始めるまで、だいたい {sec(sum.medianLatencyMs)} 秒でした。</>}
                {sum.medianLatencyMs !== null && prevMedian !== null && <>(前回は {sec(prevMedian)} 秒)</>}
              </p>
            )}
          </div>
          {sum.medianLatencyMs !== null && (
            <p className="small muted">
              会話では、返事までの間が短いほど、相手は「気が合う」と感じやすいという研究があります。とはいえ最初は時間がかかって当然です。「えーと」から話し始めるだけでも、相手には反応として伝わります。
            </p>
          )}
          {turns.some((x) => x.tone === "closed") && (
            <p className="small">
              話が止まりやすい返しを選んだ場面があっても、会話はそこで終わりませんでした。現実の会話も、一言で立て直せることがほとんどです。
            </p>
          )}
          {related.length > 0 && (
            <>
              <h2>現実で 1 回試す</h2>
              {related.map((m) => (
                <button key={m.id} className="option" style={{ margin: "6px 0" }} onClick={() => go({ name: "experiment", missionId: m.id })}>
                  <strong>段階 {m.level}: {m.title}</strong>
                  <br />
                  <span className="small muted">{m.detail}</span>
                </button>
              ))}
            </>
          )}
          <div className="row" style={{ marginTop: 12 }}>
            <button onClick={() => go({ name: "talk" })}>ほかの場面へ</button>
          </div>
          <Refs refs={["Templeton et al. (2022) PNAS"]} />
        </>
      )}
    </div>
  );
}
