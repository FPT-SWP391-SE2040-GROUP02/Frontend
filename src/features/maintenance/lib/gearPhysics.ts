/**
 * Vật lý đơn giản cho bánh răng tương tác trên màn hình bảo trì: quay đều, bấm thì tăng tốc rồi chậm dần,
 * bấm dồn dập thì "nóng" lên và tóe tia lửa ở chỗ hai bánh ăn khớp. Hàm thuần, không đụng DOM, để test được.
 */

/** Tốc độ nền của bánh lớn (độ/giây): một vòng 24 giây. */
export const GEAR_BASE_SPEED = 15;
/** Mỗi lần bấm cộng thêm tốc độ (độ/giây). */
export const GEAR_CLICK_IMPULSE = 140;
/** Trần tốc độ để bánh răng không quay loạn mắt. */
export const GEAR_MAX_SPEED = 1080;
/** Tốc độ trở về tốc độ nền (1/giây): càng lớn càng chậm lại nhanh. */
export const GEAR_SPEED_DECAY = 1.4;
/** Nhiệt mất đi theo thời gian (1/giây). */
export const GEAR_HEAT_DECAY = 1.2;
/** Từ mức nhiệt này trở lên thì bắt đầu tóe lửa (khoảng 3 lần bấm liên tiếp). */
export const SPARK_HEAT_THRESHOLD = 2.4;
/** Bánh lớn 12 răng, bánh nhỏ 9 răng: bánh nhỏ quay nhanh hơn 12/9 lần và ngược chiều. */
export const SMALL_GEAR_RATIO = 12 / 9;

export interface GearState {
  /** Góc bánh lớn (độ), tăng dần theo chiều kim đồng hồ. */
  angle: number;
  /** Tốc độ hiện tại của bánh lớn (độ/giây). */
  speed: number;
  /** Mức "nóng" do bấm dồn dập; tự nguội theo thời gian. */
  heat: number;
  /** Phần lẻ số tia lửa chưa phát, cộng dồn qua các khung hình. */
  sparkDebt: number;
}

export function createGearState(): GearState {
  return { angle: 0, speed: GEAR_BASE_SPEED, heat: 0, sparkDebt: 0 };
}

/** Một lần bấm: tăng tốc (có trần) và tăng nhiệt. */
export function applyGearClick(state: GearState): GearState {
  return {
    ...state,
    speed: Math.min(GEAR_MAX_SPEED, state.speed + GEAR_CLICK_IMPULSE),
    heat: state.heat + 1,
  };
}

/** Tiến một khung hình: quay theo tốc độ, tốc độ trôi dần về tốc độ nền, nhiệt nguội dần. */
export function stepGear(state: GearState, dtSeconds: number, baseSpeed: number): GearState {
  const speed = baseSpeed + (state.speed - baseSpeed) * Math.exp(-GEAR_SPEED_DECAY * dtSeconds);
  return {
    angle: (state.angle + speed * dtSeconds) % 360,
    speed,
    heat: state.heat * Math.exp(-GEAR_HEAT_DECAY * dtSeconds),
    sparkDebt: state.sparkDebt,
  };
}

/** Số tia lửa đang bay tối đa, để giữ hiệu năng khi bấm liên tục rất lâu. */
export const MAX_SPARKS = 160;

/**
 * Cường độ tóe lửa 0..1 theo độ nóng, tăng và giảm theo đường cong mềm (smoothstep) quanh ngưỡng,
 * để lửa bùng lên rồi lụi dần chứ không bật tắt đột ngột.
 */
export function sparkIntensity(heat: number): number {
  const start = SPARK_HEAT_THRESHOLD - 0.6;
  const full = SPARK_HEAT_THRESHOLD + 1.6;
  const t = Math.min(1, Math.max(0, (heat - start) / (full - start)));
  return t * t * (3 - 2 * t);
}

/**
 * Số tia lửa cần phát trong khung hình này: chỉ khi đủ nóng; càng nóng và quay càng nhanh thì càng nhiều.
 * @returns [số tia lửa, trạng thái đã cập nhật phần lẻ còn nợ]
 */
export function takeSparkCount(state: GearState, dtSeconds: number): [number, GearState] {
  const intensity = sparkIntensity(state.heat);
  if (intensity <= 0) return [0, { ...state, sparkDebt: 0 }];
  const speedFactor = Math.min(1, state.speed / GEAR_MAX_SPEED);
  const perSecond = intensity * (36 + 84 * speedFactor);
  const total = state.sparkDebt + perSecond * dtSeconds;
  const count = Math.floor(total);
  return [count, { ...state, sparkDebt: total - count }];
}

export interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Thời gian còn lại (giây). */
  life: number;
  maxLife: number;
  width: number;
  /** Sắc độ màu: 28 cam đậm → 50 vàng sáng. */
  hue: number;
}

/**
 * Tạo một tia lửa ở điểm ăn khớp, bay theo hướng tiếp tuyến (cộng lệch ngẫu nhiên).
 * @param origin Điểm phát (px trong canvas).
 * @param direction Vector đơn vị hướng tiếp tuyến tại điểm ăn khớp.
 * @param scale Độ lớn khung (px) để tốc độ tia lửa tỉ lệ với kích thước hiển thị.
 * @param random Nguồn ngẫu nhiên [0, 1), truyền vào để test cố định được.
 */
export function createSpark(
  origin: { x: number; y: number },
  direction: { x: number; y: number },
  scale: number,
  random: () => number,
): Spark {
  const spread = (random() - 0.5) * 1.1;
  const cos = Math.cos(spread);
  const sin = Math.sin(spread);
  const dirX = direction.x * cos - direction.y * sin;
  const dirY = direction.x * sin + direction.y * cos;
  // Chậm và sống lâu hơn để tia lửa bay lả lướt, không giật.
  const velocity = scale * (0.55 + random() * 0.95);
  const life = 0.5 + random() * 0.6;
  return {
    x: origin.x,
    y: origin.y,
    vx: dirX * velocity,
    vy: dirY * velocity,
    life,
    maxLife: life,
    width: 0.6 + random() * 0.9,
    hue: 30 + random() * 18,
  };
}

/** Tiến các tia lửa một khung hình (có trọng lực và lực cản), bỏ tia đã tắt. Sửa tại chỗ để không cấp phát mỗi khung. */
export function advanceSparks(sparks: Spark[], dtSeconds: number, gravity: number): void {
  let kept = 0;
  const drag = Math.exp(-2.4 * dtSeconds);
  for (const spark of sparks) {
    spark.life -= dtSeconds;
    if (spark.life <= 0) continue;
    spark.vx *= drag;
    spark.vy = spark.vy * drag + gravity * dtSeconds;
    spark.x += spark.vx * dtSeconds;
    spark.y += spark.vy * dtSeconds;
    sparks[kept] = spark;
    kept++;
  }
  sparks.length = kept;
}
