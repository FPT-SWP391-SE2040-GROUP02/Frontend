import { ShieldCheck } from "lucide-react";
import type { z } from "zod";
import { Chip, Notice } from "@/shared/ui/heritageKit";
import { formatDateTime } from "@/shared/lib/dateFormat";
import type {
  verifierOwnerIdentitySchema,
  verifierReviewVersionSchema,
} from "../model/verifierReview.schema";
import { VerifierIdentityImage } from "./VerifierIdentityImage";

/** Ngày dạng "05/10/2026" từ chuỗi ISO yyyy-mm-dd của BE; thiếu thì hiện "—". */
const formatDay = (value: string | null) => {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
};

/** Chip kết quả so khớp do BE tính; null (một bên thiếu dữ liệu) thì không hiện chip. */
function MatchChip({ matches }: { matches: boolean | null }) {
  if (matches === null) return null;
  if (matches) return <Chip tone="success">Khớp</Chip>;
  return <Chip tone="danger">Không khớp</Chip>;
}

/**
 * Đối chiếu bản Executor khai với danh tính chủ kho đã xác minh qua eKYC (BR-48 sửa 25/10/2026: Verifier được giao
 * xem đủ 12 số CCCD và ảnh mặt trước CCCD). Kết quả khớp/không khớp do BE so, FE chỉ hiển thị.
 */
export function VerifierOwnerIdentityPanel({
  caseId,
  review,
  identity,
}: {
  caseId: string;
  review: z.infer<typeof verifierReviewVersionSchema>;
  identity: z.infer<typeof verifierOwnerIdentitySchema>;
}) {
  return (
    <section
      aria-label="Đối chiếu danh tính chủ kho"
      className="space-y-4 rounded-2xl border border-heritage-border bg-heritage-surface p-6"
    >
      <h3 className="flex items-center gap-2 text-xl font-semibold text-heritage-primary">
        <ShieldCheck className="size-5" aria-hidden="true" />
        Đối chiếu danh tính chủ kho
      </h3>
      {!identity.verified ? (
        <Notice tone="warning" role="status">
          Chủ kho chưa xác minh danh tính (eKYC) nên chưa có dữ liệu để đối chiếu. Hãy dựa vào giấy
          tờ người thực hiện nộp.
        </Notice>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <caption className="sr-only">
                So sánh bản người thực hiện khai với danh tính chủ kho đã xác minh
              </caption>
              <thead className="text-xs text-heritage-muted">
                <tr>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Thông tin
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Người thực hiện khai
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Đã xác minh (eKYC)
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    Kết quả
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-heritage-border">
                <tr>
                  <th scope="row" className="py-2.5 pr-3 font-medium">
                    Họ tên
                  </th>
                  <td className="py-2.5 pr-3">{review.ownerFullName ?? "—"}</td>
                  <td className="py-2.5 pr-3 font-semibold">{identity.fullName ?? "—"}</td>
                  <td className="py-2.5">
                    <MatchChip matches={identity.fullNameMatches} />
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="py-2.5 pr-3 font-medium">
                    Số CCCD
                  </th>
                  <td className="py-2.5 pr-3 font-mono">{review.ownerCitizenId ?? "—"}</td>
                  <td className="py-2.5 pr-3 font-mono font-semibold">
                    {identity.citizenId ?? "—"}
                  </td>
                  <td className="py-2.5">
                    <MatchChip matches={identity.citizenIdMatches} />
                  </td>
                </tr>
                <tr>
                  <th scope="row" className="py-2.5 pr-3 font-medium">
                    Ngày sinh
                  </th>
                  <td className="py-2.5 pr-3 text-heritage-muted">Không khai</td>
                  <td className="py-2.5 pr-3 font-semibold">{formatDay(identity.dateOfBirth)}</td>
                  <td className="py-2.5" />
                </tr>
              </tbody>
            </table>
          </div>
          {identity.verifiedAt && (
            <p className="text-xs text-heritage-muted">
              Xác minh lúc {formatDateTime(identity.verifiedAt)}.
            </p>
          )}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Ảnh mặt trước CCCD lúc xác minh</h4>
            {identity.hasDocumentImage ? (
              <VerifierIdentityImage
                caseId={caseId}
                kind="owner-document"
                version={identity.documentImageCapturedAt}
                alt="Ảnh mặt trước CCCD của chủ kho"
              />
            ) : (
              <p className="text-sm text-heritage-muted">
                Chủ kho xác minh trước khi hệ thống lưu ảnh CCCD nên không có ảnh để xem.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
