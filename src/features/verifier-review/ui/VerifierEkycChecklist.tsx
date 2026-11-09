import { ShieldCheck } from "lucide-react";
import type { z } from "zod";
import { Notice } from "@/shared/ui/heritageKit";
import { formatDateTime } from "@/shared/lib/dateFormat";
import type { verifierOwnerIdentitySchema } from "../model/verifierReview.schema";
import { REVIEW_CHECKS } from "../model/reviewChecks";
import { VerifierIdentityImage } from "./VerifierIdentityImage";

const formatDay = (value: string | null) => {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
};

/**
 * Thông tin gốc của chủ kho (đã xác minh eKYC) cạnh ô kiểm "khớp với giấy", kèm ảnh căn cước ẩn mặc định.
 * Chỉ hiển thị dữ liệu do máy chủ trả; trạng thái các ô kiểm do trang cha giữ.
 */
export function VerifierEkycChecklist({
  caseId,
  identity,
  checks,
  onToggle,
  disabled,
}: {
  caseId: string;
  identity: z.infer<typeof verifierOwnerIdentitySchema>;
  checks: boolean[];
  onToggle: (index: number) => void;
  disabled: boolean;
}) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Họ tên", value: identity.fullName ?? "—" },
    { label: "Số CCCD", value: identity.citizenId ?? "—" },
    { label: "Ngày sinh", value: formatDay(identity.dateOfBirth) },
  ];
  return (
    <section
      aria-label="Thông tin gốc của chủ kho"
      className="space-y-4 rounded-2xl border border-heritage-border bg-heritage-surface p-6"
    >
      <h3 className="flex items-center gap-2 text-xl font-semibold text-heritage-primary">
        <ShieldCheck className="size-5" aria-hidden="true" />
        Thông tin gốc của chủ kho
      </h3>
      {identity.verified ? (
        <p className="text-sm text-heritage-muted">
          Đã xác minh bằng eKYC
          {identity.verifiedAt ? ` ngày ${formatDateTime(identity.verifiedAt)}` : ""}. Thông tin này
          đúng, chỉ cần so với giấy.
        </p>
      ) : (
        <Notice tone="warning" role="status">
          Chủ kho chưa xác minh eKYC nên chưa có thông tin gốc. Hãy kiểm tra kỹ giấy tờ.
        </Notice>
      )}
      <ul className="divide-y divide-heritage-border">
        {rows.map((row, index) => (
          <li key={row.label} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-xs text-heritage-muted">{row.label}</p>
              <p className="break-words text-sm font-semibold">{row.value}</p>
            </div>
            <label className="flex min-h-11 shrink-0 items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-5"
                checked={checks[index]}
                disabled={disabled}
                onChange={() => onToggle(index)}
              />
              {REVIEW_CHECKS[index]}
            </label>
          </li>
        ))}
        <li className="py-3">
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-5"
              checked={checks[3]}
              disabled={disabled}
              onChange={() => onToggle(3)}
            />
            {REVIEW_CHECKS[3]}
          </label>
        </li>
      </ul>
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
