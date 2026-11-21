import { describe, expect, it } from "vitest";
import { backupNudge, isIosBrowserTab, snoozeUntil } from "./backup";

const DAY = 86400_000;
const NOW = new Date(2026, 10, 22, 12).getTime();

describe("書き出しの案内", () => {
  it("記録が少ないうちは出さない", () => {
    expect(backupNudge({}, 2, NOW)).toBeNull();
  });
  it("一度も書き出していなければ出す", () => {
    expect(backupNudge({}, 3, NOW)).toEqual({ kind: "never" });
  });
  it("前回から 30 日たったら出す", () => {
    expect(backupNudge({ lastExportAt: NOW - 29 * DAY }, 10, NOW)).toBeNull();
    expect(backupNudge({ lastExportAt: NOW - 30 * DAY }, 10, NOW)).toEqual({ kind: "stale", days: 30 });
  });
  it("あとでにした間は出さず、期限が過ぎたら出す", () => {
    const until = snoozeUntil(NOW);
    expect(backupNudge({ backupSnoozedUntil: until }, 5, NOW + 6 * DAY)).toBeNull();
    expect(backupNudge({ backupSnoozedUntil: until }, 5, NOW + 7 * DAY)).toEqual({ kind: "never" });
  });
});

describe("iOS の Safari のタブ", () => {
  const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1";
  const mac = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15";
  const android = "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36";
  it("iPhone のタブは対象、ホーム画面から開いたら対象外", () => {
    expect(isIosBrowserTab(iphone, 5, false)).toBe(true);
    expect(isIosBrowserTab(iphone, 5, true)).toBe(false);
  });
  it("iPad は Mac の UA でもタッチ点で見分ける", () => {
    expect(isIosBrowserTab(mac, 5, false)).toBe(true);
    expect(isIosBrowserTab(mac, 0, false)).toBe(false);
  });
  it("Android は対象外", () => {
    expect(isIosBrowserTab(android, 5, false)).toBe(false);
  });
});
