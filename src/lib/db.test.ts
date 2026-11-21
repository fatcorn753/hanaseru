import { describe, expect, it } from "vitest";
import { HanaseruDB, exportAll, getProfile, importAll, saveProfile, wipeAll } from "./db";

describe("バックアップ", () => {
  it("書き出し→全消去→読み込みで戻る", async () => {
    const d = new HanaseruDB("t1");
    await d.experiments.add({ createdAt: 1, status: "done", title: "a", level: 1, prediction: "p", confidence: 50, expectedAnxiety: 5 });
    await saveProfile({ safetyBehaviors: ["目をそらす"] }, d);
    await d.talks.add({ createdAt: 2, scriptId: "class-before", turns: [{ nodeId: "n1", choice: 0, tone: "good" }], finished: true });
    const b = JSON.parse(JSON.stringify(await exportAll(d)));
    await wipeAll(d);
    expect(await d.experiments.count()).toBe(0);
    await importAll(b, d);
    expect(await d.experiments.count()).toBe(1);
    expect(await d.talks.count()).toBe(1);
    expect((await getProfile(d)).safetyBehaviors).toEqual(["目をそらす"]);
  });

  it("形式違いは拒否し、既存データを残す", async () => {
    const d = new HanaseruDB("t2");
    await d.sleep.put({ date: "2026-11-21", quality: "ok" });
    await expect(importAll({ foo: 1 }, d)).rejects.toThrow();
    await expect(importAll({ format: "hanaseru-backup", version: 1, data: { sleep: "x" } }, d)).rejects.toThrow();
    expect(await d.sleep.count()).toBe(1);
  });

  it("未来の版は拒否", async () => {
    const d = new HanaseruDB("t3");
    await expect(importAll({ format: "hanaseru-backup", version: 99, data: {} }, d)).rejects.toThrow("新しい版");
  });
});
