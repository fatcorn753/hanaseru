import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Back, Chips, Refs } from "../components/ui";
import { SAFETY_BEHAVIORS } from "../content/missions";
import { addDays } from "../lib/date";
import { db, getProfile, saveProfile } from "../lib/db";
import { useNav } from "../lib/nav";
import { recommendLevel, weekStart, weekSummary } from "../lib/stats";

const fmt = (t: number) => new Date(t).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });

/**
 * 週の振り返り。数字で責めず、「予想が外れた体験」と「わかったこと」を見返して、
 * 来週意識することを 1 つだけ選ぶ。
 */
export function WeeklyReview({ weekStart: ws }: { weekStart?: number }) {
  const go = useNav();
  const exps = useLiveQuery(() => db.experiments.toArray(), []);
  const profile = useLiveQuery(() => getProfile(), []);
  const [focus, setFocus] = useState<string[]>([]);
  if (!exps || !profile) return null;

  const start = ws ?? weekStart();
  const s = weekSummary(exps, start);
  const isCurrent = start === weekStart();
  const rec = recommendLevel(exps, undefined, profile.track);
  const options = [
    ...(profile.safetyBehaviors.length ? profile.safetyBehaviors : SAFETY_BEHAVIORS).map((b) => `「${b}」をやめてみる`),
    `段階 ${rec.level} の課題を、場所や相手を変えて試す`,
    "会話のあと、反省会に気づいたら 2 分で区切る",
  ];

  const save = async () => {
    await saveProfile({
      ...profile,
      weeklyFocus: focus[0] ?? profile.weeklyFocus,
      // 振り返った週より前の週は、まとめて振り返り済みとする
      lastReviewedWeek: isCurrent ? profile.lastReviewedWeek : s.key,
    });
    go({ name: "home" });
  };

  return (
    <div>
      <Back onClick={() => history.back()} />
      <h1>{isCurrent ? "今週" : "先週"}の振り返り</h1>
      <p className="muted small">
        {fmt(start)}〜{fmt(addDays(start, 6))}
      </p>

      {s.count === 0 ? (
        <div className="card">
          <p>この週は実験がありませんでした。休む週があっても大丈夫です。積み重ねは消えません。</p>
        </div>
      ) : (
        <>
          <div className="card accent">
            <p>
              実験 <strong>{s.count}</strong> 回のうち、最悪の予想が外れたのは <strong>{s.disconfirmed}</strong> 回。
            </p>
            {s.avgBeliefGap !== null && s.avgBeliefGap > 0 && (
              <p className="small">予想した確信度より、実際は平均 {Math.round(s.avgBeliefGap)} ポイント低い結果でした。</p>
            )}
            {s.avgAnxietyGap !== null && s.avgAnxietyGap > 0 && (
              <p className="small">緊張は、予想より平均 {s.avgAnxietyGap.toFixed(1)} 低めでした。</p>
            )}
          </div>
          {s.learned.length > 0 && (
            <>
              <h2>わかったこと</h2>
              <div className="card">
                {s.learned.map((l, i) => (
                  <div key={i} className="list-item">「{l}」</div>
                ))}
              </div>
            </>
          )}
          {s.dropped.length > 0 && (
            <p className="small">やめてみたお守り行動: {s.dropped.join("、")}</p>
          )}
        </>
      )}

      <h2>{isCurrent ? "これから" : "今週"}意識すること(1 つ)</h2>
      {profile.weeklyFocus && <p className="small muted">いまの目標: {profile.weeklyFocus}</p>}
      <Chips single options={options} value={focus} onChange={setFocus} />
      <Refs refs={["Harkin et al. (2016) Psychological Bulletin", "Gollwitzer & Sheeran (2006)"]} />
      <button className="primary block" style={{ marginTop: 12 }} onClick={save}>
        {focus[0] ? "これにする" : "そのまま閉じる"}
      </button>
    </div>
  );
}
