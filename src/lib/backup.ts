import { exportAll, getProfile, saveProfile } from "./db";
import { localDate } from "./date";
import type { Profile } from "./types";

const DAY = 86400_000;
/** 書き出しをすすめる間隔 */
export const BACKUP_EVERY_DAYS = 30;
/** 「あとで」を押したときに案内を休む日数 */
export const SNOOZE_DAYS = 7;
/** これより記録が少ないうちは、書き出しをすすめない(失うものがまだ少ない) */
export const MIN_RECORDS = 3;

export type BackupNudge = { kind: "never" } | { kind: "stale"; days: number };

/** 書き出しをすすめるか。すすめるなら、初めてか、前回から何日たったか */
export function backupNudge(
  p: Pick<Profile, "lastExportAt" | "backupSnoozedUntil">,
  records: number,
  now = Date.now(),
): BackupNudge | null {
  if (records < MIN_RECORDS) return null;
  if (p.backupSnoozedUntil !== undefined && now < p.backupSnoozedUntil) return null;
  if (p.lastExportAt === undefined) return { kind: "never" };
  const days = Math.floor((now - p.lastExportAt) / DAY);
  return days >= BACKUP_EVERY_DAYS ? { kind: "stale", days } : null;
}

export const snoozeUntil = (now = Date.now()) => now + SNOOZE_DAYS * DAY;

/**
 * iPhone・iPad の Safari で、ホーム画面に追加せずに開いているか。
 * この状態では、7 日間開かないとサイトの保存データが消されることがある(WebKit の追跡防止)。
 * iPadOS の Safari は Mac と同じ UA を名乗るので、タッチ点の数で見分ける。
 */
export function isIosBrowserTab(ua: string, maxTouchPoints: number, standalone: boolean) {
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1);
  return ios && !standalone;
}

export function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export type PersistState = "persisted" | "best-effort" | "unsupported";

/**
 * ブラウザに、空き容量が減っても保存データを消さないよう頼む。
 * Chrome は確認なしに判断し、Firefox は一度だけ確認を出す。結果は端末側が決める。
 */
export async function requestPersist(): Promise<PersistState> {
  const s = navigator.storage;
  if (!s?.persist || !s.persisted) return "unsupported";
  try {
    if (await s.persisted()) return "persisted";
    return (await s.persist()) ? "persisted" : "best-effort";
  } catch {
    return "best-effort";
  }
}

export async function persistState(): Promise<PersistState> {
  const s = navigator.storage;
  if (!s?.persisted) return "unsupported";
  try {
    return (await s.persisted()) ? "persisted" : "best-effort";
  } catch {
    return "best-effort";
  }
}

/** 全記録を JSON ファイルにして保存させ、書き出した時刻を覚える */
export async function downloadBackup() {
  const blob = new Blob([JSON.stringify(await exportAll(), null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `hanaseru-${localDate()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  // 保存ダイアログで取り消されたかは分からないので、書き出しを始めた時点で記録する
  const p = await getProfile();
  await saveProfile({ ...p, lastExportAt: Date.now(), backupSnoozedUntil: undefined });
}
