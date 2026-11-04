import { describe, expect, it } from "vitest";
import {
  advanceSparks,
  applyGearClick,
  createGearState,
  createSpark,
  GEAR_BASE_SPEED,
  GEAR_MAX_SPEED,
  sparkIntensity,
  stepGear,
  takeSparkCount,
  type GearState,
} from "../gearPhysics";

/** Bấm n lần liên tiếp không chờ. */
function clicks(state: GearState, n: number): GearState {
  let next = state;
  for (let i = 0; i < n; i++) next = applyGearClick(next);
  return next;
}

describe("gearPhysics", () => {
  it("bấm thì tăng tốc, có trần, rồi chậm dần về tốc độ nền", () => {
    const fast = clicks(createGearState(), 50);
    expect(fast.speed).toBe(GEAR_MAX_SPEED);

    let state = fast;
    for (let i = 0; i < 600; i++) state = stepGear(state, 1 / 60, GEAR_BASE_SPEED);
    expect(state.speed).toBeGreaterThan(GEAR_BASE_SPEED);
    expect(state.speed).toBeLessThan(GEAR_BASE_SPEED + 1);
  });

  it("một lần bấm không tóe lửa, bấm dồn dập thì có", () => {
    const once = applyGearClick(createGearState());
    expect(takeSparkCount(once, 0.1)[0]).toBe(0);

    const spam = clicks(createGearState(), 4);
    expect(takeSparkCount(spam, 0.1)[0]).toBeGreaterThan(0);
  });

  it("nguội dần thì thôi tóe lửa", () => {
    let state = clicks(createGearState(), 4);
    for (let i = 0; i < 180; i++) state = stepGear(state, 1 / 60, GEAR_BASE_SPEED);
    expect(takeSparkCount(state, 0.1)[0]).toBe(0);
  });

  it("cường độ tóe lửa tăng êm, không nhảy bậc", () => {
    expect(sparkIntensity(0)).toBe(0);
    expect(sparkIntensity(10)).toBe(1);
    let previous = 0;
    for (let heat = 0; heat <= 6; heat += 0.05) {
      const value = sparkIntensity(heat);
      expect(value).toBeGreaterThanOrEqual(previous);
      expect(value - previous).toBeLessThan(0.05);
      previous = value;
    }
  });

  it("tia lửa rơi theo trọng lực và biến mất khi hết thời gian", () => {
    const random = () => 0.5;
    const sparks = [createSpark({ x: 0, y: 0 }, { x: 1, y: 0 }, 100, random)];
    const startY = sparks[0].y;
    advanceSparks(sparks, 0.05, 900);
    expect(sparks).toHaveLength(1);
    expect(sparks[0].y).toBeGreaterThan(startY);

    advanceSparks(sparks, 2, 900);
    expect(sparks).toHaveLength(0);
  });
});
