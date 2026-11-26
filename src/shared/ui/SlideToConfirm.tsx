import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { ChevronsRight, Loader2 } from "lucide-react";
import "./slide-to-confirm.css";

/** Kéo tới quá ngưỡng này (so với quãng trượt tối đa) thì tính là đã xác nhận. */
const CONFIRM_RATIO = 0.9;

export interface SlideToConfirmProps {
  /** Chữ hiện trên thanh khi chờ người dùng kéo. */
  label: string;
  /** Tên đọc của nút kéo khi chờ (mô tả việc sẽ làm, không phải hướng dẫn kéo). */
  name: string;
  /** Chữ hiện khi đang xử lý; cũng là tên đọc của nút kéo lúc đó. */
  busyLabel: string;
  disabled?: boolean;
  /** Đang gửi yêu cầu: thanh khóa ở cuối đường, trở về đầu khi xong mà chưa thành công. */
  busy?: boolean;
  onConfirm: () => void;
}

/**
 * Thanh kéo để xác nhận một việc có hậu quả (thanh toán): kéo nút tròn sang hết đường mới gửi, thả sớm thì nút về chỗ
 * cũ. Người dùng bàn phím hoặc trình đọc màn hình dùng chính nút kéo: Enter hoặc Space xác nhận ngay, không cần kéo.
 */
export function SlideToConfirm({
  label,
  name,
  busyLabel,
  disabled = false,
  busy = false,
  onConfirm,
}: SlideToConfirmProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLButtonElement>(null);
  const grab = useRef(0);
  /** Vị trí nút kéo từ 0 (đầu đường) tới 1 (cuối đường). */
  const [ratio, setRatio] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [wasBusy, setWasBusy] = useState(busy);
  if (busy !== wasBusy) {
    setWasBusy(busy);
    if (!busy && confirmed) {
      // Gửi xong mà vẫn ở lại đây (lỗi): trả nút về đầu để người dùng thử lại.
      setConfirmed(false);
      setRatio(0);
    }
  }

  function maxTravel(): number {
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (track === null || thumb === null) {
      return 0;
    }
    return Math.max(0, track.clientWidth - thumb.offsetWidth - 8);
  }

  function confirm() {
    if (disabled || busy || confirmed) {
      return;
    }
    setConfirmed(true);
    setRatio(1);
    onConfirm();
  }

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (disabled || busy || confirmed) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    grab.current = event.clientX - ratio * maxTravel();
    setDragging(true);
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!dragging) {
      return;
    }
    const travel = maxTravel();
    if (travel <= 0) {
      return;
    }
    setRatio(Math.min(Math.max(0, (event.clientX - grab.current) / travel), 1));
  }

  function onPointerUp() {
    if (!dragging) {
      return;
    }
    setDragging(false);
    if (ratio >= CONFIRM_RATIO) {
      confirm();
    } else {
      setRatio(0);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      confirm();
    }
  }

  const working = busy || confirmed;
  return (
    <div
      ref={trackRef}
      className="slide-confirm"
      data-working={working}
      data-disabled={disabled}
      data-dragging={dragging}
      style={{ "--slide-p": ratio } as CSSProperties}
    >
      <span aria-hidden="true" className="slide-confirm-fill" />
      <span aria-hidden="true" className="slide-confirm-text" style={{ opacity: 1 - ratio }}>
        {working ? busyLabel : label}
      </span>
      <button
        ref={thumbRef}
        type="button"
        className="slide-confirm-thumb"
        aria-label={working ? busyLabel : name}
        disabled={disabled}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        onClick={(event) => {
          // Bấm bằng bàn phím hoặc công nghệ hỗ trợ không có tọa độ chuột; bấm chuột thật phải kéo mới tính.
          if (event.detail === 0) {
            confirm();
          }
        }}
      >
        {working ? (
          <Loader2 aria-hidden="true" className="slide-confirm-spin" />
        ) : (
          <ChevronsRight aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
