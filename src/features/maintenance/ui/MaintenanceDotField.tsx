import { useEffect, useRef } from "react";
import {
  createRipple,
  DOT_SPACING,
  dotBaseVisibility,
  HOVER_RADIUS,
  hoverEnergy,
  MAX_RIPPLES,
  RIPPLE_EMIT_DISTANCE,
  rippleEnergy,
  stepRipples,
  type Ripple,
} from "../lib/dotField";

/** Độ dạt tối đa (px) của chấm khi bị sóng hoặc con trỏ đẩy. */
const RIPPLE_PUSH = 7;
const HOVER_PUSH = 5;
/** Độ mạnh gợn sóng khi rê chuột và khi bấm chuột. */
const MOVE_RIPPLE_STRENGTH = 0.55;
const CLICK_RIPPLE_STRENGTH = 1.25;

interface Dot {
  x: number;
  y: number;
  /** Độ hiện theo vị trí (rõ ở giữa, mờ ra rìa). */
  base: number;
}

/**
 * Lưới chấm nền dạng mặt nước: rê chuột thì lan gợn sóng, bấm chuột thì gợn lớn hơn; chấm trên mặt sóng dạt ra,
 * to và sáng lên ngả vàng rồi lắng xuống. Chỉ để nhìn (aria-hidden, không nhận chuột: nghe sự kiện trên window).
 *
 * Hiệu năng: một canvas cho cả lưới; vòng lặp chỉ chạy khi còn sóng hoặc con trỏ vừa di chuyển, đứng yên thì
 * không vẽ lại; số gợn sóng có trần. Giảm chuyển động: chỉ vẽ lưới tĩnh, không tương tác.
 */
export function MaintenanceDotField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    // Môi trường không có ResizeObserver (ví dụ jsdom khi test) thì bỏ qua lớp trang trí này.
    if (!canvas || typeof ResizeObserver === "undefined") return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let dots: Dot[] = [];
    let width = 0;
    let height = 0;
    const ripples: Ripple[] = [];
    const pointer = { x: 0, y: 0, inside: false };
    const lastEmit = { x: Number.NaN, y: Number.NaN };
    let frame = 0;
    let running = false;
    let last = 0;

    /** Dựng lại lưới theo kích thước khung (lần đầu và khi đổi cỡ cửa sổ). */
    const layout = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      dots = [];
      for (let y = DOT_SPACING / 2; y < height; y += DOT_SPACING) {
        for (let x = DOT_SPACING / 2; x < width; x += DOT_SPACING) {
          dots.push({ x, y, base: dotBaseVisibility(x / width, y / height) });
        }
      }
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      for (const dot of dots) {
        let energy = 0;
        let pushX = 0;
        let pushY = 0;

        for (const ripple of ripples) {
          const dx = dot.x - ripple.x;
          const dy = dot.y - ripple.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const amount = rippleEnergy(distance, ripple);
          if (amount <= 0) continue;
          energy += amount;
          pushX += (dx / distance) * amount * RIPPLE_PUSH;
          pushY += (dy / distance) * amount * RIPPLE_PUSH;
        }

        if (pointer.inside) {
          const dx = dot.x - pointer.x;
          const dy = dot.y - pointer.y;
          if (dx < HOVER_RADIUS && dx > -HOVER_RADIUS && dy < HOVER_RADIUS && dy > -HOVER_RADIUS) {
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const amount = hoverEnergy(distance);
            energy += amount * 0.45;
            pushX += (dx / distance) * amount * HOVER_PUSH;
            pushY += (dy / distance) * amount * HOVER_PUSH;
          }
        }

        if (energy > 1) energy = 1;
        // Chấm ở rìa vẫn hiện ra một chút khi có sóng đi qua, để tương tác thấy được trên cả màn hình.
        const alpha = 0.13 * dot.base + energy * 0.7 * (0.35 + 0.65 * dot.base);
        if (alpha < 0.01) continue;
        const radius = 1 + energy * 1.3;
        // Chấm thường màu kem; chấm đang có năng lượng ngả sang vàng.
        context.fillStyle = energy > 0.12 ? "#E0C486" : "#EFECE3";
        context.globalAlpha = alpha;
        context.beginPath();
        context.arc(dot.x + pushX, dot.y + pushY, radius, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
    };

    const tick = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      stepRipples(ripples, dt);
      draw();
      if (ripples.length === 0) {
        // Hết sóng: dừng vòng lặp, khung cuối (có vùng quanh con trỏ) giữ nguyên tới lần di chuột sau.
        running = false;
        last = 0;
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(tick);
    };

    const addRipple = (x: number, y: number, strength: number) => {
      if (ripples.length >= MAX_RIPPLES) ripples.shift();
      ripples.push(createRipple(x, y, strength));
    };

    const toLocal = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const onPointerMove = (event: PointerEvent) => {
      const point = toLocal(event);
      pointer.x = point.x;
      pointer.y = point.y;
      pointer.inside = true;
      const moved = Math.hypot(point.x - lastEmit.x, point.y - lastEmit.y);
      if (!(moved < RIPPLE_EMIT_DISTANCE)) {
        lastEmit.x = point.x;
        lastEmit.y = point.y;
        addRipple(point.x, point.y, MOVE_RIPPLE_STRENGTH);
      }
      wake();
      if (!running) draw();
    };

    const onPointerDown = (event: PointerEvent) => {
      const point = toLocal(event);
      addRipple(point.x, point.y, CLICK_RIPPLE_STRENGTH);
      wake();
    };

    const onPointerLeave = () => {
      pointer.inside = false;
      lastEmit.x = Number.NaN;
      if (!running) draw();
    };

    const resizeObserver = new ResizeObserver(() => {
      layout();
      draw();
    });
    resizeObserver.observe(canvas);
    layout();
    draw();

    if (!reducedMotion) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerdown", onPointerDown, { passive: true });
      document.documentElement.addEventListener("pointerleave", onPointerLeave);
    }

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />;
}
