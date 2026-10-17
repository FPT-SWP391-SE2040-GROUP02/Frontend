import { useEffect } from "react";
import type { z } from "zod";
import { Button } from "@/shared/ui/button";
import { useLiveness } from "../model/useLiveness";
import type { ekycStatusSchema } from "../model/ekyc.schema";

/** Camera stays mounted so an acquired stream always has a video node. */
export function LivenessPanel({
  onCompleted,
}: {
  onCompleted: (status: z.infer<typeof ekycStatusSchema>) => void;
}) {
  const { state, start, complete, cancel, videoRef, canvasRef } = useLiveness();
  useEffect(() => {
    if (state.kind !== "completed") return;
    void complete().then((status) => {
      if (status) onCompleted(status);
    });
  }, [state.kind, complete, onCompleted]);
  return (
    <div className="space-y-3 rounded-lg border border-heritage-border p-4 text-sm">
      <div
        hidden={state.kind !== "starting" && state.kind !== "running"}
        className="aspect-square w-full max-w-xs overflow-hidden rounded-2xl bg-heritage-primary"
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          aria-label="Camera thử thách"
          className="size-full object-cover"
        />
        <canvas ref={canvasRef} hidden aria-hidden="true" />
      </div>
      {state.kind === "idle" && (
        <>
          <p>
            Để hoàn tất xác minh, hãy thực hiện thử thách camera. Ảnh chỉ được xử lý trong phiên
            này.
          </p>
          <Button type="button" className="min-h-11" onClick={() => void start()}>
            Bắt đầu thử thách camera
          </Button>
        </>
      )}
      {state.kind === "starting" && <p role="status">Đang mở camera và bắt đầu thử thách…</p>}
      {state.kind === "running" && (
        <>
          <p role="status">{state.response.prompt || "Làm theo hướng dẫn của máy chủ."}</p>
          <ol className="list-decimal space-y-1 pl-5">
            {state.response.actions.map((action) => (
              <li
                key={action.key}
                className={
                  state.response.completed.includes(action.key)
                    ? "line-through text-heritage-muted"
                    : ""
                }
              >
                {action.label}
              </li>
            ))}
          </ol>
          {state.response.frameHint && <p>{state.response.frameHint}</p>}
        </>
      )}
      {(state.kind === "completed" || state.kind === "completing") && (
        <p role="status">Đang chốt kết quả xác minh với máy chủ…</p>
      )}
      {state.kind === "result" && (
        <p role="status">
          {state.passed
            ? "Máy chủ đã xác nhận kết quả xác minh."
            : "Lần xác minh chưa đạt. Bắt đầu lại từ bước giấy tờ."}
        </p>
      )}
      {state.kind === "error" && (
        <>
          <p role="alert">{state.message}</p>
          <Button type="button" className="min-h-11" onClick={() => void start()}>
            Thử lại
          </Button>
        </>
      )}
      {(state.kind === "starting" || state.kind === "running") && (
        <Button type="button" variant="outline" onClick={cancel}>
          Hủy thử thách
        </Button>
      )}
    </div>
  );
}
