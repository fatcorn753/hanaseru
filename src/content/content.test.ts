import { describe, expect, it } from "vitest";
import { DRILLS, drillById } from "./drills";
import { MISSIONS, TRACKS, trackOf, trackOfMission } from "./missions";

describe("内容データの整合性", () => {
  it("課題 ID が重複しない", () => {
    expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(MISSIONS.length);
  });
  it("どの場面も全段階に課題がある", () => {
    for (const t of TRACKS)
      for (const l of [1, 2, 3, 4, 5, 6]) expect(MISSIONS.some((m) => trackOfMission(m) === t && m.level === l), `${t}/${l}`).toBe(true);
  });
  it("古い記録(track なし)は課題から場面を引き、なければ雑談", () => {
    expect(trackOf({ missionId: "wk2-confirm" })).toBe("work");
    expect(trackOf({ missionId: "l1-weather" })).toBe("chat");
    expect(trackOf({})).toBe("chat");
    expect(trackOf({ track: "assert", missionId: "l1-weather" })).toBe("assert");
  });
  it("課題が参照するドリルは存在する", () => {
    for (const m of MISSIONS) for (const s of m.skillIds ?? []) expect(drillById(s), `${m.id}→${s}`).toBeDefined();
  });
  it("各設問に正解と不正解が少なくとも 1 つずつある", () => {
    for (const d of DRILLS)
      for (const i of d.items) {
        expect(i.options.some((o) => o.good), `${d.id}/${i.id}`).toBe(true);
        expect(i.options.some((o) => !o.good), `${d.id}/${i.id}`).toBe(true);
      }
  });
  it("設問 ID はドリル内で重複しない", () => {
    for (const d of DRILLS) expect(new Set(d.items.map((i) => i.id)).size).toBe(d.items.length);
  });
});
