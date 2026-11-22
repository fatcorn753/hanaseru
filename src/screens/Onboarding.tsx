import { useState } from "react";
import { Chips, Scale, Steps } from "../components/ui";
import { SAFETY_BEHAVIORS, TRACKS, TRACK_INFO } from "../content/missions";
import { HELP_LINKS } from "../content/foundation";
import { saveProfile } from "../lib/db";
import type { Profile, Track } from "../lib/types";

export const BASELINE_ITEMS = [
  "店員さんに話しかける",
  "知り合いと雑談する",
  "初対面の人と話す",
  "3 人以上の輪に入る",
  "沈黙が続く",
  "人前で発表する",
  "職場やバイトで質問・報告する",
  "頼みごとをする・断る",
];

const WHEN_OPTIONS = ["人と会う予定の 5 分前", "休憩時間に入ったら", "朝ごはんを食べたら", "帰り道を歩き始めたら"];
const THEN_OPTIONS = ["ため息呼吸を 1 分する", "今日の実験を 1 つ決める", "アプリで予想を書く"];

export function Onboarding({ profile }: { profile: Profile }) {
  const [step, setStep] = useState(0);
  const [baseline, setBaseline] = useState<Record<string, number>>(
    // 項目を足す前の記録にも、足した項目の初期値を入れる
    { ...Object.fromEntries(BASELINE_ITEMS.map((k) => [k, 5])), ...profile.baseline },
  );
  const [safety, setSafety] = useState<string[]>(profile.safetyBehaviors);
  const [when, setWhen] = useState<string[]>([]);
  const [then, setThen] = useState<string[]>([]);
  const [track, setTrack] = useState<Track>(profile.track ?? "chat");
  const total = 5;

  const finish = async () => {
    await saveProfile({
      ...profile,
      baseline,
      safetyBehaviors: safety,
      track,
      ifThen: when[0] && then[0] ? { when: when[0], then: then[0] } : undefined,
      onboardedAt: Date.now(),
    });
  };

  return (
    <div>
      <Steps total={total} at={step} />
      {step === 0 && (
        <section>
          <h1>はなせる</h1>
          <p>会話への怖さを、<strong>小さな実験</strong>で少しずつほどいていくアプリです。</p>
          <div className="td-card">
            <h2 className="sub">このアプリがめざすこと</h2>
            <p>緊張をゼロにすることではありません。緊張していても会話を避けずに済み、終わったあと引きずらない状態をめざします。</p>
          </div>
          <div className="td-card" data-tone="warm">
            <h2 className="sub">大切なお知らせ</h2>
            <p className="small">
              このアプリは練習用の道具で、病気の診断や治療をするものではありません。毎日の生活が送れないほどつらいとき、気分の落ち込みが続くときは、医療機関や相談窓口を頼ってください。
            </p>
            {HELP_LINKS.map((l) => (
              <p key={l.url} className="small">
                <a href={l.url} target="_blank" rel="noreferrer">{l.name}</a>
              </p>
            ))}
            <p className="small">記録はすべてこの端末の中だけに保存され、外部へ送信されません。</p>
          </div>
          <button className="td-btn block" data-variant="primary" type="button" onClick={() => setStep(1)}>はじめる</button>
        </section>
      )}
      {step === 1 && (
        <section>
          <h1>しくみ</h1>
          <div className="td-card stack" data-tone="accent">
            <p><strong>1. 予想する</strong> — 「話しかけたら変な顔をされる(確信度 80%)」</p>
            <p><strong>2. 現実で試す</strong> — 小さな課題を、安全行動を一つやめて</p>
            <p><strong>3. 結果と比べる</strong> — 「実際は普通に返事をされた」</p>
          </div>
          <p>人は会話の気まずさを大きく見積もり、相手からの好感を低く見積もる傾向があります。予想と現実のずれを自分の目で確かめることが、怖さを減らす一番の近道です。</p>
          <p className="muted">習慣になるまでの目安は約 2 か月。1 日休んでも崩れません。</p>
          <p className="refs">根拠: Clark et al. (2006) / Craske et al. (2014) / Boothby et al. (2018) / Lally et al. (2010)</p>
          <h2 className="sub">まず練習する場面</h2>
          <p className="small muted">場面ごとに 6 段階の課題があります。ホームでいつでも切り替えられます。</p>
          <Chips
            label="まず練習する場面"
            single
            options={TRACKS.map((t) => TRACK_INFO[t].name)}
            value={[TRACK_INFO[track].name]}
            // 選択中をもう一度押しても外さない(場面は必ず 1 つ)
            onChange={(v) => {
              const t = TRACKS.find((k) => TRACK_INFO[k].name === v[0]);
              if (t) setTrack(t);
            }}
          />
          <div className="row">
            <button className="td-btn" type="button" onClick={() => setStep(0)}>もどる</button>
            <span className="spacer" />
            <button className="td-btn" data-variant="primary" type="button" onClick={() => setStep(2)}>つぎへ</button>
          </div>
        </section>
      )}
      {step === 2 && (
        <section>
          <h1>いまの感じ</h1>
          <p className="muted">どれくらい緊張するか、直感で。診断ではなく、あとで自分の変化を見るための目安です。</p>
          {BASELINE_ITEMS.map((k) => (
            <Scale key={k} label={k} value={baseline[k]} onChange={(v) => setBaseline({ ...baseline, [k]: v })} low="平気" high="とても怖い" />
          ))}
          <div className="row" style={{ marginTop: "var(--space-4)" }}>
            <button className="td-btn" type="button" onClick={() => setStep(1)}>もどる</button>
            <span className="spacer" />
            <button className="td-btn" data-variant="primary" type="button" onClick={() => setStep(3)}>つぎへ</button>
          </div>
        </section>
      )}
      {step === 3 && (
        <section>
          <h1>いつもの「お守り行動」</h1>
          <p>緊張する場面で、ついやってしまうことはありますか？当てはまるものを選んでください。</p>
          <p className="muted small">
            こうした行動は「安全行動」と呼ばれます。その場は楽になりますが、「大丈夫だったのはお守りのおかげ」と感じさせ、怖さを長引かせます。実験で一つずつ外していきます。
          </p>
          <Chips label="いつものお守り行動" options={SAFETY_BEHAVIORS} value={safety} onChange={setSafety} />
          <div className="row" style={{ marginTop: "var(--space-4)" }}>
            <button className="td-btn" type="button" onClick={() => setStep(2)}>もどる</button>
            <span className="spacer" />
            <button className="td-btn" data-variant="primary" type="button" onClick={() => setStep(4)}>つぎへ</button>
          </div>
        </section>
      )}
      {step === 4 && (
        <section>
          <h1>きっかけを一つ決める</h1>
          <p>「もし〜したら、〜する」と決めておくと、実行率が上がります。あとで変えられます。</p>
          <p className="td-label">もし…</p>
          <Chips label="もし…" single options={WHEN_OPTIONS} value={when} onChange={setWhen} />
          <p className="td-label">そのとき…</p>
          <Chips label="そのとき…" single options={THEN_OPTIONS} value={then} onChange={setThen} />
          <p className="refs">根拠: Gollwitzer & Sheeran (2006)</p>
          <div className="row" style={{ marginTop: "var(--space-4)" }}>
            <button className="td-btn" type="button" onClick={() => setStep(3)}>もどる</button>
            <span className="spacer" />
            <button className="td-btn" data-variant="primary" type="button" onClick={finish}>{when[0] && then[0] ? "はじめる" : "あとで決める"}</button>
          </div>
        </section>
      )}
    </div>
  );
}
