import { useEffect, type ReactNode } from "react";
import type { z } from "zod";
import { Check } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useLiveness } from "../model/useLiveness";
import type { ekycStatusSchema } from "../model/ekyc.schema";

const CARD = "rounded-2xl border border-heritage-border bg-heritage-surface p-6";

/** Camera stays mounted so an acquired stream always has a video node. */
export function LivenessPanel({
  onCompleted,
}: {
  onCompleted: (status: z.infer<typeof ekycStatusSchema>, selfieUrl?: string | null) => void;
}) {
  const { state, start, complete, cancel, videoRef, canvasRef, handoffSelfie } = useLiveness();
  useEffect(() => {
    if (state.kind !== "completed") return;
    void complete().then((status) => {
      if (status) {
        const selfie = handoffSelfie();
        if (selfie) {
          onCompleted(status, selfie);
        } else {
          onCompleted(status);
        }
      }
    });
  }, [state.kind, complete, onCompleted, handoffSelfie]);

  const cameraOn = state.kind === "starting" || state.kind === "running";
  let cameraChip = "Đang tắt";
  let cameraChipStyle = "bg-heritage-canvas text-heritage-muted";
  if (cameraOn) {
    cameraChip = "Đang bật";
    cameraChipStyle = "bg-green-100 text-green-800";
  }
  let progressChip = "Chưa chạy";
  let progressChipStyle = "bg-heritage-canvas text-heritage-muted";
  if (state.kind === "running" || state.kind === "starting") {
    progressChip = "Đang chạy";
    progressChipStyle = "bg-[#F1E7D0] text-[#7A5B24]";
  } else if (state.kind === "completed" || state.kind === "completing" || state.kind === "result") {
    progressChip = "Hoàn tất";
    progressChipStyle = "bg-green-100 text-green-800";
  }

  let startLabel = "Bắt đầu thử thách camera";
  if (state.kind === "error") {
    startLabel = "Thử lại";
  }
  let overlayLabel = "Camera đang tắt";
  if (cameraOn) {
    overlayLabel = "Camera đang bật";
  }

  const actionRows: ReactNode[] = [];
  if (state.kind === "running") {
    let order = 0;
    for (const action of state.response.actions) {
      order = order + 1;
      const done = state.response.completed.includes(action.key);
      let rowStyle = "bg-heritage-canvas";
      let badge: ReactNode = order;
      let badgeStyle = "border border-heritage-border bg-heritage-surface";
      let textStyle = "";
      if (done) {
        rowStyle = "bg-green-50";
        badge = <Check className="size-4" aria-hidden="true" />;
        badgeStyle = "bg-green-600 text-white";
        textStyle = "line-through text-heritage-muted";
      }
      actionRows.push(
        <li
          key={action.key}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${rowStyle}`}
        >
          <span
            className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${badgeStyle}`}
            aria-hidden="true"
          >
            {badge}
          </span>
          <span className={textStyle}>{action.label}</span>
        </li>,
      );
    }
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section aria-label="Camera trực tiếp" className={CARD}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-medium text-heritage-primary">Camera trực tiếp</h3>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cameraChipStyle}`}>
            {cameraChip}
          </span>
        </div>
        <div className="relative mt-5 aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#14382b]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            hidden={!cameraOn}
            aria-label="Camera thử thách"
            className="absolute inset-0 size-full -scale-x-100 object-cover"
          />
          <canvas ref={canvasRef} hidden aria-hidden="true" />
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            className="pointer-events-none absolute inset-0 size-full"
            aria-hidden="true"
          >
            <ellipse
              cx="50"
              cy="50"
              rx="20"
              ry="30"
              fill="none"
              stroke="#E0C486"
              strokeWidth="0.8"
              strokeDasharray="3 2"
            />
          </svg>
          <span className="absolute left-4 top-4 text-xs font-semibold text-white/90">
            {overlayLabel}
          </span>
        </div>
        <p className="mt-4 text-sm text-heritage-muted">
          Giữ đủ sáng, bỏ khẩu trang và đặt mặt trong khung hướng dẫn.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {(state.kind === "idle" || state.kind === "error") && (
            <Button
              type="button"
              size="lg"
              className="bg-[#1d4d3c] text-white"
              onClick={() => void start()}
            >
              {startLabel}
            </Button>
          )}
          {cameraOn && (
            <Button type="button" variant="outline" size="lg" onClick={cancel}>
              Hủy thử thách
            </Button>
          )}
        </div>
      </section>

      <section aria-label="Tiến trình thử thách" className={CARD}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-medium text-heritage-primary">Tiến trình thử thách</h3>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${progressChipStyle}`}>
            {progressChip}
          </span>
        </div>
        {state.kind === "idle" && (
          <p className="mt-4 text-sm leading-6 text-heritage-muted">
            Để hoàn tất xác minh, hãy thực hiện thử thách camera. Hệ thống chọn ngẫu nhiên các động
            tác (chớp mắt, quay đầu) khi bạn bắt đầu. Ảnh chỉ được xử lý trong phiên này.
          </p>
        )}
        {state.kind === "starting" && (
          <p role="status" className="mt-4 text-sm">
            Đang mở camera và bắt đầu thử thách…
          </p>
        )}
        {state.kind === "running" && (
          <>
            <p role="status" className="mt-4 text-sm">
              {state.response.prompt || "Làm theo hướng dẫn của máy chủ."}
            </p>
            <ol className="mt-4 space-y-3">{actionRows}</ol>
            {state.response.frameHint && (
              <p className="mt-4 rounded-xl bg-heritage-canvas p-3 text-sm">
                {state.response.frameHint}
              </p>
            )}
          </>
        )}
        {(state.kind === "completed" || state.kind === "completing") && (
          <p role="status" className="mt-4 text-sm">
            Đang chốt kết quả xác minh với máy chủ…
          </p>
        )}
        {state.kind === "result" && (
          <p role="status" className="mt-4 text-sm">
            {state.passed
              ? "Máy chủ đã xác nhận kết quả xác minh."
              : "Lần xác minh chưa đạt. Bắt đầu lại từ bước giấy tờ."}
          </p>
        )}
        {state.kind === "error" && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {state.message}
          </p>
        )}
      </section>
    </div>
  );
}
