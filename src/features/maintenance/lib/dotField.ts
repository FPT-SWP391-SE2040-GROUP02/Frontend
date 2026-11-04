/**
 * Lưới chấm nền tương tác trên màn hình bảo trì: con trỏ di chuyển thì lan ra gợn sóng, chấm trên mặt sóng
 * dạt ra và sáng lên; quanh con trỏ chấm hơi dạt ra. Hàm thuần, không đụng DOM, để test được.
 */

/** Khoảng cách giữa hai chấm (px). */
export const DOT_SPACING = 26;
/** Tốc độ lan của mặt sóng (px/giây). */
export const RIPPLE_SPEED = 380;
/** Thời gian sống của một gợn sóng (giây). */
export const RIPPLE_LIFE = 1.8;
/** Độ dày dải sáng quanh mặt sóng (px). */
export const RIPPLE_WIDTH = 46;
/** Bán kính vùng ảnh hưởng quanh con trỏ (px). */
export const HOVER_RADIUS = 150;
/** Số gợn sóng tối đa cùng lúc, để giữ hiệu năng khi rê chuột liên tục. */
export const MAX_RIPPLES = 24;
/** Rê chuột quá quãng này (px) thì phát một gợn sóng mới. */
export const RIPPLE_EMIT_DISTANCE = 70;

export interface Ripple {
  x: number;
  y: number;
  /** Tuổi (giây). */
  age: number;
  /** Độ mạnh: rê chuột nhỏ, bấm chuột lớn. */
  strength: number;
}

export function createRipple(x: number, y: number, strength: number): Ripple {
  return { x, y, age: 0, strength };
}

/** Tăng tuổi các gợn sóng và bỏ gợn đã tắt. Sửa tại chỗ để không cấp phát mỗi khung hình. */
export function stepRipples(ripples: Ripple[], dtSeconds: number): void {
  let kept = 0;
  for (const ripple of ripples) {
    ripple.age += dtSeconds;
    if (ripple.age >= RIPPLE_LIFE) continue;
    ripples[kept] = ripple;
    kept++;
  }
  ripples.length = kept;
}

/** Năng lượng của một gợn sóng tại khoảng cách cho trước: dải sáng quanh mặt sóng, mờ dần theo tuổi. */
export function rippleEnergy(distance: number, ripple: Ripple): number {
  const radius = ripple.age * RIPPLE_SPEED;
  const band = (distance - radius) / RIPPLE_WIDTH;
  if (band > 3 || band < -3) return 0;
  const fade = 1 - ripple.age / RIPPLE_LIFE;
  return ripple.strength * Math.exp(-band * band) * fade * fade;
}

/** Năng lượng quanh con trỏ: 1 ngay dưới con trỏ, giảm mềm về 0 ở mép vùng ảnh hưởng. */
export function hoverEnergy(distance: number): number {
  if (distance >= HOVER_RADIUS) return 0;
  const t = 1 - distance / HOVER_RADIUS;
  return t * t * (3 - 2 * t);
}

/**
 * Độ hiện của chấm theo vị trí: rõ ở giữa, mờ dần ra rìa theo hình elip (giống mask của lưới chấm tĩnh trước đây).
 * @param x, y Tỉ lệ vị trí 0..1 trong khung.
 */
export function dotBaseVisibility(x: number, y: number): number {
  const ex = (x - 0.5) / 0.7;
  const ey = (y - 0.45) / 0.6;
  const distance = Math.sqrt(ex * ex + ey * ey);
  const t = Math.min(1, Math.max(0, 1 - distance / 0.75));
  return t * t * (3 - 2 * t);
}
