import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { z } from "zod";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles, formatDateTime } from "@/shared/ui/heritageKit";
import { handoverRecordService } from "../api/handoverRecordService";
import type { HandoverRecord } from "../model/handoverRecord.schema";

const REFRESH_INTERVAL_MS = 30_000;

const failureBody = z.object({
  code: z.string().optional(),
  reason: z.string().optional(),
  remindAvailableAt: z.string().optional(),
});

/** Thông báo riêng cho các lý do Backend từ chối nhắc; null thì dùng thông báo chung. */
function remindFailureMessage(failure: unknown): string | null {
  if (!isAxiosError<unknown>(failure)) return null;
  const parsed = failureBody.safeParse(failure.response?.data);
  if (!parsed.success || parsed.data.code !== "HANDOVER_NOT_ALLOWED") return null;
  if (parsed.data.reason === "REMINDED_RECENTLY") {
    const availableAt = parsed.data.remindAvailableAt;
    if (availableAt) {
      return `Bạn vừa nhắc Người thực thi. Nhắc lại được sau ${formatDateTime(availableAt)}.`;
    }
    return "Bạn vừa nhắc Người thực thi. Hãy thử lại sau.";
  }
  if (parsed.data.reason === "EXECUTOR_ALREADY_SIGNED") return "Người thực thi đã ký biên bản.";
  if (parsed.data.reason === "NO_EXECUTOR") return "Chưa có Người thực thi để nhắc.";
  return null;
}

interface RemindExecutorButtonProps {
  record: HandoverRecord;
  /** Gọi với biên bản Backend trả về sau khi nhắc thành công để làm mới cache. */
  onUpdated: (next: HandoverRecord) => void;
}

/** Nút luật sư nhắc Người thực thi ký; chỉ hiện khi biên bản đã chốt và Người thực thi chưa ký. */
export function RemindExecutorButton({ record, onUpdated }: RemindExecutorButtonProps) {
  const remind = usePrivateAction();
  const [specificError, setSpecificError] = useState("");
  // Giờ hiện tại lưu trong state (render phải thuần); cập nhật mỗi 30 giây để nút tự mở khi hết thời gian chờ.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);
  let waiting = false;
  if (record.executorRemindAvailableAt) {
    waiting = nowMs < new Date(record.executorRemindAvailableAt).getTime();
  }
  let errorText = specificError;
  if (!errorText) errorText = remind.error;

  function handleClick() {
    setSpecificError("");
    void remind.execute(
      () => handoverRecordService.remindExecutor(record.id),
      onUpdated,
      (failure) => {
        const message = remindFailureMessage(failure);
        if (message) setSpecificError(message);
      },
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        className={buttonStyles.outline}
        disabled={remind.pending || waiting}
        onClick={handleClick}
      >
        {remind.pending ? "Đang nhắc…" : "Nhắc Người thực thi ký"}
      </button>
      {record.executorReminderSentAt && (
        <p className="text-heritage-muted">{`Đã nhắc lúc ${formatDateTime(record.executorReminderSentAt)}`}</p>
      )}
      {waiting && record.executorRemindAvailableAt && (
        <p className="text-heritage-muted">
          {`Nhắc lại được sau ${formatDateTime(record.executorRemindAvailableAt)}`}
        </p>
      )}
      {errorText && (
        <p role="alert" className="text-destructive">
          {errorText}
        </p>
      )}
    </div>
  );
}
