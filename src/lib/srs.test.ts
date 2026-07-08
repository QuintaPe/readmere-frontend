import { describe, it, expect } from "vitest";
import { applySrs, srsToLevel, levelColor, type SrsCard } from "./srs";

const newCard: SrsCard = {
  srsInterval: 0,
  srsEase: 2.5,
  srsReps: 0,
  srsLapses: 0,
};

describe("srsToLevel", () => {
  it("returns 1 for a brand-new card with no reps", () => {
    expect(srsToLevel(0, 0)).toBe(1);
  });

  it("climbs with interval once there are reps", () => {
    expect(srsToLevel(1, 1)).toBe(2);
    expect(srsToLevel(6, 3)).toBe(4);
    expect(srsToLevel(100, 8)).toBe(10);
  });

  it("is monotonic in interval", () => {
    let prev = 0;
    for (const iv of [0, 1, 3, 6, 10, 17, 25, 40, 90, 200]) {
      const lv = srsToLevel(iv, 5);
      expect(lv).toBeGreaterThanOrEqual(prev);
      prev = lv;
    }
  });
});

describe("levelColor", () => {
  it("clamps out-of-range levels", () => {
    expect(levelColor(0)).toBe(levelColor(1));
    expect(levelColor(99)).toBe(levelColor(10));
  });
});

describe("applySrs", () => {
  it("'again' (0) resets reps, adds a lapse and lowers ease", () => {
    const primed: SrsCard = { srsInterval: 10, srsEase: 2.5, srsReps: 3, srsLapses: 0 };
    const r = applySrs(primed, 0);
    expect(r.srsReps).toBe(0);
    expect(r.srsLapses).toBe(1);
    expect(r.srsEase).toBeCloseTo(2.3, 5);
    expect(r.srsInterval).toBe(0);
    // Requeued ~10 min out, i.e. still today.
    expect(new Date(r.srsDue).getTime()).toBeGreaterThan(Date.now());
  });

  it("first 'good' review schedules 1 day", () => {
    const r = applySrs(newCard, 2);
    expect(r.srsReps).toBe(1);
    expect(r.srsInterval).toBe(1);
    expect(r.status).toBe("learning");
  });

  it("first 'easy' review jumps to 3 days", () => {
    const r = applySrs(newCard, 3);
    expect(r.srsInterval).toBe(3);
  });

  it("mature cards grow by the ease multiplier on 'good'", () => {
    const mature: SrsCard = { srsInterval: 10, srsEase: 2.5, srsReps: 4, srsLapses: 0 };
    // rng fijo en 0.5 → fuzz neutro (factor 1.0)
    const r = applySrs(mature, 2, () => 0.5);
    expect(r.srsInterval).toBe(Math.round(10 * 2.5));
  });

  it("fuzzes mature intervals within ±5%", () => {
    const mature: SrsCard = { srsInterval: 100, srsEase: 2.5, srsReps: 4, srsLapses: 0 };
    const low = applySrs(mature, 2, () => 0); // factor 0.95
    const high = applySrs(mature, 2, () => 0.999); // factor ~1.05
    expect(low.srsInterval).toBe(Math.round(250 * 0.95));
    expect(high.srsInterval).toBeGreaterThan(low.srsInterval);
    expect(high.srsInterval).toBeLessThanOrEqual(Math.ceil(250 * 1.05));
  });

  it("does not fuzz the fixed early intervals", () => {
    // Primeras dos repeticiones usan intervalos fijos: sin fuzz aunque rng sea extremo
    expect(applySrs(newCard, 2, () => 0.999).srsInterval).toBe(1);
    expect(applySrs(newCard, 3, () => 0.999).srsInterval).toBe(3);
  });

  it("never lets ease fall below 1.3", () => {
    let card: SrsCard = { ...newCard };
    for (let i = 0; i < 20; i++) card = { ...card, ...applySrs(card, 0) };
    expect(card.srsEase).toBeGreaterThanOrEqual(1.3);
  });

  it("caps ease at 2.8 on repeated 'easy'", () => {
    let card: SrsCard = { ...newCard };
    for (let i = 0; i < 20; i++) card = { ...card, ...applySrs(card, 3) };
    expect(card.srsEase).toBeLessThanOrEqual(2.8);
  });

  it("marks a well-reviewed card as 'known'", () => {
    let card: SrsCard = { ...newCard };
    let last = applySrs(card, 3);
    for (let i = 0; i < 6; i++) {
      card = { ...card, ...last };
      last = applySrs(card, 3);
    }
    expect(last.status).toBe("known");
  });
});
