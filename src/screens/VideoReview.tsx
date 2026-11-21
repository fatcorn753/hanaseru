import { useEffect, useRef, useState } from "react";
import { Back, Refs, Scale, Steps, useCountdown } from "../components/ui";
import { db } from "../lib/db";
import { useNav } from "../lib/nav";
import type { VideoAspect } from "../lib/types";
import { CompareBar } from "./ExperimentFlow";

const ASPECTS: { id: VideoAspect; label: string }[] = [
  { id: "nervous", label: "緊張して見える" },
  { id: "shaky", label: "声や手が震えて見える" },
  { id: "awkward", label: "話し方が不自然に見える" },
];

const TOPICS = ["最近うれしかったこと", "休みの日の過ごし方", "好きな食べ物とその理由", "最近はまっていること"];
const MAX_SEC = 60;

type Phase = "intro" | "record" | "predict" | "brief" | "watch" | "rate" | "result";
const PHASES: Phase[] = ["intro", "record", "predict", "brief", "watch", "rate", "result"];

const init = () => Object.fromEntries(ASPECTS.map((a) => [a.id, 50])) as Record<VideoAspect, number>;

/**
 * ビデオフィードバック(Harvey et al. 2000 の手順)。
 * 見る前に「どう見えるか」を具体的に予想させ、他人を見るつもりで見てもらう。
 * この準備を省くと欠点探しになって逆効果になりうるので、順番を固定している。
 * 録画は端末のメモリ上だけで扱い、保存も送信もしない。
 */
export function VideoReviewScreen() {
  const go = useNav();
  const [phase, setPhase] = useState<Phase>("intro");
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [topic] = useState(() => TOPICS[Math.floor(Math.random() * TOPICS.length)]);
  const [image, setImage] = useState("");
  const [predicted, setPredicted] = useState(init);
  const [observed, setObserved] = useState(init);
  const [recording, setRecording] = useState(false);
  const left = useCountdown(MAX_SEC, recording);
  const live = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const urlRef = useRef<string | null>(null);

  const stopStream = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };

  useEffect(
    () => () => {
      stopStream();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  useEffect(() => {
    if (recording && left === 0) rec.current?.stop();
  }, [left, recording]);

  const openCamera = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("このブラウザでは録画できません。別のブラウザで試してください。");
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      setPhase("record");
      requestAnimationFrame(() => {
        if (live.current) live.current.srcObject = stream.current;
      });
    } catch {
      setError("カメラかマイクを使えませんでした。ブラウザの設定で許可してから、もう一度試してください。");
    }
  };

  const start = () => {
    if (!stream.current) return;
    const chunks: Blob[] = [];
    const r = new MediaRecorder(stream.current);
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    r.onstop = () => {
      setRecording(false);
      stopStream();
      urlRef.current = URL.createObjectURL(new Blob(chunks, { type: r.mimeType }));
      setUrl(urlRef.current);
      setPhase("predict");
    };
    rec.current = r;
    r.start();
    setRecording(true);
  };

  const save = async () => {
    await db.videos.add({ createdAt: Date.now(), predicted, observed, note: image || undefined });
    setPhase("result");
  };

  return (
    <div>
      <Back onClick={() => go({ name: "dojo" })} />
      <Steps total={PHASES.length} at={PHASES.indexOf(phase)} />
      <h1>ビデオで自分を見る</h1>

      {phase === "intro" && (
        <>
          <p>緊張しているとき、人は「自分がどう見えているか」を頭の中のイメージで判断しがちです。そのイメージは、実際の見え方よりずっと悪いことが多いとわかっています。</p>
          <p>1 分だけ自己紹介を録画し、予想と実際を比べます。</p>
          <div className="td-card small">録画はこの画面の中だけで再生し、保存も送信もしません。画面を離れると消えます。</div>
          {error && <p className="feedback bad">{error}</p>}
          <button className="td-btn block" data-variant="primary" type="button" onClick={openCamera}>カメラを使う</button>
          <Refs refs={["Harvey et al. (2000) Behaviour Research and Therapy", "Warnock-Parkes et al. (2017) Cognitive and Behavioral Practice"]} />
        </>
      )}

      {phase === "record" && (
        <>
          <p>お題: <strong>{topic}</strong>(最大 {MAX_SEC} 秒)</p>
          <video ref={live} autoPlay muted playsInline />
          <div className="row" style={{ marginTop: "var(--space-2)" }}>
            {!recording ? (
              <button className="td-btn" data-variant="primary" type="button" onClick={start}>録画を始める</button>
            ) : (
              <>
                <button className="td-btn" data-variant="primary" type="button" onClick={() => rec.current?.stop()}>止める</button>
                <span className="big-number">{left}</span>
              </>
            )}
          </div>
        </>
      )}

      {phase === "predict" && (
        <>
          <p><strong>見る前に</strong>、いまの録画で自分がどう見えているかを予想します。</p>
          <label className="td-label" htmlFor="img">頭の中の自分の姿を一言で</label>
          <input className="td-input" id="img" type="text" value={image} onChange={(e) => setImage(e.target.value)} placeholder="例: 顔が真っ赤で、目が泳いでいる" />
          {ASPECTS.map((a) => (
            <Scale key={a.id} label={a.label} value={predicted[a.id]} onChange={(v) => setPredicted({ ...predicted, [a.id]: v })} max={100} unit="%" low="全く" high="とても" />
          ))}
          <button className="td-btn block" data-variant="primary" type="button" style={{ marginTop: "var(--space-3)" }} onClick={() => setPhase("brief")}>予想した</button>
        </>
      )}

      {phase === "brief" && (
        <div className="td-card stack" data-tone="accent">
          <p><strong>見るときのルール</strong></p>
          <p>1. 初めて会う他人を見るつもりで見る。</p>
          <p>2. 録画中に感じていたドキドキは思い出さず、画面に映っていることだけを見る。</p>
          <p>3. 欠点を探さない。</p>
          <button className="td-btn" data-variant="primary" type="button" onClick={() => setPhase("watch")}>見る</button>
        </div>
      )}

      {phase === "watch" && url && (
        <>
          <video src={url} controls playsInline />
          <button className="td-btn block" data-variant="primary" type="button" style={{ marginTop: "var(--space-3)" }} onClick={() => setPhase("rate")}>見終わった</button>
        </>
      )}

      {phase === "rate" && (
        <>
          <p>他人として見たとき、どう見えましたか？</p>
          {ASPECTS.map((a) => (
            <Scale key={a.id} label={a.label} value={observed[a.id]} onChange={(v) => setObserved({ ...observed, [a.id]: v })} max={100} unit="%" low="全く" high="とても" />
          ))}
          <button className="td-btn block" data-variant="primary" type="button" style={{ marginTop: "var(--space-3)" }} onClick={save}>比べる</button>
        </>
      )}

      {phase === "result" && (
        <>
          <div className="td-card">
            {ASPECTS.map((a) => (
              <CompareBar key={a.id} label={a.label} before={predicted[a.id]} after={observed[a.id]} max={100} unit="%" beforeLabel="見る前の予想" afterLabel="見たあと" />
            ))}
          </div>
          {image && <p className="small">頭の中のイメージ: 「{image}」</p>}
          <p>頭の中のイメージと、実際の見え方にはずれがありましたか？会話中に「きっと変に見えている」と感じたら、このずれを思い出してください。</p>
          <div className="row">
            <button className="td-btn" data-variant="primary" type="button" onClick={() => go({ name: "home" })}>ホームへ</button>
            <button className="td-btn" type="button" onClick={() => go({ name: "records" })}>記録を見る</button>
          </div>
        </>
      )}
    </div>
  );
}
