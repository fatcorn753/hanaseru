import { describe, expect, it } from "vitest";
import { gap, goalProgress, heatmap, pendingPep, pendingReview, recommendLevel, summarize, weekKey, weekStart, weekSummary } from "./stats";
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

describe("週の集計", () => {
  // 2026-11-21 は土曜。その週の月曜は 11-16
  it("weekStart は月曜 0:00", () => {
    expect(weekKey(NOW)).toBe("2026-11-16");
    expect(weekKey(new Date(2026, 10, 16, 0, 0).getTime())).toBe("2026-11-16");
    expect(weekKey(new Date(2026, 10, 22, 23, 59).getTime())).toBe("2026-11-16");
    expect(weekKey(new Date(2026, 10, 23).getTime())).toBe("2026-11-23");
  });
  it("weekSummary は週の範囲だけ数える", () => {
    const ws = weekStart(NOW);
    const s = weekSummary(
      [x({ learned: "a", safetyBehaviorDropped: "目" }), x({ cameTrue: 80, safetyBehaviorDropped: "目" }), x({ doneAt: ws - 1 })],
      ws,
    );
    expect(s.count).toBe(2);
    expect(s.disconfirmed).toBe(1);
    expect(s.learned).toEqual(["a"]);
    expect(s.dropped).toEqual(["目"]);
  });
  it("pendingReview: 先週に実験があり未確認なら出す", () => {
    const lastWeek = x({ doneAt: NOW - 7 * 24 * H });
    expect(pendingReview([lastWeek], undefined, NOW)?.key).toBe("2026-11-09");
    expect(pendingReview([lastWeek], "2026-11-09", NOW)).toBeUndefined();
    expect(pendingReview([lastWeek], "2026-11-16", NOW)).toBeUndefined();
  });
  it("pendingReview: 先週に実験がなければ出さない", () => {
    expect(pendingReview([x()], undefined, NOW)).toBeUndefined();
  });
});

describe("goalProgress", () => {
  it("目標以上は達成、1 少ないと休み枠、それ未満は途中", () => {
    expect(goalProgress(3, 3).state).toBe("done");
    expect(goalProgress(2, 3).state).toBe("reserve");
    expect(goalProgress(1, 3).state).toBe("todo");
    expect(goalProgress(0, 1).state).toBe("todo");
  });
});
