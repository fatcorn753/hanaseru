import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { Back, Chips, Scale, Steps } from "../components/ui";
import { drillById } from "../content/drills";
import { FOCUS_TASKS, MISSIONS, SAFETY_BEHAVIORS, TRACKS, TRACK_INFO, missionById, trackOfMission } from "../content/missions";
import { localDate } from "../lib/date";
import { db, getProfile } from "../lib/db";
import { useNav } from "../lib/nav";
import { gap, recommendLevel } from "../lib/stats";
import type { Experiment, Level, Track } from "../lib/types";

type Phase = "choose" | "predict" | "ready" | "result" | "gap";
const PHASES: Phase[] = ["choose", "predict", "ready", "result", "gap"];

const PREDICTION_EXAMPLES = ["変な顔をされる", "言葉に詰まって笑われる", "無視される", "話が続かず気まずくなる", "顔が赤いのを気づかれる"];

export function ExperimentFlow({ resumeId, missionId }: { resumeId?: number; missionId?: string }) {
  const go = useNav();
  const exps = useLiveQuery(() => db.experiments.toArray(), []);
  const sleep = useLiveQuery(() => db.sleep.get(localDate()), []);
  const profile = useLiveQuery(() => getProfile(), []);
  const [phase, setPhase] = useState<Phase>(resumeId ? "ready" : missionId ? "predict" : "choose");
  const [exp, setExp] = useState<Experiment | null>(null);
  const [viewLevel, setViewLevel] = useState<Level | null>(null);
  const [viewTrack, setViewTrack] = useState<Track | null>(null);
  const [custom, setCustom] = useState("");

  // 予想フォーム
  const [mission, setMission] = useState<{ id?: string; title: string; level: Level; track: Track } | null>(() => {
    const m = missionById(missionId);
    return m ? { id: m.id, title: m.title, level: m.level, track: trackOfMission(m) } : null;
  });
  const [prediction, setPrediction] = useState("");
  const [confidence, setConfidence] = useState(60);
  const [expectedAnxiety, setExpectedAnxiety] = useState(6);
  const [dropped, setDropped] = useState<string[]>([]);
  const [focus, setFocus] = useState<string[]>([]);

  // 結果フォーム
  const [happened, setHappened] = useState("");
  const [cameTrue, setCameTrue] = useState(20);
  const [peak, setPeak] = useState(5);
  const [learned, setLearned] = useState("");

  useEffect(() => {
    if (resumeId) db.experiments.get(resumeId).then((x) => x && setExp(x));
  }, [resumeId]);

  if (!exps || !profile) return null;
  const track: Track = viewTrack ?? profile.track ?? "chat";
  const rec = recommendLevel(exps, sleep?.quality, track);
  const level = viewLevel ?? rec.level;
  const safetyOptions = profile.safetyBehaviors.length ? profile.safetyBehaviors : SAFETY_BEHAVIORS;

  const savePlan = async () => {
    if (!mission) return;
    const x: Experiment = {
      createdAt: Date.now(),
      status: "planned",
      missionId: mission.id,
      track: mission.track,
      title: mission.title,
      level: mission.level,
      prediction: prediction.trim(),
      confidence,
      expectedAnxiety,
      safetyBehaviorDropped: dropped[0],
      focusTask: focus[0],
    };
    const id = await db.experiments.add(x);
    // 直前キットへ移動して戻ってきても続きから開けるよう、保存済みの ID で開き直す
    go({ name: "experiment", resumeId: id });
  };

  const saveResult = async () => {
    if (!exp?.id) return;
    const patch: Partial<Experiment> = {
      status: "done",
      doneAt: Date.now(),
      happened: happened.trim(),
      cameTrue,
      peakAnxiety: peak,
      learned: learned.trim() || undefined,
    };
    await db.experiments.update(exp.id, patch);
    setExp({ ...exp, ...patch });
    setPhase("gap");
  };

  const abandon = async () => {
    if (exp?.id) await db.experiments.update(exp.id, { status: "abandoned" });
    go({ name: "home" });
  };

  const m = missionById(exp?.missionId ?? mission?.id);

  return (
    <div>
      <Steps total={PHASES.length} at={PHASES.indexOf(phase)} />

      {phase === "choose" && (
        <section>
          <h1>課題を選ぶ</h1>
          <div className="row" aria-label="場面">
            {TRACKS.map((t) => (
              <button
                key={t}
                className="chip"
                aria-pressed={t === track}
                onClick={() => {
                  setViewTrack(t);
                  setViewLevel(null);
                }}
              >
                {TRACK_INFO[t].name}
              </button>
            ))}
          </div>
          <p className="small muted">{rec.reason}</p>
          <div className="row" role="tablist" aria-label="段階">
            {([1, 2, 3, 4, 5, 6] as Level[]).map((l) => (
              <button key={l} className="chip" aria-pressed={l === level} onClick={() => setViewLevel(l)}>
                {l}{l === rec.level ? "★" : ""}
              </button>
            ))}
          </div>
          <h2>段階 {level}: {TRACK_INFO[track].levels[level]}</h2>
          {MISSIONS.filter((x) => trackOfMission(x) === track && x.level === level).map((x) => (
            <button
              key={x.id}
              className="option"
              style={{ margin: "6px 0" }}
              onClick={() => {
                setMission({ id: x.id, title: x.title, level: x.level, track });
                setPhase("predict");
              }}
            >
              <strong>{x.title}</strong>
              <br />
              <span className="small muted">{x.detail}</span>
            </button>
          ))}
          <div className="card">
            <label htmlFor="custom">自分で課題を作る(段階 {level})</label>
            <input id="custom" type="text" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="例: 隣の席の人に授業のことを聞く" />
            <button
              style={{ marginTop: 8 }}
              disabled={!custom.trim()}
              onClick={() => {
                setMission({ title: custom.trim(), level, track });
                setPhase("predict");
              }}
            >
              この課題にする
            </button>
          </div>
          <p className="small muted">同じ段を、相手・場所・時間を変えて何度か試すと身につきやすくなります。</p>
        </section>
      )}

      {phase === "predict" && mission && (
        <section>
          <Back onClick={() => setPhase("choose")} />
          <h1>予想する</h1>
          <div className="card accent">
            <strong>{mission.title}</strong>
            {m && <p className="small">{m.detail}</p>}
          </div>
          <label htmlFor="pred">起きそうな最悪のこと</label>
          <textarea id="pred" value={prediction} onChange={(e) => setPrediction(e.target.value)} placeholder="具体的に。例: 話しかけたら迷惑そうな顔をされる" />
          <div className="row" style={{ marginTop: 6 }}>
            {PREDICTION_EXAMPLES.map((p) => (
              <button key={p} className="chip" onClick={() => setPrediction(p)}>{p}</button>
            ))}
          </div>
          <Scale label="それが起きる確信度" value={confidence} onChange={setConfidence} max={100} unit="%" low="起きない" high="必ず起きる" />
          <Scale label="予想する緊張" value={expectedAnxiety} onChange={setExpectedAnxiety} low="0 平気" high="10 最大" />
          <label>今回やめる「お守り行動」(1 つ)</label>
          <Chips single options={safetyOptions} value={dropped} onChange={setDropped} />
          <label>相手に向ける注意のお題(1 つ)</label>
          <Chips single options={FOCUS_TASKS} value={focus} onChange={setFocus} />
          <p className="small muted">お題は気をそらすためではなく、相手のことを知るためのものです。</p>
          <button className="primary block" style={{ marginTop: 16 }} disabled={!prediction.trim()} onClick={savePlan}>
            予想を保存する
          </button>
        </section>
      )}

      {phase === "ready" && exp && (
        <section>
          <h1>いってらっしゃい</h1>
          <div className="card accent stack">
            <p><strong>{exp.title}</strong></p>
            <p className="small">予想: {exp.prediction}(確信度 {exp.confidence}%)</p>
            {exp.safetyBehaviorDropped && <p className="small">やめる: {exp.safetyBehaviorDropped}</p>}
            {exp.focusTask && <p className="small">お題: {exp.focusTask}</p>}
          </div>
          {m?.skillIds?.map((sid) => {
            const d = drillById(sid);
            return d ? <p key={sid} className="small">合言葉: {d.rule}</p> : null;
          })}
          <p className="muted small">うまく話せるかではなく、予想が当たるかを確かめる実験です。失敗しても、それもデータになります。</p>
          <h3>直前に使う(任意)</h3>
          <div className="row">
            <button onClick={() => go({ name: "foundation", tool: "breath" })}>ため息呼吸</button>
            <button onClick={() => go({ name: "foundation", tool: "reappraisal" })}>読み替え</button>
            <button onClick={() => go({ name: "foundation", tool: "worry" })}>心配の書き出し</button>
          </div>
          <button className="primary block" style={{ marginTop: 20 }} onClick={() => setPhase("result")}>やってきた → 結果を書く</button>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="ghost" onClick={() => go({ name: "home" })}>あとで書く</button>
            <span className="spacer" />
            <button className="ghost" onClick={abandon}>今回は見送る</button>
          </div>
        </section>
      )}

      {phase === "result" && exp && (
        <section>
          <Back onClick={() => setPhase("ready")} />
          <h1>結果</h1>
          <p className="small muted">予想: {exp.prediction}</p>
          <label htmlFor="hap">実際に起きたこと(事実だけ)</label>
          <textarea id="hap" value={happened} onChange={(e) => setHappened(e.target.value)} placeholder="例: 相手は「そうなんですよ」と笑って、30 秒ほど話した" />
          <p className="small muted">「たぶん変に思われた」のような推測ではなく、相手の言葉や表情など、見聞きしたことを書きます。</p>
          <Scale label="最悪の予想はどのくらい当たった？" value={cameTrue} onChange={setCameTrue} max={100} unit="%" low="全く" high="その通り" />
          <Scale label="実際の緊張の最高値" value={peak} onChange={setPeak} low="0 平気" high="10 最大" />
          <label htmlFor="learn">わかったこと(1 文)</label>
          <input id="learn" type="text" value={learned} onChange={(e) => setLearned(e.target.value)} placeholder="例: 少し詰まっても、相手は待ってくれる" />
          <button className="primary block" style={{ marginTop: 16 }} disabled={!happened.trim()} onClick={saveResult}>
            記録する
          </button>
        </section>
      )}

      {phase === "gap" && exp && <GapView exp={exp} />}
    </div>
  );
}

function GapView({ exp }: { exp: Experiment }) {
  const go = useNav();
  const g = gap(exp);
  const better = g.belief > 0 || g.anxiety > 0;
  return (
    <section>
      <h1>予想と結果</h1>
      <div className="card">
        <CompareBar label="最悪の予想" before={exp.confidence} after={exp.cameTrue!} max={100} unit="%" beforeLabel="予想した確信度" afterLabel="実際に当たった度合い" />
        <CompareBar label="緊張" before={exp.expectedAnxiety} after={exp.peakAnxiety!} max={10} beforeLabel="予想" afterLabel="実際" />
      </div>
      {better ? (
        <div className="card accent">
          <p><strong>予想より現実のほうがやさしかったようです。</strong></p>
          <p className="small">このずれを積み重ねることが、怖さを減らす一番の材料になります。</p>
        </div>
      ) : (
        <div className="card warm">
          <p><strong>予想に近い結果でした。それでも、やってみたこと自体が前進です。</strong></p>
          <p className="small">相手の反応には相手の事情もあります。同じ段で相手や場所を変えて、もう一度試してみましょう。</p>
        </div>
      )}
      {exp.learned && <p>わかったこと: 「{exp.learned}」</p>}
      <p className="small muted">このあと頭の中で反省会が始まったら、ホームから 2 分で整えられます。</p>
      <div className="row">
        <button className="primary" onClick={() => go({ name: "home" })}>ホームへ</button>
        <button onClick={() => go({ name: "records" })}>記録を見る</button>
      </div>
    </section>
  );
}

export function CompareBar(props: { label: string; before: number; after: number; max: number; unit?: string; beforeLabel: string; afterLabel: string }) {
  const w = (v: number) => `${(v / props.max) * 100}%`;
  return (
    <div style={{ margin: "8px 0 14px" }}>
      <strong>{props.label}</strong>
      <div className="small muted">{props.beforeLabel} {props.before}{props.unit ?? ""}</div>
      <div style={{ height: 12, borderRadius: 6, background: "var(--line)" }}>
        <div style={{ width: w(props.before), height: "100%", borderRadius: 6, background: "var(--warm)" }} />
      </div>
      <div className="small muted" style={{ marginTop: 4 }}>{props.afterLabel} {props.after}{props.unit ?? ""}</div>
      <div style={{ height: 12, borderRadius: 6, background: "var(--line)" }}>
        <div style={{ width: w(props.after), height: "100%", borderRadius: 6, background: "var(--accent)" }} />
      </div>
    </div>
  );
}
