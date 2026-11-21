import { describe, expect, it } from "vitest";
import { SCRIPTS, type Script } from "../content/scripts";
import { DRILLS } from "../content/drills";
import { SpeechDetector, rms, summarizeTalk, validateScript } from "./talk";

describe("台本", () => {
  it("すべての台本に矛盾がない", () => {
    for (const s of SCRIPTS) expect(validateScript(s)).toEqual([]);
  });
  it("ID が重複しない", () => {
    expect(new Set(SCRIPTS.map((s) => s.id)).size).toBe(SCRIPTS.length);
  });
  it("型の ID は道場のドリルにある", () => {
    const ids = new Set(DRILLS.map((d) => d.id));
    for (const s of SCRIPTS)
      for (const n of Object.values(s.nodes)) for (const c of n.choices ?? []) if (c.skill) expect(ids.has(c.skill)).toBe(true);
  });
  it("壊れた台本を見つける", () => {
    const bad: Script = {
      id: "x", scene: "class", title: "", setting: "", partner: "", voice: { pitch: 1, rate: 1 }, start: "a",
      nodes: {
        a: { says: "a", choices: [{ text: "", next: "b", tone: "ok", note: "" }, { text: "", next: "zz", tone: "ok", note: "" }] },
        b: { says: "b", choices: [{ text: "", next: "a", tone: "ok", note: "" }] },
        lone: { says: "l", end: true },
      },
    };
    const e = validateScript(bad).join("\n");
    expect(e).toContain('行き先 "zz"');
    expect(e).toContain("lone: 開始からたどり着けない");
    expect(e).toContain("a: 終わりに行けない");
  });
});

describe("まとめ", () => {
  it("よい返しの型と、声の数値をまとめる", () => {
    const s = summarizeTalk([
      { nodeId: "a", choice: 0, tone: "good", skill: "followup", latencyMs: 800, speakMs: 2000 },
      { nodeId: "b", choice: 1, tone: "closed", skill: "aizuchi", latencyMs: null, speakMs: 0 },
      { nodeId: "c", choice: 0, tone: "good", skill: "followup", latencyMs: 1600, speakMs: 1000 },
      { nodeId: "d", choice: 0, tone: "good", skill: "ending" },
    ]);
    expect(s.good).toBe(3);
    expect(s.skills).toEqual(["followup", "ending"]);
    expect(s.voiced).toBe(2);
    expect(s.medianLatencyMs).toBe(1200);
    expect(s.speakMs).toBe(3000);
  });
  it("声を使わなければ数値は空", () => {
    const s = summarizeTalk([{ nodeId: "a", choice: 0, tone: "ok" }]);
    expect(s.medianLatencyMs).toBeNull();
    expect(s.voiced).toBe(0);
  });
});

/** 50ms ごとの RMS 列を流し込む */
function feed(d: SpeechDetector, xs: number[], step = 50) {
  xs.forEach((x, i) => d.push(x, i * step));
  return (xs.length - 1) * step;
}

describe("話し始めの検出", () => {
  it("静かな部屋: 1 秒後に 1 秒話す", () => {
    const d = new SpeechDetector();
    const end = feed(d, [...Array(20).fill(0.003), ...Array(20).fill(0.1), ...Array(20).fill(0.003)]);
    expect(d.latencyMs()).toBe(1000);
    expect(d.speakingMs()).toBeGreaterThanOrEqual(900);
    expect(d.speakingMs()).toBeLessThanOrEqual(1000);
    expect(d.finishedSpeaking(end, 800)).toBe(true);
  });
  it("一瞬の物音は話し始めにしない", () => {
    const d = new SpeechDetector();
    feed(d, [...Array(10).fill(0.003), 0.2, 0.003, ...Array(10).fill(0.003)]);
    expect(d.latencyMs()).toBeNull();
    expect(d.speakingMs()).toBe(0);
  });
  it("騒がしい場所: 雑音より十分大きい声だけを拾う", () => {
    const d = new SpeechDetector();
    feed(d, [...Array(20).fill(0.03), ...Array(10).fill(0.04), ...Array(10).fill(0.2)]);
    expect(d.latencyMs()).toBe(1500);
  });
  it("話していなければ終わっていない", () => {
    const d = new SpeechDetector();
    const end = feed(d, Array(40).fill(0.003));
    expect(d.finishedSpeaking(end, 800)).toBe(false);
  });
  it("話の途中の間を数える", () => {
    const d = new SpeechDetector();
    const q = (n: number) => Array(n).fill(0.003);
    const v = (n: number) => Array(n).fill(0.1);
    // 話す 1 秒 → 間 2.5 秒 → 話す 1 秒 → 間 0.6 秒 → 話す 1 秒
    feed(d, [...q(4), ...v(20), ...q(50), ...v(20), ...q(12), ...v(20)]);
    const p = d.pauses(2000);
    expect(p.count).toBe(1);
    expect(p.longest).toBeGreaterThanOrEqual(2500);
    expect(p.longest).toBeLessThan(2700);
  });
  it("rms", () => {
    expect(rms(new Float32Array([0.5, -0.5, 0.5, -0.5]))).toBeCloseTo(0.5);
  });
});
