import { ShieldCheck } from "lucide-react";
import type { z } from "zod";
import { Notice } from "@/shared/ui/heritageKit";
import { formatDateTime } from "@/shared/lib/dateFormat";
import type { verifierOwnerIdentitySchema } from "../model/verifierReview.schema";
import { VerifierIdentityImage } from "./VerifierIdentityImage";

const formatDay = (value: string | null | undefined) => {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
};

/**
 * Khung "Chủ kho (từ xác minh danh tính)": họ tên, ngày sinh và lần điểm danh cuối của Chủ kho, kèm ảnh căn cước ẩn mặc định.
 * Thông tin này hệ thống đã có nên Người xét duyệt chỉ xem, không phải đối chiếu với giấy.
 * Chỉ hiển thị dữ liệu do máy chủ trả.
 */
export function VerifierEkycChecklist({
  caseId,
  identity,
  lastCheckInOn,
}: {
  caseId: string;
  identity: z.infer<typeof verifierOwnerIdentitySchema>;
  /** Ngày (giờ Việt Nam) Chủ kho tự điểm danh lần cuối, yyyy-MM-dd; null khi chưa từng. */
  lastCheckInOn: string | null | undefined;
}) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Họ tên", value: identity.fullName ?? "—" },
    { label: "Ngày sinh", value: formatDay(identity.dateOfBirth) },
    { label: "Điểm danh cuối", value: lastCheckInOn ? formatDay(lastCheckInOn) : "Chưa điểm danh" },
  ];
  return (
    <section
      aria-label="Chủ kho (từ xác minh danh tính)"
      className="space-y-4 rounded-2xl border border-heritage-border bg-heritage-surface p-6"
    >
      <h3 className="flex items-center gap-2 text-xl font-semibold text-heritage-primary">
        <ShieldCheck className="size-5" aria-hidden="true" />
        Chủ kho (từ xác minh danh tính)
      </h3>
      {identity.verified ? (
        <p className="text-sm text-heritage-muted">
          Đã xác minh bằng eKYC
          {identity.verifiedAt ? ` ngày ${formatDateTime(identity.verifiedAt)}` : ""}. Thông tin này
          hệ thống đã có, bạn chỉ cần xem.
        </p>
      ) : (
        <Notice tone="warning" role="status">
          Chủ kho chưa xác minh eKYC nên chưa có thông tin gốc. Hãy kiểm tra kỹ giấy tờ.
        </Notice>
      )}
      <dl className="divide-y divide-heritage-border">
        {rows.map((row) => (
          <div key={row.label} className="py-3">
            <dt className="text-xs text-heritage-muted">{row.label}</dt>
            <dd className="break-words text-sm font-semibold">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Ảnh căn cước gốc</h4>
        {identity.hasDocumentImage ? (
          <VerifierIdentityImage
            caseId={caseId}
            kind="owner-document"
            version={identity.documentImageCapturedAt}
            alt="Ảnh mặt trước CCCD của chủ kho"
          />
        ) : (
          <p className="text-sm text-heritage-muted">Không có ảnh căn cước để xem.</p>
        )}
      </div>
    </section>
  );
}
