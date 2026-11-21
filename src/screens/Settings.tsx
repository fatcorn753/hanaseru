import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef, useState } from "react";
import { downloadBackup, persistState, requestPersist, type PersistState } from "../lib/backup";
import { Back, Chips } from "../components/ui";
import { HELP_LINKS } from "../content/foundation";
import { SAFETY_BEHAVIORS } from "../content/missions";
import { getProfile, importAll, saveProfile, wipeAll } from "../lib/db";
import { LINKS } from "../lib/links";
import { useNav } from "../lib/nav";
import { DEFAULT_WEEKLY_GOAL } from "../lib/stats";
import { ReminderSection } from "../components/ReminderSection";

export function Settings() {
  const go = useNav();
  const profile = useLiveQuery(() => getProfile(), []);
  const [msg, setMsg] = useState<string | null>(null);
  const [when, setWhen] = useState<string | null>(null);
  const [then, setThen] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const [persist, setPersist] = useState<PersistState | null>(null);
  useEffect(() => {
    void persistState().then(setPersist);
  }, []);
  if (!profile) return null;

  const download = async () => {
    await downloadBackup();
    setMsg("書き出しました。");
  };

  const restore = async (f: File) => {
    try {
      const json = JSON.parse(await f.text());
      if (!confirm("いまの記録をすべて、このファイルの内容で置き換えます。よろしいですか？")) return;
      await importAll(json);
      setMsg("読み込みました。");
    } catch (e) {
      setMsg(`読み込めませんでした: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div>
      <Back onClick={() => go({ name: "home" })} />
      <h1>設定</h1>

      <h2>きっかけ(もし〜したら)</h2>
      <label className="td-label" htmlFor="when">もし…</label>
      <input className="td-input" id="when" type="text" value={when ?? profile.ifThen?.when ?? ""} onChange={(e) => setWhen(e.target.value)} placeholder="例: 休憩時間に入ったら" />
      <label className="td-label" htmlFor="then">そのとき…</label>
      <input className="td-input" id="then" type="text" value={then ?? profile.ifThen?.then ?? ""} onChange={(e) => setThen(e.target.value)} placeholder="例: 今日の実験を 1 つ決める" />
      <button className="td-btn" type="button"
        style={{ marginTop: "var(--space-2)" }}
        onClick={async () => {
          const w = (when ?? profile.ifThen?.when ?? "").trim();
          const t = (then ?? profile.ifThen?.then ?? "").trim();
          await saveProfile({ ...profile, ifThen: w && t ? { when: w, then: t } : undefined });
          setMsg("きっかけを保存しました。");
        }}
      >
        保存
      </button>

      <ReminderSection profile={profile} />

      <h2>週の目標</h2>
      <p className="small muted">1 回分の休み枠つきです。目標より 1 回少なくても達成として扱います。</p>
      <div className="row">
        {[1, 2, 3, 4, 5, 7].map((n) => (
          <button
            key={n}
            className="chip"
            aria-pressed={(profile.weeklyGoal ?? DEFAULT_WEEKLY_GOAL) === n}
            onClick={() => saveProfile({ ...profile, weeklyGoal: n })}
          >
            週 {n} 回
          </button>
        ))}
      </div>

      <h2>自分のお守り行動</h2>
      <Chips options={SAFETY_BEHAVIORS} value={profile.safetyBehaviors} onChange={(v) => saveProfile({ ...profile, safetyBehaviors: v })} />

      <h2>データ</h2>
      <p className="small muted">記録はこの端末のブラウザの中だけにあります。ブラウザのデータを消すと記録も消えるので、ときどき書き出しておくと安心です。</p>
      <p className="small">
        最後の書き出し: {profile.lastExportAt ? new Date(profile.lastExportAt).toLocaleDateString("ja-JP") : "まだ書き出していません"}
      </p>
      {persist === "persisted" && <p className="small">このブラウザは、空き容量が減っても記録を消さない設定になっています。</p>}
      {persist === "best-effort" && (
        <div className="row">
          <p className="small">空き容量が減ると、ブラウザが記録を消すことがあります。</p>
          <button
            className="td-btn"
            data-size="sm"
            type="button"
            onClick={async () => {
              const r = await requestPersist();
              setPersist(r);
              if (r !== "persisted") setMsg("ブラウザが許可しませんでした。書き出しで残しておくと安心です。");
            }}
          >
            消さないよう頼む
          </button>
        </div>
      )}
      <div className="row">
        <button className="td-btn" type="button" onClick={download}>書き出す</button>
        <button className="td-btn" type="button" onClick={() => file.current?.click()}>読み込む</button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])} />
      </div>
      <button
        className="td-btn" data-variant="ghost" type="button"
        style={{ color: "var(--error-text)", marginTop: "var(--space-2)" }}
        onClick={async () => {
          if (!confirm("すべての記録と設定を削除します。元に戻せません。よろしいですか？")) return;
          await wipeAll();
          location.reload();
        }}
      >
        すべて削除する
      </button>
      {msg && <p className="small" role="status">{msg}</p>}

      <h2>感想・不具合を送る</h2>
      <p className="small">
        続けにくかった点や、わかりにくかった言葉を教えてもらえると、改善に一番役立ちます。送り先は GitHub で、内容は公開されます(GitHub のアカウントが必要です)。記録の中身や、個人がわかることは書かないでください。
      </p>
      <div className="row">
        <a className="td-btn" href={LINKS.feedback} target="_blank" rel="noreferrer">感想を送る</a>
        <a className="td-btn" href={LINKS.bug} target="_blank" rel="noreferrer">不具合を報告する</a>
      </div>

      <h2>このアプリについて</h2>
      <p className="small">
        はなせるは、社交不安への認知行動療法で効果が確かめられている考え方(行動実験・安全行動を外す・外に注意を向ける・会話後の反すうを止める)と、会話の実証研究をもとにした練習アプリです。診断や治療をするものではありません。
      </p>
      <div className="td-card small" data-tone="warm">
        <p>つらさが強いとき、生活に支障が出ているときは、専門家に相談してください。</p>
        {HELP_LINKS.map((l) => (
          <p key={l.url}>
            <a href={l.url} target="_blank" rel="noreferrer">{l.name}</a>
          </p>
        ))}
      </div>
      <p className="refs">
        主な文献: Clark &amp; Wells (1995); Clark et al. (2006) J. Consulting and Clinical Psychology; Craske et al. (2014) Behaviour Research and Therapy;
        Mayo-Wilson et al. (2014) Lancet Psychiatry; Boothby et al. (2018) Psychological Science; Epley &amp; Schroeder (2014) JEP: General;
        Huang et al. (2017) JPSP; Mastroianni et al. (2021) PNAS; Harvey et al. (2000) BRAT; Brozovich &amp; Heimberg (2008) Clin. Psych. Review.
      </p>
      <p className="muted small">版 {__APP_VERSION__}</p>
    </div>
  );
}
