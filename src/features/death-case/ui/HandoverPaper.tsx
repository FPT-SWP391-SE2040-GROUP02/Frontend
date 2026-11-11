import { useEffect, useState } from "react";
import { Download, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { deathCaseService } from "../api/deathCaseService";

/**
 * Văn bản từ chối hoặc biên bản đồng ý của người nhận, xem ngay trong trang như ảnh giấy chứng tử Người xét duyệt đọc:
 * có phóng to, thu nhỏ, xoay và tải xuống. Ảnh chỉ là object URL tạm trong RAM, thu hồi khi đóng.
 */
const PAPER_ZOOM_STEPS = [50, 75, 100, 125, 150, 200];

export function HandoverPaper({
  caseId,
  turnId,
  label = "văn bản từ chối",
  buttonLabel,
  onOpenChange,
}: {
  caseId: string;
  turnId: string;
  label?: "văn bản từ chối" | "biên bản đồng ý";
  /** Chữ trên nút mở; mặc định "Xem {label}". */
  buttonLabel?: string;
  /** Báo cho khung chứa biết ảnh đang mở để nới rộng chỗ cho ảnh. */
  onOpenChange?: (open: boolean) => void;
}) {
  const action = usePrivateAction();
  const [url, setUrl] = useState<string | null>(null);
  const [zoomIndex, setZoomIndex] = useState(2);
  const [rotation, setRotation] = useState(0);
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);
  const changeUrl = (next: string | null) => {
    setUrl(next);
    if (onOpenChange) onOpenChange(next !== null);
  };
  const open = () =>
    void action.execute(
      () => deathCaseService.declinePaper(caseId, turnId),
      (blob) => {
        setZoomIndex(2);
        setRotation(0);
        changeUrl(URL.createObjectURL(blob));
      },
    );
  if (!url) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          className={buttonStyles.outline}
          onClick={open}
          disabled={action.pending}
        >
          {action.pending ? "Đang tải…" : (buttonLabel ?? `Xem ${label}`)}
        </button>
        {action.error && (
          <p role="alert" className="text-sm text-[#A32119]">
            {action.error}
          </p>
        )}
      </div>
    );
  }
  const zoom = PAPER_ZOOM_STEPS[zoomIndex];
  return (
    <section aria-label={label[0].toUpperCase() + label.slice(1)} className="space-y-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Điều khiển ảnh">
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
          disabled={zoomIndex === PAPER_ZOOM_STEPS.length - 1}
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
        <a
          href={url}
          download={label === "biên bản đồng ý" ? "bien-ban-dong-y.png" : "van-ban-tu-choi.png"}
          className={`${buttonStyles.outline} inline-flex`}
        >
          <Download className="size-4" aria-hidden="true" />
          Tải xuống
        </a>
        <button type="button" className={buttonStyles.outline} onClick={() => changeUrl(null)}>
          Đóng
        </button>
      </div>
      <div className="h-[28rem] overflow-auto rounded-xl border border-heritage-border bg-[#ECE8DB]">
        <img
          src={url}
          alt={
            label === "biên bản đồng ý"
              ? "Văn bản khai nhận di sản thừa kế"
              : "Văn bản từ chối nhận di sản"
          }
          style={{
            width: `${zoom}%`,
            transform: `rotate(${rotation}deg)`,
            transformOrigin: "center center",
          }}
          className="mx-auto max-w-none"
        />
      </div>
    </section>
  );
}
