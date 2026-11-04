/*
 * Hai bánh răng ăn khớp, tương tác được: tự quay chậm, bấm thì tăng tốc rồi chậm dần, bấm dồn dập thì tóe tia lửa
 * ở chỗ ăn khớp như bị ma sát.
 *
 * Hiệu năng:
 * - Góc quay tính trong requestAnimationFrame và chỉ gán transform cho 4 khối HTML (mặt và bóng của mỗi bánh),
 *   trình duyệt xử lý trên GPU, React không render lại theo từng khung hình.
 * - Bánh nhỏ khóa theo tỉ lệ răng 12:9 nên luôn ăn khớp.
 * - Tia lửa vẽ trên một canvas nhỏ, chỉ vẽ khi đang có tia lửa; canvas chỉ được lấy context khi cần lần đầu.
 * - Ánh sáng giả định từ trên trái: bóng đổ là bản sao dịch xuống dưới phải, hướng bóng không xoay theo bánh.
 */

import { useEffect, useId, useRef, type Ref } from "react";
import {
  advanceSparks,
  applyGearClick,
  createGearState,
  createSpark,
  GEAR_BASE_SPEED,
  MAX_SPARKS,
  SMALL_GEAR_RATIO,
  sparkIntensity,
  stepGear,
  takeSparkCount,
  type GearState,
  type Spark,
} from "../lib/gearPhysics";

const LARGE_GEAR =
  "169.3,100.0 185.7,103.3 185.7,116.7 169.3,120.0 165.0,135.9 177.6,147.0 170.9,158.7 155.0,153.3 143.3,165.0 148.7,180.9 137.0,187.6 125.9,175.0 110.0,179.3 106.7,195.7 93.3,195.7 90.0,179.3 74.1,175.0 63.0,187.6 51.3,180.9 56.7,165.0 45.0,153.3 29.1,158.7 22.4,147.0 35.0,135.9 30.7,120.0 14.3,116.7 14.3,103.3 30.7,100.0 35.0,84.1 22.4,73.0 29.1,61.3 45.0,66.7 56.7,55.0 51.3,39.1 63.0,32.4 74.1,45.0 90.0,40.7 93.3,24.3 106.7,24.3 110.0,40.7 125.9,45.0 137.0,32.4 148.7,39.1 143.3,55.0 155.0,66.7 170.9,61.3 177.6,73.0 165.0,84.1";

const SMALL_GEAR =
  "251.3,162.7 263.7,164.8 263.7,175.2 251.3,177.3 247.2,188.4 255.5,198.0 248.7,206.0 237.9,199.5 227.6,205.5 227.8,218.1 217.5,219.9 213.3,208.0 201.6,205.9 193.7,215.7 184.6,210.5 189.1,198.7 181.4,189.6 169.1,191.9 165.5,182.1 176.5,175.9 176.5,164.1 165.5,157.9 169.1,148.1 181.4,150.4 189.1,141.3 184.6,129.5 193.7,124.3 201.6,134.1 213.3,132.0 217.5,120.1 227.8,121.9 227.6,134.5 237.9,140.5 248.7,134.0 255.5,142.0 247.2,151.6";

/** Màu mặt bánh răng: vàng đồng trầm, để màu vàng sáng dành cho nhãn, thanh tiến trình và nút. */
const GEAR_FACE = "#B99E6A";
const GEAR_SHADOW = "#05140F";

/** Canvas tia lửa tràn ra ngoài khung bánh răng 40% mỗi phía (tổng 180%) để tia lửa bay xa không bị cắt. */
const CANVAS_OVERFLOW = 0.4;
const CANVAS_SPAN = 1 + CANVAS_OVERFLOW * 2;
/** Điểm ăn khớp của hai bánh, tính theo khung 280x240: (172, 148). */
const CONTACT = { x: 172 / 280, y: 148 / 240 };
/** Hướng tiếp tuyến tại điểm ăn khớp khi bánh lớn quay thuận chiều kim đồng hồ (xuống dưới, lệch trái). */
const SPARK_DIRECTION = { x: -0.466, y: 0.885 };

interface GearProps {
  points: string;
  /** viewBox bao quanh bánh răng: "x y kích-thước kích-thước". */
  viewBox: string;
  center: { x: number; y: number; hole: number };
  maskId: string;
  fill: string;
  spinRef: Ref<HTMLSpanElement>;
}

/** Một bánh răng có lỗ giữa trong suốt (khoét bằng mask); khối spinRef được xoay từ vòng lặp hoạt ảnh. */
function Gear({ points, viewBox, center, maskId, fill, spinRef }: GearProps) {
  const [x, y, size] = viewBox.split(" ");
  return (
    <span ref={spinRef} className="maintenance-gear-spin block size-full">
      <svg viewBox={viewBox} className="block size-full" aria-hidden="true">
        <mask id={maskId}>
          <rect x={x} y={y} width={size} height={size} fill="#fff" />
          <circle cx={center.x} cy={center.y} r={center.hole} fill="#000" />
        </mask>
        <polygon points={points} fill={fill} mask={`url(#${maskId})`} />
      </svg>
    </span>
  );
}

/** Bán kính quầng sáng đầu tia (px) và ở điểm ma sát. */
const SPARK_GLOW_RADIUS = 7;
const CONTACT_GLOW_RADIUS = 22;

/**
 * Ảnh quầng sáng mềm dựng sẵn một lần (vàng ấm, mờ dần ra ngoài). Vẽ lại bằng drawImage rẻ hơn nhiều so với
 * tạo gradient cho từng tia lửa mỗi khung hình.
 */
function createGlowSprite(): HTMLCanvasElement | null {
  const sprite = document.createElement("canvas");
  sprite.width = 64;
  sprite.height = 64;
  const context = sprite.getContext("2d");
  if (!context) return null;
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255, 228, 170, 0.9)");
  gradient.addColorStop(0.35, "rgba(255, 180, 90, 0.35)");
  gradient.addColorStop(1, "rgba(255, 140, 50, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  return sprite;
}

/** Tắt dần theo đường cong mềm: sáng lâu ở đầu đời, lụi êm ở cuối thay vì giảm đều. */
function fade(lifeRatio: number): number {
  return lifeRatio * lifeRatio * (3 - 2 * lifeRatio);
}

/** Vẽ lại canvas tia lửa: vệt mảnh theo hướng bay, quầng sáng mềm ở đầu tia và ở điểm ma sát. */
function drawSparks(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  glowSprite: HTMLCanvasElement | null,
  sparks: Spark[],
  origin: { x: number; y: number },
  intensity: number,
) {
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  const ratio = canvas.width / canvas.clientWidth;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.globalCompositeOperation = "lighter";

  if (glowSprite && intensity > 0) {
    context.globalAlpha = 0.55 * intensity;
    context.drawImage(
      glowSprite,
      origin.x - CONTACT_GLOW_RADIUS,
      origin.y - CONTACT_GLOW_RADIUS,
      CONTACT_GLOW_RADIUS * 2,
      CONTACT_GLOW_RADIUS * 2,
    );
  }

  context.lineCap = "round";
  for (const spark of sparks) {
    const alpha = fade(spark.life / spark.maxLife);
    // Mới tóe: vàng gần trắng; nguội dần: cam rồi tắt.
    context.globalAlpha = alpha * 0.85;
    context.strokeStyle = `hsl(${spark.hue}, 100%, ${50 + 22 * alpha}%)`;
    context.lineWidth = spark.width;
    context.beginPath();
    context.moveTo(spark.x, spark.y);
    context.lineTo(spark.x - spark.vx * 0.035, spark.y - spark.vy * 0.035);
    context.stroke();

    if (glowSprite) {
      const radius = SPARK_GLOW_RADIUS * (0.5 + 0.5 * alpha);
      context.globalAlpha = alpha * 0.45;
      context.drawImage(glowSprite, spark.x - radius, spark.y - radius, radius * 2, radius * 2);
    }
  }
  context.globalAlpha = 1;
}

/** Bánh răng tương tác. `label` là tên đọc cho trình đọc màn hình của nút bấm. */
export function MaintenanceGears({ label, className = "" }: { label: string; className?: string }) {
  // id mask phải duy nhất trong trang; useId có dấu ":" nên bỏ đi để dùng trong url(#...).
  const id = `maintenance-gear-${useId().replace(/:/g, "")}`;
  const largeFace = useRef<HTMLSpanElement>(null);
  const largeShadow = useRef<HTMLSpanElement>(null);
  const smallFace = useRef<HTMLSpanElement>(null);
  const smallShadow = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GearState>(createGearState());

  useEffect(() => {
    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sparks: Spark[] = [];
    // undefined: chưa lấy context; chỉ lấy (và dựng ảnh quầng sáng) khi có tia lửa đầu tiên.
    let context: CanvasRenderingContext2D | null | undefined;
    let glowSprite: HTMLCanvasElement | null = null;
    let canvasDirty = false;
    let last = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      let state = stepGear(stateRef.current, dt, reducedMotion ? 0 : GEAR_BASE_SPEED);

      const large = `rotate(${state.angle}deg)`;
      const small = `rotate(${-state.angle * SMALL_GEAR_RATIO}deg)`;
      if (largeFace.current) largeFace.current.style.transform = large;
      if (largeShadow.current) largeShadow.current.style.transform = large;
      if (smallFace.current) smallFace.current.style.transform = small;
      if (smallShadow.current) smallShadow.current.style.transform = small;

      const canvas = canvasRef.current;
      if (!reducedMotion && canvas) {
        const [count, next] = takeSparkCount(state, dt);
        state = next;
        if (count > 0 || sparks.length > 0 || canvasDirty) {
          if (context === undefined) {
            context = canvas.getContext("2d");
            if (context) glowSprite = createGlowSprite();
          }
          if (context) {
            const ratio = window.devicePixelRatio || 1;
            const width = Math.round(canvas.clientWidth * ratio);
            const height = Math.round(canvas.clientHeight * ratio);
            if (canvas.width !== width || canvas.height !== height) {
              canvas.width = width;
              canvas.height = height;
            }
            const box = canvas.clientWidth / CANVAS_SPAN;
            const origin = {
              x: (CONTACT.x + CANVAS_OVERFLOW) * box,
              y: (CONTACT.y + CANVAS_OVERFLOW) * box * (240 / 280),
            };
            advanceSparks(sparks, dt, box * 1.9);
            for (let i = 0; i < count && sparks.length < MAX_SPARKS; i++) {
              const spark = createSpark(origin, SPARK_DIRECTION, box * 0.55, Math.random);
              // Rải thời điểm sinh trong khung hình để tia không vón thành từng cụm theo nhịp màn hình.
              const head = Math.random() * dt;
              spark.x += spark.vx * head;
              spark.y += spark.vy * head;
              spark.life -= head;
              sparks.push(spark);
            }
            const intensity = sparkIntensity(state.heat);
            drawSparks(context, canvas, glowSprite, sparks, origin, intensity);
            canvasDirty = sparks.length > 0 || intensity > 0;
          }
        }
      }

      stateRef.current = state;
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const large = {
    points: LARGE_GEAR,
    viewBox: "14 24 172 172",
    center: { x: 100, y: 110, hole: 30 },
  };
  const small = {
    points: SMALL_GEAR,
    viewBox: "164 120 100 100",
    center: { x: 214, y: 170, hole: 16 },
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        stateRef.current = applyGearClick(stateRef.current);
      }}
      className={`group relative block aspect-[280/240] w-[200px] cursor-pointer touch-manipulation select-none rounded-full outline-none transition-transform duration-150 focus-visible:outline-3 focus-visible:outline-offset-8 focus-visible:outline-[#B68F4C] active:scale-[0.98] sm:w-[280px] ${className}`}
    >
      {/* Ánh hắt rất nhẹ phía sau; rõ hơn một chút khi rê chuột để báo có thể bấm. */}
      <span className="maintenance-gear-glow absolute -inset-[25%] rounded-full opacity-70 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Bánh lớn: tâm (100,110), bán kính ngoài 86 → hộp 14..186 x 24..196. */}
      <span className="absolute left-[5%] top-[10%] h-[71.667%] w-[61.429%]">
        <span className="maintenance-gear-shadow absolute inset-0">
          <Gear {...large} maskId={`${id}-ls`} fill={GEAR_SHADOW} spinRef={largeShadow} />
        </span>
        <span className="absolute inset-0">
          <Gear {...large} maskId={`${id}-l`} fill={GEAR_FACE} spinRef={largeFace} />
        </span>
      </span>

      {/* Bánh nhỏ: tâm (214,170), bán kính ngoài 50 → hộp 164..264 x 120..220. */}
      <span className="absolute left-[58.571%] top-[50%] h-[41.667%] w-[35.714%]">
        <span className="maintenance-gear-shadow absolute inset-0">
          <Gear {...small} maskId={`${id}-ss`} fill={GEAR_SHADOW} spinRef={smallShadow} />
        </span>
        <span className="absolute inset-0">
          <Gear {...small} maskId={`${id}-s`} fill={GEAR_FACE} spinRef={smallFace} />
        </span>
      </span>

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-[-40%] top-[-40%] h-[180%] w-[180%]"
      />
    </button>
  );
}
