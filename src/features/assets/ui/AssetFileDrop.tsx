// Lucian UX/UI Prompt #032 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#032
import { useRef, useState, type CSSProperties, type DragEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import { formatStorageSize } from "@/shared/lib/formatStorageSize";
import "./asset-file-drop.css";

/** Màu ô đuôi tệp theo mẫu gốc (thêm doc, docx); đuôi lạ dùng màu xám. */
const TYPE_COLORS: Record<string, string> = {
  pdf: "#E5484D",
  png: "#3D8BFF",
  jpg: "#22A06B",
  jpeg: "#22A06B",
  fig: "#8B6CFF",
  doc: "#2B63D9",
  docx: "#2B63D9",
};

/**
 * picked: đã chọn, chưa gửi · invalid: tệp không hợp lệ · sending: đang gửi byte · saving: gửi xong, chờ máy chủ mã hóa
 * và lưu · done: máy chủ báo thành công · fail: gửi hoặc lưu lỗi.
 */
type Phase = "picked" | "invalid" | "sending" | "saving" | "done" | "fail";

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot < 0 || dot === fileName.length - 1) return "";
  return fileName.slice(dot + 1).toLowerCase();
}

export interface AssetFileDropProps {
  file: File | null;
  /** Đổi khóa để ô chọn tệp được dựng lại và quên tệp đã chọn. */
  inputKey: number;
  invalid: boolean;
  uploading: boolean;
  /** Phần trăm byte đã gửi (0–100); null khi trình duyệt chưa báo. */
  percent: number | null;
  /** Máy chủ đã trả lời thành công. */
  done: boolean;
  /** Lần gửi vừa rồi lỗi (thông báo chi tiết do form hiện). */
  failed: boolean;
  maxBytes: number;
  onPick: (file: File | null) => void;
  onRemove: () => void;
}

/**
 * Ô tệp của form thêm tài sản. Chưa chọn thì hiện vùng kéo thả viền nét đứt; chọn một tệp thì ẩn vùng đó, chỉ còn dòng
 * tệp với thanh tiến độ riêng: đang gửi, đang mã hóa trên máy chủ, vẽ dấu tích khi xong, hoặc nút Thử lại khi lỗi.
 * Tệp chỉ được gửi khi người dùng bấm Lưu tài sản (Thử lại cũng gửi lại form).
 */
export function AssetFileDrop({
  file,
  inputKey,
  invalid,
  uploading,
  percent,
  done,
  failed,
  maxBytes,
  onPick,
  onRemove,
}: AssetFileDropProps) {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const enter = (event: DragEvent<HTMLElement>) => {
    // Chặn trình duyệt tự mở tệp khi thả vào trang.
    event.preventDefault();
    if (!uploading) setOver(true);
  };
  const leave = (event: DragEvent<HTMLElement>) => {
    // Rê qua phần tử con cũng phát dragleave: chỉ tắt khi con trỏ ra khỏi cả vùng.
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) return;
    setOver(false);
  };
  const drop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setOver(false);
    const dropped = event.dataTransfer.files[0];
    if (!uploading && dropped) onPick(dropped);
  };

  let row: ReactNode = null;
  if (file) {
    let sent = 0;
    if (percent !== null) sent = percent;
    let phase: Phase = "picked";
    if (failed) phase = "fail";
    if (invalid) phase = "invalid";
    if (uploading) {
      phase = "sending";
      if (sent >= 100) phase = "saving";
      if (done) phase = "done";
    }

    const size = formatStorageSize(file.size);
    let detail = `${size} · Bấm Lưu tài sản để tải lên`;
    if (phase === "invalid") detail = "Tệp chưa hợp lệ";
    if (phase === "sending") {
      const sentBytes = Math.round((file.size * sent) / 100);
      detail = `${formatStorageSize(sentBytes)} / ${size} · ${sent}%`;
    }
    if (phase === "saving") detail = "Đang mã hóa và lưu trên máy chủ…";
    if (phase === "done") detail = `${size} · Đã lưu`;
    if (phase === "fail") {
      detail = "Chưa lưu được";
      if (sent < 100) detail = `Chưa lưu được · dừng ở ${sent}%`;
    }

    // Phần thanh đã đầy: theo byte đã gửi; xong thì đầy.
    let progress = 0;
    if (phase === "sending" || phase === "fail") progress = sent / 100;
    if (phase === "saving" || phase === "done") progress = 1;

    let valueNow: number | undefined;
    if (phase === "sending") valueNow = sent;
    if (phase === "done") valueNow = 100;
    let barRole: "progressbar" | undefined;
    if (uploading) barRole = "progressbar";

    const extension = extensionOf(file.name);
    let color = TYPE_COLORS[extension];
    if (!color) color = "#8E8A97";
    let tag = extension.slice(0, 3).toUpperCase();
    if (!tag) tag = "FILE";

    row = (
      <li
        className="u032-row"
        data-phase={phase}
        style={{ "--p": progress, "--c": color } as CSSProperties}
      >
        <span className="u032-ic" aria-hidden="true">
          {tag}
        </span>
        <span className="u032-meta">
          <b>{file.name}</b>
          <small>{detail}</small>
        </span>
        {(phase === "sending" || phase === "saving") && (
          <span className="u032-st">
            <span className="u032-spin" aria-hidden="true" />
          </span>
        )}
        {phase === "done" && (
          <span className="u032-st">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3.5 8.4l3 3 6-6.4" />
            </svg>
          </span>
        )}
        {phase === "fail" && (
          // Nút gửi của chính form: gửi lại đúng tệp đang chọn.
          <button type="submit" className="u032-retry">
            Thử lại
          </button>
        )}
        {!uploading && (
          <button
            type="button"
            className="u032-x"
            aria-label={`Bỏ tệp ${file.name}`}
            onClick={onRemove}
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        )}
        <span
          className="u032-bar"
          role={barRole}
          aria-label={barRole && "Tiến trình tải tệp"}
          aria-valuemin={barRole && 0}
          aria-valuemax={barRole && 100}
          aria-valuenow={barRole && valueNow}
          aria-hidden={barRole === undefined || undefined}
        />
      </li>
    );
  }

  return (
    <div className="u032" data-over={over || undefined}>
      {!file && (
        <button
          type="button"
          className="u032-zone"
          onClick={() => input.current?.click()}
          onDragEnter={enter}
          onDragOver={enter}
          onDragLeave={leave}
          onDrop={drop}
        >
          <svg className="u032-dash" aria-hidden="true">
            <rect width="100%" height="100%" rx="25" />
          </svg>
          <span className="u032-orb" aria-hidden="true">
            <svg viewBox="0 0 28 28">
              <path d="M8.5 20.5H7a5 5 0 0 1-.6-10 7 7 0 0 1 13.4-1.6A5.5 5.5 0 0 1 21 20.5h-1.5M14 13v10M10.5 16.5L14 13l3.5 3.5" />
            </svg>
          </span>
          <b>
            Kéo thả tệp vào đây hoặc <em>chọn tệp</em>
          </b>
          <small>{`Một tệp · tối đa ${formatStorageSize(maxBytes)}`}</small>
        </button>
      )}
      <input
        key={inputKey}
        ref={input}
        type="file"
        className="u032-file"
        tabIndex={-1}
        aria-label="Tệp tài sản"
        disabled={uploading}
        onChange={(event) => onPick(event.target.files?.[0] ?? null)}
      />
      <ul className="u032-list" aria-live="polite">
        {row}
      </ul>
    </div>
  );
}
