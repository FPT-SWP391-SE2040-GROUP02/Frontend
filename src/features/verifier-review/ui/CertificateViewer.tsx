import { useEffect, useState } from "react";
import { Download, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import type { z } from "zod";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { formatStorageSize } from "@/shared/lib/formatStorageSize";
import { verifierReviewService } from "../api/verifierReviewService";
import type { verifierFileSchema } from "../model/verifierReview.schema";

type VerifierFile = z.infer<typeof verifierFileSchema>;

const KIND_LABELS: Record<VerifierFile["kind"], string> = {
  DEATH_CERTIFICATE: "Giấy chứng tử",
  DEATH_NOTICE: "Giấy báo tử / giấy thay thế",
};
const ZOOM_STEPS = [50, 75, 100, 125, 150, 200, 300];

interface FileLoad {
  fileId: string;
  attempt: number;
  status: "ready" | "error";
  url: string | null;
}

/**
 * Tải nội dung một tệp thành object URL tạm trong RAM (không đưa vào cache truy vấn); thu hồi khi đổi tệp hoặc đóng.
 * Trạng thái chỉ được đặt trong callback của lần tải, nên "đang tải" là khi kết quả chưa khớp tệp và lần thử hiện tại.
 */
function useFileUrl(caseId: string, file: VerifierFile | undefined) {
  const [attempt, setAttempt] = useState(0);
  const [load, setLoad] = useState<FileLoad | null>(null);
  const fileId = file?.id;
  useEffect(() => {
    if (!fileId) return undefined;
    let cancelled = false;
    let created: string | null = null;
    verifierReviewService
      .downloadFile(caseId, fileId)
      .then((blob) => {
        if (cancelled) return;
        if (blob instanceof Blob) created = URL.createObjectURL(blob);
        setLoad({ fileId, attempt, status: "ready", url: created });
      })
      .catch(() => {
        if (!cancelled) setLoad({ fileId, attempt, status: "error", url: null });
      });
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [caseId, fileId, attempt]);
  const current = load !== null && load.fileId === fileId && load.attempt === attempt ? load : null;
  return {
    pending: Boolean(fileId) && current === null,
    failed: current?.status === "error",
    url: current?.url ?? null,
    retry: () => setAttempt(attempt + 1),
  };
}

/**
 * Trình xem giấy chứng tử cho Người xét duyệt: chọn từng tệp (giấy chứng tử, giấy báo tử), phóng to, thu nhỏ, xoay ảnh.
 * PDF dùng trình xem có sẵn của trình duyệt (có phóng to riêng); ảnh dùng nút phóng to và xoay ở đây.
 */
export function CertificateViewer({ caseId, files }: { caseId: string; files: VerifierFile[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoomIndex, setZoomIndex] = useState(2);
  const [rotation, setRotation] = useState(0);
  const file = files.find((item) => item.id === selectedId) ?? files[0];
  const { pending, failed, url, retry } = useFileUrl(caseId, file);
  if (!file) {
    return (
      <section
        aria-label="Giấy chứng tử"
        className="rounded-2xl border border-heritage-border bg-heritage-surface p-6"
      >
        <h3 className="text-xl font-semibold text-heritage-primary">Giấy chứng tử</h3>
        <p className="mt-3 text-sm text-heritage-muted">Hồ sơ chưa có tệp nào.</p>
      </section>
    );
  }
  const isImage = file.contentType.startsWith("image/");
  const zoom = ZOOM_STEPS[zoomIndex];
  return (
    <section
      aria-label="Giấy chứng tử"
      className="space-y-3 rounded-2xl border border-heritage-border bg-heritage-surface p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-xl font-semibold text-heritage-primary">Giấy chứng tử</h3>
        {isImage && (
          <div className="flex items-center gap-2" role="group" aria-label="Điều khiển ảnh">
            <button
              type="button"
              aria-label="Thu nhỏ"
              className={buttonStyles.outline}
              disabled={zoomIndex === 0}
              onClick={() => setZoomIndex(zoomIndex - 1)}
            >
              <ZoomOut className="size-4" aria-hidden="true" />
            </button>
            <span className="w-12 text-center text-sm tabular-nums">{zoom}%</span>
            <button
              type="button"
              aria-label="Phóng to"
              className={buttonStyles.outline}
              disabled={zoomIndex === ZOOM_STEPS.length - 1}
              onClick={() => setZoomIndex(zoomIndex + 1)}
            >
              <ZoomIn className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Xoay ảnh"
              className={buttonStyles.outline}
              onClick={() => setRotation((rotation + 90) % 360)}
            >
              <RotateCw className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      {files.length > 1 && (
        <div role="tablist" aria-label="Chọn tệp" className="flex flex-wrap gap-2">
          {files.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === file.id}
              className={item.id === file.id ? buttonStyles.dark : buttonStyles.outline}
              onClick={() => {
                setSelectedId(item.id);
                setRotation(0);
                setZoomIndex(2);
              }}
            >
              {KIND_LABELS[item.kind]}
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-heritage-muted">
        {KIND_LABELS[file.kind]} · {file.fileName} · {formatStorageSize(file.sizeBytes)}
      </p>
      {pending && (
        <p
          role="status"
          className="flex h-96 items-center justify-center rounded-xl bg-[#ECE8DB] text-sm text-heritage-muted"
        >
          Đang tải tệp…
        </p>
      )}
      {failed && (
        <div role="alert" className="space-y-3 rounded-xl bg-[#F8E1DE] p-4 text-sm text-[#7A1A14]">
          <p>Không tải được tệp.</p>
          <button type="button" className={buttonStyles.outline} onClick={retry}>
            Thử lại
          </button>
        </div>
      )}
      {url && isImage && (
        <div className="h-[28rem] overflow-auto rounded-xl border border-heritage-border bg-[#ECE8DB]">
          <img
            src={url}
            alt={`${KIND_LABELS[file.kind]}: ${file.fileName}`}
            style={{
              width: `${zoom}%`,
              transform: `rotate(${rotation}deg)`,
              transformOrigin: "center center",
            }}
            className="mx-auto max-w-none"
          />
        </div>
      )}
      {url && !isImage && (
        <iframe
          title={`${KIND_LABELS[file.kind]}: ${file.fileName}`}
          src={url}
          className="h-[28rem] w-full rounded-xl border border-heritage-border bg-white"
        />
      )}
      {url && (
        <a
          href={url}
          download={file.fileName.replace(/[^\p{L}\p{N} ._()-]/gu, "_")}
          className={`${buttonStyles.outline} inline-flex`}
        >
          <Download className="size-4" aria-hidden="true" />
          Tải xuống
        </a>
      )}
      <p className="text-xs text-heritage-muted">
        Mẹo: xem rõ số định danh, con dấu đỏ và chữ ký. Ảnh nghiêng thì bấm xoay.
      </p>
    </section>
  );
}
