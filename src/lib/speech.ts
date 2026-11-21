/**
 * ブラウザ標準の読み上げ・マイク・文字起こしをまとめた薄い層。
 * どれも使えない環境があるので、呼ぶ側は「使えなければ文字だけで進む」前提で扱う。
 */
import { SpeechDetector, rms } from "./talk";

// ---- 読み上げ ----

let voices: SpeechSynthesisVoice[] = [];
function loadVoices() {
  if (typeof speechSynthesis === "undefined") return;
  voices = speechSynthesis.getVoices();
}
if (typeof speechSynthesis !== "undefined") {
  loadVoices();
  // Chrome は声の一覧を非同期で読み込む
  speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
}

export const canSpeak = () => typeof speechSynthesis !== "undefined";

/** 日本語の声を選ぶ。端末内の声(通信しない)を優先する */
export function pickVoice(list: SpeechSynthesisVoice[] = voices) {
  const ja = list.filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith("ja"));
  return ja.find((v) => v.localService) ?? ja[0] ?? null;
}

// 読み上げ中の発話を待っている側を、とばしたときにすぐ進めるため
let finishCurrent: (() => void) | null = null;

/** 読み上げが終わったら解決する。使えないときや失敗したときもすぐ解決する */
export function speak(text: string, opts: { pitch: number; rate: number }): Promise<void> {
  return new Promise((resolve) => {
    if (!canSpeak() || !text) return resolve();
    speechSynthesis.cancel();
    // 読み上げで「(笑)」などの記号を読まないようにする
    const u = new SpeechSynthesisUtterance(text.replace(/[(（][^)）]*[)）]/g, ""));
    u.lang = "ja-JP";
    const v = pickVoice();
    if (v) u.voice = v;
    u.pitch = opts.pitch;
    u.rate = opts.rate;
    finishCurrent?.();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (finishCurrent === finish) finishCurrent = null;
      resolve();
    };
    finishCurrent = finish;
    u.onend = finish;
    u.onerror = finish;
    // onend が来ないブラウザがあるので、長さから見積もった時間で打ち切る
    setTimeout(finish, 1500 + text.length * 250);
    speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if (canSpeak()) speechSynthesis.cancel();
  finishCurrent?.();
}

// ---- マイクの音量 ----

export interface Listener {
  /** 計測を止めて結果を返す */
  stop(): { latencyMs: number | null; speakMs: number };
  /** 0–1 のおおよその音量(表示用) */
  level(): number;
  detector: SpeechDetector;
}

/** マイクの許可をとってストリームを返す。録音はせず、音量の計測だけに使う */
export async function openMic() {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  // iOS では止まった状態で作られるので、タップの処理の中(await より前)で作って再開する
  const ctx = new Ctx();
  const resumed = ctx.resume().catch(() => {});
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  } catch (e) {
    ctx.close().catch(() => {});
    throw e;
  }
  await resumed;
  const src = ctx.createMediaStreamSource(stream);
  const an = ctx.createAnalyser();
  an.fftSize = 1024;
  src.connect(an);
  return {
    ctx,
    an,
    close() {
      stream.getTracks().forEach((t) => t.stop());
      ctx.close().catch(() => {});
    },
  };
}
export type Mic = Awaited<ReturnType<typeof openMic>>;

export function listen(mic: Mic): Listener {
  const det = new SpeechDetector();
  const buf = new Float32Array(mic.an.fftSize);
  let last = 0;
  if (mic.ctx.state !== "running") mic.ctx.resume().catch(() => {});
  const tick = () => {
    mic.an.getFloatTimeDomainData(buf);
    last = rms(buf);
    det.push(last, performance.now());
  };
  const timer = setInterval(tick, 50);
  return {
    detector: det,
    level: () => Math.min(1, last / 0.15),
    stop() {
      clearInterval(timer);
      return { latencyMs: det.latencyMs(), speakMs: Math.round(det.speakingMs()) };
    },
  };
}

// ---- 文字起こし(任意) ----

type Rec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  processLocally?: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onspeechstart: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type RecCtor = (new () => Rec) & {
  available?: (o: { langs: string[]; processLocally: boolean }) => Promise<string>;
};

function recCtor(): RecCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecCtor; webkitSpeechRecognition?: RecCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const canRecognize = () => typeof window !== "undefined" && recCtor() !== null;

/**
 * 端末内で文字起こしできるか。できなければ、音声はブラウザの提供元(Google や Apple)のサーバーに送られる。
 * 対応していないブラウザでは false。
 */
export async function recognizesLocally() {
  const C = recCtor();
  if (!C?.available) return false;
  try {
    return (await C.available({ langs: ["ja-JP"], processLocally: true })) === "available";
  } catch {
    return false;
  }
}

export interface Transcriber {
  stop(): Promise<{ text: string; latencyMs: number | null; speakMs: number }>;
  onText(cb: (t: string) => void): void;
}

/**
 * 1 回分の発話を文字起こしする。スマホではマイクの取り合いになるので、音量の計測とは同時に使わない。
 * 話し始めの時刻は speechstart、なければ最初の結果の時刻で近似する。
 */
export function transcribe(local: boolean): Transcriber | null {
  const C = recCtor();
  if (!C) return null;
  const r = new C();
  r.lang = "ja-JP";
  // iOS では continuous で止まらなくなる不具合があるため、1 回の発話ごとに区切る
  r.continuous = false;
  r.interimResults = true;
  if (local) r.processLocally = true;
  const t0 = performance.now();
  let onset: number | null = null;
  let lastAt: number | null = null;
  let text = "";
  let cb: (t: string) => void = () => {};
  let ended = false;
  let endResolve: () => void = () => {};
  const endP = new Promise<void>((res) => (endResolve = res));
  r.onspeechstart = () => {
    onset ??= performance.now();
  };
  r.onresult = (e) => {
    const now = performance.now();
    onset ??= now;
    lastAt = now;
    text = Array.from(e.results, (x) => x[0].transcript).join("");
    cb(text);
  };
  r.onerror = () => {};
  r.onend = () => {
    ended = true;
    endResolve();
  };
  try {
    r.start();
  } catch {
    return null;
  }
  return {
    onText: (f) => (cb = f),
    async stop() {
      if (!ended) {
        r.stop();
        await Promise.race([endP, new Promise((res) => setTimeout(res, 1500))]);
      }
      return {
        text,
        latencyMs: onset === null ? null : Math.round(onset - t0),
        speakMs: onset !== null && lastAt !== null ? Math.round(lastAt - onset) : 0,
      };
    },
  };
}
