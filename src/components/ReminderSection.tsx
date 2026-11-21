import { useState } from "react";
import { WEEKDAYS, buildReminderIcs, type Weekday } from "../lib/ics";
import { saveProfile } from "../lib/db";
import type { Profile } from "../lib/types";

const DEFAULT_DAYS: Weekday[] = ["MO", "TU", "WE", "TH", "FR"];

/**
 * 「もし〜したら」をカレンダーの繰り返し予定として書き出す。
 * PWA の通知にはサーバーが要るので、端末のカレンダーの通知で代わりにする。
 */
export function ReminderSection({ profile }: { profile: Profile }) {
  const [time, setTime] = useState(profile.reminder?.time ?? "12:30");
  const [days, setDays] = useState<Weekday[]>(profile.reminder?.days ?? DEFAULT_DAYS);
  const [msg, setMsg] = useState<string | null>(null);
  const it = profile.ifThen;

  const toggle = (d: Weekday) => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d]);

  const exportIcs = async () => {
    if (!it) return;
    try {
      const ics = buildReminderIcs({
        when: it.when,
        then: it.then,
        time,
        days,
        appUrl: new URL(import.meta.env.BASE_URL, location.origin).href,
      });
      await saveProfile({ ...profile, reminder: { time, days } });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
      a.download = "hanaseru-reminder.ics";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      setMsg("ファイルを開くと、カレンダーに追加できます。");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="td-card">
      <h3>カレンダーで思い出す</h3>
      {!it ? (
        <p className="small muted">先に上の「もし〜したら」を保存してください。</p>
      ) : (
        <>
          <p className="small">
            「もし{it.when}、{it.then}」を、カレンダーの繰り返し予定として追加します。予定の時刻にカレンダーが通知します。
          </p>
          <label className="td-label" htmlFor="rtime">時刻</label>
          <input className="td-input" id="rtime" type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ font: "inherit", padding: 8 }} />
          <label className="td-label">曜日</label>
          <div className="row">
            {WEEKDAYS.map((w) => (
              <button key={w.id} className="chip" aria-pressed={days.includes(w.id)} onClick={() => toggle(w.id)}>
                {w.label}
              </button>
            ))}
          </div>
          <button className="td-btn" data-variant="primary" type="button" style={{ marginTop: "var(--space-3)" }} disabled={!days.length || !time} onClick={exportIcs}>
            カレンダーに追加(.ics)
          </button>
          <p className="small muted">変更したいときは、カレンダーの古い予定を消してから追加し直してください。</p>
          {msg && <p className="feedback good" role="status">{msg}</p>}
        </>
      )}
    </div>
  );
}
