import { useEffect, useRef } from "react";
import guilloche from "@/shared/assets/auth-guilloche.svg";
import { MaintenanceDotField } from "./MaintenanceDotField";

/** Bán kính các vòm lồng nhau, lấy từ hình vòm trong logo LegacyVault. */
const ARCH_RADII = [250, 205, 160, 115, 70];

/** Độ lệch tối đa (px) của từng lớp khi chuột ở mép màn hình: lớp càng "xa" lệch càng ít. */
const PARALLAX = { arches: 16, guilloche: 10 };

/**
 * Lớp trang trí phía sau màn hình bảo trì, chỉ để nhìn (aria-hidden):
 * nền chuyển màu, hai đốm sáng trôi chậm, lưới chấm tương tác (gợn sóng theo chuột, xem MaintenanceDotField),
 * họa tiết vòm của logo, hoa văn quay chậm, đường chỉ vàng mép trên, viền tối quanh mép.
 * Vòm và hoa văn lệch nhẹ ngược hướng chuột tạo chiều sâu; vòng lặp chỉ chạy khi chuột di chuyển và tự dừng
 * khi đã tới vị trí, chỉ gán transform. Tắt khi người dùng chọn giảm chuyển động.
 */
export function MaintenanceBackdrop() {
  const rootRef = useRef<HTMLDivElement>(null);
  const archesRef = useRef<HTMLDivElement>(null);
  const guillocheRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const target = { nx: 0, ny: 0 };
    const current = { nx: 0, ny: 0 };
    let frame = 0;
    let running = false;
    let last = 0;

    const apply = () => {
      const layers: Array<[HTMLDivElement | null, number]> = [
        [archesRef.current, PARALLAX.arches],
        [guillocheRef.current, PARALLAX.guilloche],
      ];
      for (const [layer, depth] of layers) {
        if (layer)
          layer.style.transform = `translate3d(${-current.nx * depth}px, ${-current.ny * depth}px, 0)`;
      }
    };

    const tick = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const ease = 1 - Math.exp(-8 * dt);
      current.nx += (target.nx - current.nx) * ease;
      current.ny += (target.ny - current.ny) * ease;
      apply();
      const settled =
        Math.abs(target.nx - current.nx) < 0.002 && Math.abs(target.ny - current.ny) < 0.002;
      if (settled) {
        running = false;
        last = 0;
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    const onPointerMove = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      target.nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      target.ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      if (!running) {
        running = true;
        frame = requestAnimationFrame(tick);
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="maintenance-aurora maintenance-aurora-gold" />
      <div className="maintenance-aurora maintenance-aurora-teal" />

      <div
        ref={archesRef}
        className="maintenance-parallax absolute -bottom-[6%] -left-[8%] w-[min(78vw,760px)]"
      >
        <svg
          viewBox="0 0 600 560"
          className="block w-full opacity-[0.09]"
          fill="none"
          stroke="#E0C486"
          strokeWidth="1.5"
        >
          {ARCH_RADII.map((radius) => (
            <path
              key={radius}
              d={`M ${300 - radius} 560 L ${300 - radius} 300 A ${radius} ${radius} 0 0 1 ${300 + radius} 300 L ${300 + radius} 560`}
            />
          ))}
        </svg>
      </div>

      <div ref={guillocheRef} className="maintenance-parallax absolute -bottom-72 -right-72">
        <img
          src={guilloche}
          alt=""
          className="maintenance-guilloche block size-[820px] select-none opacity-[0.08]"
        />
      </div>

      <MaintenanceDotField />

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#E0C486]/60 to-transparent" />
      <div className="maintenance-vignette absolute inset-0" />
    </div>
  );
}
