import { Eye, FileText, Trash2 } from "lucide-react";
import { formatStorageSize } from "@/shared/lib/formatStorageSize";
import { extensionLabel, previewKind } from "../model/fileLabel";
import { useObjectUrl } from "../model/useObjectUrl";

const ICON_BUTTON =
  "inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-heritage-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold-hover disabled:pointer-events-none disabled:opacity-50";

/** Ảnh thu nhỏ của tệp ảnh; PDF hoặc ảnh chưa đọc được thì hiện biểu tượng kèm đuôi tệp. */
function Thumbnail({ file }: { file: File }) {
  let imageFile: File | null = null;
  if (previewKind(file) === "image") imageFile = file;
  const url = useObjectUrl(imageFile);

  if (url) return <img src={url} alt="" className="size-full object-cover" />;
  return (
    <span className="flex size-full flex-col items-center justify-center bg-heritage-danger-bg text-heritage-danger">
      <FileText className="size-5" aria-hidden="true" />
      <span className="text-[0.625rem] font-bold leading-none">{extensionLabel(file.name)}</span>
    </span>
  );
}

/** Một tệp đã chọn: ảnh thu nhỏ, tên, dung lượng, nút xem trước và nút bỏ. */
export function PickedFileCard({
  file,
  fresh,
  disabled,
  onPreview,
  onRemove,
}: {
  file: File;
  fresh: boolean;
  disabled?: boolean;
  onPreview: () => void;
  onRemove: () => void;
}) {
  return (
    <li
      data-fresh={fresh || undefined}
      className="u432-card flex min-w-0 items-center gap-2.5 rounded-2xl border border-heritage-border bg-heritage-sunken p-2"
    >
      {/* Bấm ảnh thu nhỏ cũng mở xem trước; bàn phím dùng nút con mắt bên cạnh. */}
      <div
        aria-hidden="true"
        className="size-12 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-heritage-border bg-heritage-surface"
        onClick={onPreview}
      >
        <Thumbnail file={file} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-heritage-primary" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-heritage-muted">
          {formatStorageSize(file.size)} · {extensionLabel(file.name)} ·{" "}
          <span className="font-semibold whitespace-nowrap text-heritage-success">
            Sẵn sàng gửi
          </span>
        </p>
      </div>
      <div className="flex shrink-0">
        <button
          type="button"
          aria-label={`Xem trước ${file.name}`}
          className={`${ICON_BUTTON} hover:bg-heritage-surface hover:text-heritage-primary`}
          onClick={onPreview}
        >
          <Eye className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-label={`Bỏ tệp ${file.name}`}
          className={`${ICON_BUTTON} hover:bg-heritage-danger-bg hover:text-heritage-danger`}
          onClick={onRemove}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
