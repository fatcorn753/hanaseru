import { describe, expect, it } from "vitest";
import { gap, heatmap, pendingPep, recommendLevel, summarize } from "./stats";
import type { Experiment, Level } from "./types";

const H = 3600_000;
const NOW = new Date(2026, 10, 21, 12).getTime();

function x(p: Partial<Experiment> = {}): Experiment {
  return {
    createdAt: NOW - 2 * H,
    status: "done",
    title: "t",
    level: 1,
    prediction: "笑われる",
    confidence: 80,
    expectedAnxiety: 7,
    doneAt: NOW - H,
    cameTrue: 10,
    peakAnxiety: 5,
    ...p,
  };
}

describe("gap", () => {
  it("予想より大丈夫なら正", () => {
    expect(gap(x())).toEqual({ belief: 70, anxiety: 2 });
  });
});

describe("summarize", () => {
  it("未完了と結果未入力は数えない", () => {
    const s = summarize([x(), x({ status: "planned" }), x({ cameTrue: undefined }), x({ cameTrue: 60 })]);
    expect(s.count).toBe(2);
    expect(s.worstRate).toBe(0.5);
    expect(s.avgCameTrue).toBe(35);
  });
  it("空なら null", () => {
    expect(summarize([]).worstRate).toBeNull();
  });
});

describe("recommendLevel", () => {
  it("記録なしは 1", () => {
    expect(recommendLevel([]).level).toBe(1);
  });
  it("最上段で予想が 2 回外れたら上げる", () => {
    expect(recommendLevel([x({ level: 2 }), x({ level: 2 })]).level).toBe(3);
  });
  it("1 回だけなら据え置き", () => {
    expect(recommendLevel([x({ level: 2 })]).level).toBe(2);
  });
  it("予想が当たっていたら据え置き", () => {
    expect(recommendLevel([x({ level: 3, cameTrue: 70 }), x({ level: 3, cameTrue: 80 })]).level).toBe(3);
  });
  it("緊張 9 以上があれば 1 段下げる", () => {
    expect(recommendLevel([x({ level: 4 }), x({ level: 4, peakAnxiety: 9 })]).level).toBe(3);
  });
  it("睡眠不足なら 1 段下げ、1 未満にはしない", () => {
    expect(recommendLevel([x({ level: 3 }), x({ level: 3 })], "poor").level).toBe(3);
    expect(recommendLevel([], "poor").level).toBe(1);
  });
  it("6 を超えない", () => {
    const six = [x({ level: 6 as Level }), x({ level: 6 as Level })];
    expect(recommendLevel(six).level).toBe(6);
  });
});

describe("heatmap", () => {
  it("日数分を古い順に返し、当日に数える", () => {
    const h = heatmap([x(), x()], 7, NOW);
    expect(h).toHaveLength(7);
    expect(h[6]).toEqual({ date: "2026-11-21", count: 2 });
    expect(h[0].count).toBe(0);
  });
});

describe("pendingPep", () => {
  it("15 分未満は出さない", () => {
    expect(pendingPep([x({ doneAt: NOW - 5 * 60_000 })], NOW)).toBeUndefined();
  });
  it("1 時間後は出す", () => {
    expect(pendingPep([x()], NOW)).toBeDefined();
  });
  it("チェック済みと 48 時間超は出さない", () => {
    expect(pendingPep([x({ pepChecked: true }), x({ doneAt: NOW - 49 * H })], NOW)).toBeUndefined();
  });
});
