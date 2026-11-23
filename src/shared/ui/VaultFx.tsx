import type { CSSProperties, ReactNode } from "react";
import "./vault-fx.css";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const DIAL_TICKS = 28;
const DIAL_SWEEP_DEGREES = 270;
const METER_SLOTS = 50;

/** Biến CSS tùy chỉnh không có trong kiểu CSSProperties; gom một chỗ để khỏi ép kiểu rải rác. */
function cssVars(vars: Record<string, string | number>): CSSProperties {
  return vars as CSSProperties;
}

/**
 * Số cuộn như khóa số của két: mỗi chữ số là một cuộn 0 đến 9. Lần hiện đầu cuộn từ 0 tới giá trị; khi giá trị đổi
 * thì cuộn từ chữ số cũ sang chữ số mới. Trình đọc màn hình đọc đúng chuỗi `value`, phần cuộn chỉ để nhìn.
 * Ký tự không phải chữ số (dấu phẩy, gạch chéo) đứng yên.
 */
export function RollingNumber({ value, small = false }: { value: string; small?: boolean }) {
  const parts: ReactNode[] = [];
  let order = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value.charAt(index);
    if (char >= "0" && char <= "9") {
      parts.push(
        <span key={index} className="rn-digit" aria-hidden="true">
          <span className="rn-reel" style={cssVars({ "--v": Number(char), "--i": order })}>
            {DIGITS.map((digit) => (
              <b key={digit} data-d={digit} />
            ))}
          </span>
        </span>,
      );
      order += 1;
    } else {
      parts.push(
        <span key={index} className="rn-sep" aria-hidden="true">
          {char}
        </span>,
      );
    }
  }
  return (
    <span className={small ? "rn rn--sm" : "rn"}>
      <span className="sr-only">{value}</span>
      {parts}
    </span>
  );
}

/**
 * Đồng hồ quay số két: vạch sáng dần theo tỉ lệ `fraction` (0 đến 1), kim quay tới vị trí tương ứng. `complete`
 * đổi vạch sáng sang màu xanh khi đã hoàn tất. Chỉ trang trí nên ẩn khỏi trình đọc màn hình; số liệu có chữ riêng.
 */
export function VaultDial({ fraction, complete }: { fraction: number; complete: boolean }) {
  const clamped = Math.min(1, Math.max(0, fraction));
  const lit = Math.round(clamped * DIAL_TICKS);
  const half = DIAL_SWEEP_DEGREES / 2;
  const ticks: ReactNode[] = [];
  for (let k = 0; k < DIAL_TICKS; k += 1) {
    const angle = -half + (k * DIAL_SWEEP_DEGREES) / (DIAL_TICKS - 1);
    ticks.push(
      <line
        key={k}
        className={k < lit ? "vd-tk vd-on" : "vd-tk"}
        x1="24"
        y1="3.5"
        x2="24"
        y2="8.5"
        transform={`rotate(${angle.toFixed(2)} 24 24)`}
        style={cssVars({ "--k": k })}
      />,
    );
  }
  return (
    <svg
      className={complete ? "vd vd--done" : "vd"}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      {ticks}
      <g
        className="vd-nd"
        style={cssVars({ "--a": `${(-half + clamped * DIAL_SWEEP_DEGREES).toFixed(2)}deg` })}
      >
        <line x1="24" y1="24" x2="24" y2="13" />
      </g>
      <circle className="vd-kn" cx="24" cy="24" r="2.6" />
    </svg>
  );
}

/**
 * Thanh dung lượng dạng ngăn két: 50 ngăn, ngăn đã dùng sáng dần từng ngăn, ngăn cuối màu vàng. Có dữ liệu thì luôn
 * sáng ít nhất một ngăn để không trông như kho trống.
 */
export function VaultMeter({
  usedBytes,
  quotaBytes,
  label,
}: {
  usedBytes: number;
  quotaBytes: number;
  label: string;
}) {
  const used = Math.max(0, usedBytes);
  const quota = Math.max(1, quotaBytes);
  const percent = Math.min(100, Math.round((used / quota) * 100));
  let lit = 0;
  if (used > 0) {
    lit = Math.max(1, Math.round(Math.min(1, used / quota) * METER_SLOTS));
  }
  const slots: ReactNode[] = [];
  for (let k = 0; k < METER_SLOTS; k += 1) {
    let className = "";
    if (k < lit) {
      className = "vm-on";
    }
    if (k === lit - 1) {
      className = "vm-on vm-tip";
    }
    slots.push(<i key={k} className={className} style={cssVars({ "--k": k })} />);
  }
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="vm mt-3"
    >
      {slots}
    </div>
  );
}
