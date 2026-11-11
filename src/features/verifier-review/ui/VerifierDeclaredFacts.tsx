import { TriangleAlert } from "lucide-react";
import type { z } from "zod";
import { REVIEW_CHECKS, REVIEW_CHECKS_HINT } from "../model/reviewChecks";
import type {
  verifierReviewVersionSchema,
  verifierWarningSchema,
} from "../model/verifierReview.schema";

const formatDay = (value: string | null | undefined) => {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
};

/**
 * Khung "Người thực thi khai · đánh dấu nếu khớp với giấy": ba dòng (ngày mất, ngày đăng ký khai tử, nơi đăng ký khai tử),
 * mỗi dòng một ô đánh dấu. Dòng đã đánh dấu có nền xanh nhạt và chữ "Khớp". Trạng thái các ô do trang cha giữ.
 */
export function VerifierDeclaredFacts({
  review,
  checks,
  onToggle,
  disabled,
}: {
  review: z.infer<typeof verifierReviewVersionSchema>;
  checks: boolean[];
  onToggle: (index: number) => void;
  disabled: boolean;
}) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Ngày mất", value: formatDay(review.dateOfDeath) },
    { label: "Ngày đăng ký khai tử", value: formatDay(review.issuedOn) },
    { label: "Nơi đăng ký khai tử", value: review.deathRegistrationPlace || "—" },
  ];
  return (
    <section
      aria-label="Người thực thi khai"
      className="space-y-4 rounded-2xl border border-heritage-border bg-heritage-surface p-6"
    >
      <h3 className="text-xl font-semibold text-heritage-primary">
        Người thực thi khai · đánh dấu nếu khớp với giấy
      </h3>
      <ul className="space-y-2">
        {rows.map((row, index) => {
          const matched = checks[index] === true;
          return (
            <li
              key={row.label}
              data-matched={matched ? "true" : "false"}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                matched ? "border-[#BFE3D0] bg-[#E3F4EA]" : "border-heritage-border bg-white"
              }`}
            >
              <div className="min-w-0">
                <p className="text-xs text-heritage-muted">{row.label}</p>
                <p className="break-words text-sm font-semibold">{row.value}</p>
              </div>
              <label className="flex min-h-11 shrink-0 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-5"
                  aria-label={REVIEW_CHECKS[index]}
                  checked={matched}
                  disabled={disabled}
                  onChange={() => onToggle(index)}
                />
                {matched ? (
                  <span className="font-semibold text-[#1F7A55]">Khớp</span>
                ) : (
                  <span className="text-heritage-muted">Khớp với giấy</span>
                )}
              </label>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-heritage-muted">{REVIEW_CHECKS_HINT}</p>
    </section>
  );
}

/**
 * Cảnh báo tính lúc đọc (nền đỏ nhạt) dưới hai khung trên. Chỉ để Người xét duyệt kiểm tra kỹ giấy, KHÔNG chặn duyệt.
 * Không có cảnh báo thì không vẽ gì.
 */
export function VerifierWarnings({
  warnings,
}: {
  warnings: Array<z.infer<typeof verifierWarningSchema>>;
}) {
  if (warnings.length === 0) return null;
  return (
    <section aria-label="Cảnh báo khi đối chiếu" className="space-y-2">
      {warnings.map((warning) => (
        <p
          key={warning.code}
          role="alert"
          data-warning-code={warning.code}
          className="flex items-start gap-2 rounded-xl bg-[#F8E1DE] px-4 py-3 text-sm text-[#7A1A14]"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{warning.message}</span>
        </p>
      ))}
    </section>
  );
}
