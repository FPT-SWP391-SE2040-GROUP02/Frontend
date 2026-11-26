import { useEffect, useState, type DragEvent } from "react";
import { Check, Upload } from "lucide-react";
import { extensionLabel } from "../model/fileLabel";

/** Một đợt tệp vừa được thêm; `id` đổi thì hoạt ảnh chạy lại từ đầu. */
export interface Arrival {
  id: number;
  files: File[];
}

function carriesFiles(transfer: DataTransfer | null): boolean {
  return Boolean(transfer && Array.from(transfer.types).includes("Files"));
}

/** Thả trượt ra ngoài ô thì trình duyệt sẽ mở tệp và mất dữ liệu đang điền; chặn việc đó. */
function useBlockStrayFileDrop() {
  useEffect(() => {
    const block = (event: globalThis.DragEvent) => {
      if (event.defaultPrevented || !carriesFiles(event.dataTransfer)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "none";
    };
    window.addEventListener("dragover", block);
    window.addEventListener("drop", block);
    return () => {
      window.removeEventListener("dragover", block);
      window.removeEventListener("drop", block);
    };
  }, []);
}

function ArrivalOverlay({ arrival, onEnd }: { arrival: Arrival; onEnd: () => void }) {
  const first = arrival.files[0];
  let name = first.name;
  if (arrival.files.length > 1) name = `${arrival.files.length} tệp`;

  return (
    <div
      className="u432-up"
      aria-hidden="true"
      onAnimationEnd={(event) => {
        // Hoạt ảnh của phần tử con cũng nổi bọt lên đây; chỉ gỡ lớp phủ khi chính nó chạy xong.
        if (event.target === event.currentTarget) onEnd();
      }}
    >
      <div className="u432-stage">
        <svg className="u432-ring" viewBox="0 0 100 100" width="96" height="96">
          <circle className="u432-track" cx="50" cy="50" r="46" />
          <circle className="u432-progress" cx="50" cy="50" r="46" />
        </svg>
        <svg className="u432-doc" viewBox="0 0 50 62" width="42" height="52">
          <path
            className="u432-paper"
            d="M6 1h26l15 15v39a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6V7a6 6 0 0 1 6-6z"
          />
          <path className="u432-fold" d="M32 1v10a5 5 0 0 0 5 5h10z" />
          <rect className="u432-line" x="9" y="22" width="24" height="3" rx="1.5" />
          <rect className="u432-line" x="9" y="29" width="30" height="3" rx="1.5" />
          <rect className="u432-tag" x="-4" y="40" width="28" height="14" rx="3.5" />
          <text className="u432-tag-text" x="10" y="50" textAnchor="middle">
            {extensionLabel(first.name)}
          </text>
        </svg>
        <span className="u432-ok">
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      </div>
      <p className="u432-name">
        <span className="u432-name-before">{name}</span>
        <span className="u432-name-after">Đã chọn {name}</span>
      </p>
    </div>
  );
}

/**
 * Vùng bấm hoặc kéo thả tệp. Bàn phím đi qua ô input ẩn bên trong nhãn nên giữ nguyên cách dùng của trình duyệt.
 */
export function FileDropZone({
  inputId,
  inputLabel,
  accept,
  hasFiles,
  disabled,
  arrival,
  onArrivalEnd,
  onFiles,
}: {
  inputId: string;
  inputLabel: string;
  accept: string;
  hasFiles: boolean;
  disabled?: boolean;
  arrival: Arrival | null;
  onArrivalEnd: () => void;
  onFiles: (files: File[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  useBlockStrayFileDrop();

  const over = (event: DragEvent<HTMLLabelElement>) => {
    if (!carriesFiles(event.dataTransfer)) return;
    event.preventDefault();
    if (disabled) {
      event.dataTransfer.dropEffect = "none";
      return;
    }
    event.dataTransfer.dropEffect = "copy";
    setDragging(true);
  };

  let title = "Chọn tệp giấy tờ hoặc kéo thả vào đây";
  if (hasFiles) title = "Chọn thêm tệp hoặc kéo thả vào đây";
  if (dragging) title = "Thả tệp vào đây";

  return (
    <div className="u432" data-drag={dragging || undefined}>
      <label
        htmlFor={inputId}
        className="u432-dz"
        data-busy={arrival ? true : undefined}
        onDragEnter={over}
        onDragOver={over}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={(event) => {
          if (!carriesFiles(event.dataTransfer)) return;
          event.preventDefault();
          setDragging(false);
          if (!disabled) onFiles(Array.from(event.dataTransfer.files));
        }}
      >
        <span className="u432-idle">
          <span className="u432-arrow" aria-hidden="true">
            <Upload className="size-5" />
          </span>
          <span className="font-semibold text-heritage-primary">{title}</span>
          <span className="mt-1 text-xs text-heritage-muted">
            PDF hoặc ảnh, mỗi tệp tối đa 10 MB, tổng cộng 10 tệp
          </span>
        </span>
        {arrival && <ArrivalOverlay key={arrival.id} arrival={arrival} onEnd={onArrivalEnd} />}
        <input
          id={inputId}
          type="file"
          multiple
          accept={accept}
          disabled={disabled}
          aria-label={inputLabel}
          className="sr-only"
          onChange={(event) => {
            const picked = Array.from(event.target.files ?? []);
            event.target.value = "";
            onFiles(picked);
          }}
        />
      </label>
      <p role="status" className="sr-only">
        {arrival ? `Đã chọn ${arrival.files.map((file) => file.name).join(", ")}` : ""}
      </p>
    </div>
  );
}
