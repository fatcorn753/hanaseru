import { describe, expect, it } from "vitest";
import { firstVsRecent, rehearsalTrend, talkTrend, trackStats, visibleDropped } from "./trends";
import type { Experiment, Rehearsal, TalkLog } from "./types";

let t = 0;
function x(p: Partial<Experiment> = {}): Experiment {
  t += 1000;
  return {
    createdAt: t,
    doneAt: t,
    status: "done",
    title: "t",
    level: 1,
    prediction: "",
    confidence: 80,
    expectedAnxiety: 7,
    cameTrue: 10,
    peakAnxiety: 5,
    ...p,
  };
}

describe("firstVsRecent", () => {
  it("4 回未満は比べない", () => {
    expect(firstVsRecent([1, 2, 3])).toBeNull();
  });
  it("区間が重ならない", () => {
    expect(firstVsRecent([80, 60, 40, 20, 10])).toEqual({ first: 80 * 0.5 + 60 * 0.5, recent: 15, n: 2 });
  });
  it("多いときは最初と最近の 3 回ずつ", () => {
    expect(firstVsRecent([90, 90, 90, 50, 50, 30, 30, 30])).toEqual({ first: 90, recent: 30, n: 3 });
  });
});

describe("trackStats", () => {
  it("場面ごとに分け、実験のない場面は出さない", () => {
    const xs = [
      x({ confidence: 90 }),
      x({ track: "work", level: 3, cameTrue: 70 }),
      x({ missionId: "sp1-rehearse" }),
      x({ confidence: 70 }),
      x({ confidence: 50, level: 2 }),
      x({ confidence: 30, level: 2 }),
      x({ status: "planned" }),
    ];
    const s = trackStats(xs);
    expect(s.map((r) => r.track)).toEqual(["chat", "speech", "work"]);
    const chat = s[0];
    expect(chat.count).toBe(4);
    expect(chat.topLevel).toBe(2);
    expect(chat.confidence).toEqual({ first: 80, recent: 40, n: 2 });
    expect(s[2].disconfirmed).toBe(0);
  });
  it("終わった順に並べてから比べる", () => {
    const xs = [x({ doneAt: 4, confidence: 10 }), x({ doneAt: 1, confidence: 90 }), x({ doneAt: 3, confidence: 10 }), x({ doneAt: 2, confidence: 90 })];
    expect(trackStats(xs)[0].confidence).toEqual({ first: 90, recent: 10, n: 2 });
  });
});

describe("talkTrend", () => {
  it("終えた回だけを古い順に", () => {
    const logs: TalkLog[] = [
      { createdAt: 20, scriptId: "b", finished: true, turns: [{ nodeId: "a", choice: 0, tone: "good", latencyMs: 900, speakMs: 1000 }] },
      { createdAt: 10, scriptId: "a", finished: true, turns: [{ nodeId: "a", choice: 0, tone: "ok" }] },
      { createdAt: 30, scriptId: "c", finished: false, turns: [] },
    ];
    const p = talkTrend(logs);
    expect(p.map((x) => x.scriptId)).toEqual(["a", "b"]);
    expect(p[0].medianLatencyMs).toBeNull();
    expect(p[1].medianLatencyMs).toBe(900);
    expect(p[1].good).toBe(1);
  });
});

describe("リハーサル", () => {
  const rs: Rehearsal[] = [
    { createdAt: 2, seconds: 60, predictedVisible: 7, afterVisible: 4 },
    { createdAt: 1, seconds: 60, predictedVisible: 5, afterVisible: 5 },
    { createdAt: 3, seconds: 60, predictedVisible: 6 },
  ];
  it("古い順", () => {
    expect(rehearsalTrend(rs).map((r) => r.createdAt)).toEqual([1, 2, 3]);
  });
  it("話したあとに見積もりが下がった回を数える", () => {
    expect(visibleDropped(rs)).toBe(1);
  });
});
