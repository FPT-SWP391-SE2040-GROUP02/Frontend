import { describe, expect, it } from "vitest";
import {
  createRipple,
  dotBaseVisibility,
  hoverEnergy,
  RIPPLE_LIFE,
  RIPPLE_SPEED,
  rippleEnergy,
  stepRipples,
} from "../dotField";

describe("dotField", () => {
  it("năng lượng sóng mạnh nhất ở mặt sóng và yếu đi ở xa", () => {
    const ripple = createRipple(0, 0, 1);
    ripple.age = 0.5;
    const front = 0.5 * RIPPLE_SPEED;
    expect(rippleEnergy(front, ripple)).toBeGreaterThan(rippleEnergy(front + 60, ripple));
    expect(rippleEnergy(front, ripple)).toBeGreaterThan(rippleEnergy(front - 60, ripple));
    expect(rippleEnergy(front + 1000, ripple)).toBe(0);
  });

  it("gợn sóng mờ dần theo tuổi rồi bị bỏ khi hết đời", () => {
    const young = createRipple(0, 0, 1);
    young.age = 0.2;
    const old = createRipple(0, 0, 1);
    old.age = 1.5;
    expect(rippleEnergy(0.2 * RIPPLE_SPEED, young)).toBeGreaterThan(
      rippleEnergy(1.5 * RIPPLE_SPEED, old),
    );

    const ripples = [createRipple(0, 0, 1)];
    stepRipples(ripples, RIPPLE_LIFE / 2);
    expect(ripples).toHaveLength(1);
    stepRipples(ripples, RIPPLE_LIFE);
    expect(ripples).toHaveLength(0);
  });

  it("quanh con trỏ: 1 ngay dưới con trỏ, về 0 ở mép vùng ảnh hưởng", () => {
    expect(hoverEnergy(0)).toBe(1);
    expect(hoverEnergy(75)).toBeGreaterThan(0);
    expect(hoverEnergy(75)).toBeLessThan(1);
    expect(hoverEnergy(500)).toBe(0);
  });

  it("chấm rõ ở giữa, mờ ra rìa", () => {
    expect(dotBaseVisibility(0.5, 0.45)).toBe(1);
    expect(dotBaseVisibility(0, 0)).toBe(0);
  });
});
