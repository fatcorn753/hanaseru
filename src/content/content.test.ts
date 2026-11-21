import { describe, expect, it } from "vitest";
import { DRILLS, drillById } from "./drills";
import { MISSIONS } from "./missions";

describe("内容データの整合性", () => {
  it("課題 ID が重複しない", () => {
    expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(MISSIONS.length);
  });
  it("全段階に課題がある", () => {
    for (const l of [1, 2, 3, 4, 5, 6]) expect(MISSIONS.some((m) => m.level === l)).toBe(true);
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
