import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { backupNudge, downloadBackup, isIosBrowserTab, isStandalone, snoozeUntil } from "../lib/backup";
import { db, saveProfile } from "../lib/db";
import type { Profile } from "../lib/types";
import { IconAlert, IconInfo } from "./icons";

/** ホームに出す、記録を失わないための案内(書き出し・ホーム画面への追加) */
export function KeepData({ profile }: { profile: Profile }) {
  const records = useLiveQuery(
    async () => (await db.experiments.where("status").equals("done").count()) + (await db.talks.count()) + (await db.rehearsals.count()),
    [],
  );
  const [busy, setBusy] = useState(false);
  if (records === undefined) return null;
  const nudge = backupNudge(profile, records);
  const iosTab = !profile.a2hsDismissed && isIosBrowserTab(navigator.userAgent, navigator.maxTouchPoints ?? 0, isStandalone());

  return (
    <>
      {iosTab && (
        <div className="td-notice" data-tone="warning" role="status">
          <IconAlert />
          <div className="stack">
            <p className="td-notice-title">ホーム画面に追加すると、記録が消えにくくなります</p>
            <p className="small">
              Safari で開いたままだと、7 日間開かなかったときに記録が消えることがあります。共有ボタンから「ホーム画面に追加」を選び、そこから開いてください。
            </p>
            <div className="row">
              <button className="td-btn" data-size="sm" type="button" onClick={() => saveProfile({ ...profile, a2hsDismissed: true })}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
      {nudge && (
        <div className="td-notice" role="status">
          <IconInfo />
          <div className="stack">
            <p className="td-notice-title">
              {nudge.kind === "never" ? "記録をファイルに書き出しておきましょう" : `前回の書き出しから ${nudge.days} 日たちました`}
            </p>
            <p className="small">記録はこの端末の中だけにあります。機種変更やブラウザのデータ削除に備えて、ファイルに残しておくと安心です。</p>
            <div className="row">
              <button
                className="td-btn"
                data-size="sm"
                type="button"
                aria-busy={busy || undefined}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await downloadBackup();
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                書き出す
              </button>
              <button className="td-btn" data-variant="ghost" data-size="sm" type="button" onClick={() => saveProfile({ ...profile, backupSnoozedUntil: snoozeUntil() })}>
                あとで
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
