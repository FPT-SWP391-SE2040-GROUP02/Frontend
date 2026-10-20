import type { z } from "zod";
import type { deathCaseSchema } from "../model/deathCase.schema";

type Case = z.infer<typeof deathCaseSchema>;

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

/** Mã phần cần bổ sung giống missingRequirements của Backend. */
const partLabels: Record<string, string> = {
  OWNER_FULL_NAME: "Họ tên Chủ kho",
  OWNER_CITIZEN_ID: "Số CCCD Chủ kho",
  DATE_OF_DEATH: "Ngày mất",
  CERTIFICATE_NUMBER: "Số giấy chứng tử",
  ISSUED_ON: "Ngày cấp",
  ISSUED_BY: "Nơi cấp",
  FILES: "Trang giấy chứng tử",
};

/**
 * Phản hồi của Verifier mà Executor được thấy: yêu cầu bổ sung hoặc lý do từ chối.
 * Không hiển thị gì về Verifier vì Backend không trả thông tin này.
 */
export function ReviewFeedback({ record }: { record: Case }) {
  const supplement = record.status === "SUPPLEMENT_REQUIRED" ? record.supplementRequest : null;
  const rejectReason = record.status === "REJECTED" ? record.rejectReason : null;
  if (supplement) {
    return (
      <section
        aria-labelledby="supplement-request-title"
        className="space-y-2 rounded-xl border border-heritage-gold-border bg-heritage-surface p-4"
      >
        <h3 id="supplement-request-title" className="font-semibold">
          Verifier yêu cầu bổ sung (bản {supplement.versionNo})
        </h3>
        <p className="text-sm">Lý do: {supplement.reason}</p>
        <p className="text-sm">
          Phần cần bổ sung:{" "}
          {supplement.requestedParts.map((part) => partLabels[part] ?? part).join(", ")}
        </p>
        <p className="text-sm text-heritage-muted">
          Yêu cầu lúc {dateTimeFormatter.format(new Date(supplement.requestedAt))}
          {supplement.dueAt
            ? `, hạn ${dateTimeFormatter.format(new Date(supplement.dueAt))}${supplement.overdue ? " (đã quá hạn)" : ""}`
            : ""}
          . Tạo bản bổ sung, sửa các phần trên rồi gửi lại.
        </p>
      </section>
    );
  }
  if (rejectReason) {
    return (
      <section
        aria-labelledby="reject-reason-title"
        className="space-y-2 rounded-xl border border-heritage-border bg-heritage-surface p-4"
      >
        <h3 id="reject-reason-title" className="font-semibold">
          Hồ sơ đã bị từ chối
        </h3>
        <p className="text-sm">Lý do: {rejectReason}</p>
        <p className="text-sm text-heritage-muted">
          Hồ sơ này đã đóng. Nếu có giấy tờ đúng, mở hồ sơ mới từ danh sách kho được phân công.
        </p>
      </section>
    );
  }
  return null;
}
