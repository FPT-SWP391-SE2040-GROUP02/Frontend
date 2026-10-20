import type { DeathCase } from "../model/deathCase.schema";
import { formatDateTime } from "@/shared/ui/heritageKit";
import { requirementLabels } from "./executorLabels";

/**
 * Phản hồi của Verifier mà Executor được thấy: yêu cầu bổ sung hoặc lý do từ chối.
 * Không hiển thị gì về Verifier vì Backend không trả thông tin này.
 */
export function ReviewFeedback({ record }: { record: DeathCase }) {
  const supplement = record.status === "SUPPLEMENT_REQUIRED" ? record.supplementRequest : null;
  const rejectReason = record.status === "REJECTED" ? record.rejectReason : null;
  if (supplement) {
    const missing = new Set(record.missingRequirements);
    return (
      <section
        aria-labelledby="supplement-request-title"
        className="space-y-3 rounded-2xl border border-[#E6C98B] bg-[#F1E6CC] p-6 text-[#5A4318]"
      >
        <h3 id="supplement-request-title" className="text-lg font-semibold">
          Verifier yêu cầu bổ sung (bản {supplement.versionNo})
        </h3>
        <p className="text-sm">Lý do: {supplement.reason}</p>
        <p className="text-sm">
          Phần cần bổ sung:{" "}
          {supplement.requestedParts.map((part) => requirementLabels[part] ?? part).join(", ")}
        </p>
        <ul className="divide-y divide-[#E6C98B]/70 rounded-xl bg-white/60 px-4">
          {supplement.requestedParts.map((part) => (
            <li key={part} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="font-medium">{requirementLabels[part] ?? part}</span>
              <span
                className={`rounded-full px-3 py-0.5 text-xs font-semibold ${missing.has(part) ? "bg-[#ECE8DB] text-[#4D4D4B]" : "bg-[#DDEFE6] text-[#1F7A55]"}`}
              >
                {missing.has(part) ? "Thiếu" : "Đã có"}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-sm">
          Yêu cầu lúc {formatDateTime(supplement.requestedAt)}
          {supplement.dueAt
            ? `, hạn ${formatDateTime(supplement.dueAt)}${supplement.overdue ? " (đã quá hạn)" : ""}`
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
        className="space-y-2 rounded-2xl border border-[#F0C4BF] bg-[#F8E1DE] p-6 text-[#7A1A14]"
      >
        <h3 id="reject-reason-title" className="text-lg font-semibold">
          Hồ sơ đã bị từ chối
        </h3>
        <p className="text-sm">Lý do: {rejectReason}</p>
        <p className="text-sm">
          Hồ sơ này đã đóng. Nếu có giấy tờ đúng, mở hồ sơ mới từ trang Báo tin.
        </p>
      </section>
    );
  }
  return null;
}
