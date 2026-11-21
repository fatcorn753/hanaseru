import Dexie, { type Table } from "dexie";
import type { DrillAttempt, Experiment, Profile, Reflection, Rehearsal, SleepLog, TalkLog, VideoReview } from "./types";

export class HanaseruDB extends Dexie {
  experiments!: Table<Experiment, number>;
  sleep!: Table<SleepLog, string>;
  videos!: Table<VideoReview, number>;
  reflections!: Table<Reflection, number>;
  drills!: Table<DrillAttempt, number>;
  talks!: Table<TalkLog, number>;
  rehearsals!: Table<Rehearsal, number>;
  kv!: Table<{ key: string; value: unknown }, string>;

  constructor(name = "hanaseru") {
    super(name);
    this.version(1).stores({
      experiments: "++id, createdAt, status, doneAt, level",
      sleep: "date",
      videos: "++id, createdAt",
      reflections: "++id, createdAt, experimentId",
      drills: "++id, createdAt, drillId",
      kv: "key",
    });
    this.version(2).stores({ talks: "++id, createdAt, scriptId" });
    this.version(3).stores({ rehearsals: "++id, createdAt" });
  }
}

export const db = new HanaseruDB();

const EMPTY_PROFILE: Profile = { safetyBehaviors: [] };

export async function getProfile(d: HanaseruDB = db): Promise<Profile> {
  const row = await d.kv.get("profile");
  return { ...EMPTY_PROFILE, ...((row?.value as Profile) ?? {}) };
}

export async function saveProfile(p: Profile, d: HanaseruDB = db) {
  await d.kv.put({ key: "profile", value: p });
}

export const BACKUP_FORMAT = "hanaseru-backup";
export const BACKUP_VERSION = 1;

const TABLES = ["experiments", "sleep", "videos", "reflections", "drills", "talks", "rehearsals", "kv"] as const;

/** 端末内の全データを JSON にする。録画そのものは保存していないので含まれない */
export async function exportAll(d: HanaseruDB = db) {
  const data: Record<string, unknown[]> = {};
  for (const t of TABLES) data[t] = await d.table(t).toArray();
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: Date.now(), data };
}

/** バックアップで全データを置き換える。形式が違えば何も変更せずに例外を投げる */
export async function importAll(json: unknown, d: HanaseruDB = db) {
  const b = json as { format?: string; version?: number; data?: Record<string, unknown[]> };
  if (b?.format !== BACKUP_FORMAT || typeof b.version !== "number" || !b.data) {
    throw new Error("はなせるのバックアップファイルではありません");
  }
  if (b.version > BACKUP_VERSION) throw new Error("新しい版のアプリで作られたバックアップです");
  for (const t of TABLES) {
    if (b.data[t] !== undefined && !Array.isArray(b.data[t])) throw new Error(`${t} の形式が不正です`);
  }
  await d.transaction("rw", TABLES.map((t) => d.table(t)), async () => {
    for (const t of TABLES) {
      await d.table(t).clear();
      if (b.data![t]?.length) await d.table(t).bulkAdd(b.data![t]);
    }
  });
}

export async function wipeAll(d: HanaseruDB = db) {
  await d.transaction("rw", TABLES.map((t) => d.table(t)), async () => {
    for (const t of TABLES) await d.table(t).clear();
  });
}
