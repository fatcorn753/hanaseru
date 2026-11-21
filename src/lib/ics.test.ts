import { describe, expect, it } from "vitest";
import { buildReminderIcs, escapeText, foldLine } from "./ics";

const base = {
  when: "休憩時間に入ったら",
  then: "今日の実験を 1 つ決める",
  time: "12:30",
  days: ["WE", "MO", "FR"] as const,
  appUrl: "https://example.test/hanaseru/",
  start: new Date(2026, 10, 21),
  uid: "u1@hanaseru",
  now: new Date(Date.UTC(2026, 10, 21, 3, 4, 5)),
};

describe("escapeText", () => {
  it("区切り文字と改行をエスケープ", () => {
    expect(escapeText("a,b;c\\d\ne")).toBe("a\\,b\;c\\\\d\\ne");
  });
});

describe("foldLine", () => {
  it("75 オクテット以内に折り返し、文字を壊さない", () => {
    const line = "DESCRIPTION:" + "あ".repeat(60);
    const folded = foldLine(line);
    const parts = folded.split("\r\n");
    const enc = new TextEncoder();
    for (const p of parts) expect(enc.encode(p).length).toBeLessThanOrEqual(75);
    expect(parts.slice(1).every((p) => p.startsWith(" "))).toBe(true);
    expect(parts.map((p, i) => (i ? p.slice(1) : p)).join("")).toBe(line);
  });
  it("短い行はそのまま", () => {
    expect(foldLine("VERSION:2.0")).toBe("VERSION:2.0");
  });
});

describe("buildReminderIcs", () => {
  const ics = buildReminderIcs({ ...base, days: [...base.days] });
  it("必要な項目を含み、CRLF で終わる", () => {
    expect(ics).toContain("DTEND:20261123T123500\r\n");
    expect(ics).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR\r\n");
    expect(ics).toContain("DTSTAMP:20261121T030405Z\r\n");
    expect(ics).toContain("TRIGGER:PT0M");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "").includes("\n")).toBe(false);
  });
  it("本文の読点(、)はエスケープ不要、半角カンマはエスケープ", () => {
    const unfolded = ics.replace(/\r\n /g, "");
    expect(unfolded).toContain("DESCRIPTION:もし休憩時間に入ったら、今日の実験を 1 つ決める。\\nhttps://example.test/hanaseru/");
    const x = buildReminderIcs({ ...base, days: ["MO"], then: "a,b" });
    expect(x).toContain("SUMMARY:はなせる: a\\,b");
  });
  it("開始日を選んだ曜日の最初の日に合わせる(11/21 は土曜 → 月曜の 11/23)", () => {
    expect(ics).toContain("DTSTART:20261123T123000\r\n");
    const sat = buildReminderIcs({ ...base, days: ["SA"] });
    expect(sat).toContain("DTSTART:20261121T123000\r\n");
  });
  it("23:58 開始でも日付をまたがない", () => {
    const x = buildReminderIcs({ ...base, days: ["SA"], time: "23:58" });
    expect(x).toContain("DTEND:20261121T235900");
  });
  it("不正な時刻や曜日なしは拒否", () => {
    expect(() => buildReminderIcs({ ...base, days: ["MO"], time: "25:00" })).toThrow();
    expect(() => buildReminderIcs({ ...base, days: [] })).toThrow();
  });
});
