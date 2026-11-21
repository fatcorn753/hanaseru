/** 曜日。RFC 5545 の BYDAY の値 */
export type Weekday = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";
export const WEEKDAYS: { id: Weekday; label: string }[] = [
  { id: "MO", label: "月" },
  { id: "TU", label: "火" },
  { id: "WE", label: "水" },
  { id: "TH", label: "木" },
  { id: "FR", label: "金" },
  { id: "SA", label: "土" },
  { id: "SU", label: "日" },
];

export interface ReminderInput {
  when: string;
  then: string;
  /** HH:MM(端末のローカル時刻) */
  time: string;
  days: Weekday[];
  appUrl: string;
  /** 開始日。省略時は今日 */
  start?: Date;
  /** テスト用に固定できるようにする */
  uid?: string;
  now?: Date;
}

/** TEXT 値のエスケープ(RFC 5545 3.3.11) */
export function escapeText(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/**
 * 1 行 75 オクテットで折り返す(RFC 5545 3.1)。
 * 日本語は UTF-8 で 3 バイトになるので、文字の途中で切らないよう文字単位で数える。
 */
export function foldLine(line: string) {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    // 2 行目以降は先頭の空白 1 オクテットを含めて 75 以内にする
    const limit = out.length === 0 ? 75 : 74;
    if (bytes + n > limit) {
      out.push(cur);
      cur = "";
      bytes = 0;
    }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.join("\r\n ");
}

const pad = (n: number) => String(n).padStart(2, "0");
const utcStamp = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

/**
 * 「もし〜したら、〜する」を、繰り返しの予定(5 分・開始時に通知)として .ics にする。
 * 時刻はタイムゾーンを付けない floating time にして、カレンダー側の現地時刻で鳴らす。
 * サーバーなしで通知の代わりにするための仕組み。
 */
export function buildReminderIcs(r: ReminderInput): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(r.time);
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) throw new Error("時刻は HH:MM で指定してください");
  if (!r.days.length) throw new Error("曜日を 1 つ以上選んでください");
  // DTSTART が BYDAY に含まれない曜日だと、開始日にも余分な 1 回を入れるカレンダーがあるため、
  // 選んだ曜日のうち最初に来る日まで進める
  const start = new Date(r.start ?? new Date());
  const jsDay: Record<Weekday, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
  const wanted = new Set(r.days.map((d) => jsDay[d]));
  while (!wanted.has(start.getDay())) start.setDate(start.getDate() + 1);
  const h = Number(m[1]);
  const min = Number(m[2]);
  const ymd = `${start.getFullYear()}${pad(start.getMonth() + 1)}${pad(start.getDate())}`;
  const end = new Date(2000, 0, 1, h, min + 5);
  const dtStart = `${ymd}T${pad(h)}${pad(min)}00`;
  // 23:55 以降でも日付をまたがないよう、終了は開始と同じ日の範囲に収める
  const dtEnd = end.getDate() === 1 ? `${ymd}T${pad(end.getHours())}${pad(end.getMinutes())}00` : `${ymd}T235900`;
  const order = WEEKDAYS.map((w) => w.id);
  const byday = [...new Set(r.days)].sort((a, b) => order.indexOf(a) - order.indexOf(b)).join(",");
  const uid = r.uid ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}@hanaseru`;
  const summary = `はなせる: ${r.then}`;
  const desc = `もし${r.when}、${r.then}。\n${r.appUrl}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//hanaseru//reminder//JA",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${utcStamp(r.now ?? new Date())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${byday}`,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(desc)}`,
    `URL:${r.appUrl}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(summary)}`,
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
