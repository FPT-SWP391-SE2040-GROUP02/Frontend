import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { ChevronLeft, Printer } from "lucide-react";
import type { AuthState } from "@/entities/user/model/authSlice";
import { ROUTES } from "@/shared/config/routes.config";
import { formatDateTime } from "@/shared/lib/dateFormat";
import { formatStorageSize } from "@/shared/lib/formatStorageSize";
import { buttonStyles, Chip } from "@/shared/ui/heritageKit";
import { caseCode } from "../model/caseCode";
import { REVIEW_CHECKS } from "../model/reviewChecks";
import { decisionLabels } from "../model/verifierReview.schema";
import { useVerifierCase } from "../model/useVerifierReview";

const KIND_LABELS = {
  DEATH_CERTIFICATE: "Giấy chứng tử",
  DEATH_NOTICE: "Giấy báo tử / giấy thay thế",
} as const;

/** Che giữa số CCCD: giữ 3 số đầu và 3 số cuối. */
function maskCitizenId(value: string | null): string {
  if (!value) return "—";
  if (value.length <= 6) return value;
  return `${value.slice(0, 3)}•••${value.slice(-3)}`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t border-heritage-border pt-5 print:break-inside-avoid">
      <h3 className="text-lg font-semibold text-heritage-primary">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-1.5 text-sm sm:grid-cols-[200px_minmax(0,1fr)]">
      <dt className="text-heritage-muted">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

/**
 * Biên bản thẩm định của một hồ sơ đã được duyệt, dựng hoàn toàn từ dữ liệu Backend (mã biên bản, thời điểm duyệt,
 * nhật ký quyết định). Không chỉnh sửa được; có nút in. Hồ sơ chưa duyệt thì không có biên bản.
 */
export function VerifierRecord() {
  const [params] = useSearchParams();
  const caseId = params.get("caseId");
  const query = useVerifierCase(caseId);
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);

  const back = (
    <Link to={ROUTES.NOTARY.HISTORY} className={buttonStyles.outline}>
      <ChevronLeft className="size-4" aria-hidden="true" />
      Về Lịch sử
    </Link>
  );
  if (!caseId) {
    return (
      <div className="space-y-3">
        <p role="status">Chưa chọn hồ sơ. Mở biên bản từ Lịch sử.</p>
        {back}
      </div>
    );
  }
  if (query.isPending) return <p role="status">Đang tải biên bản…</p>;
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p>Không đọc được hồ sơ hoặc bạn không có quyền xem.</p>
        <button type="button" className={buttonStyles.outline} onClick={() => void query.refetch()}>
          Thử lại
        </button>
        {back}
      </div>
    );
  }
  const detail = query.data;
  const approval = detail.decisions.find(
    (decision) =>
      (decision.kind === "APPROVED" || decision.kind === "REJECTED") && decision.recordCode,
  );
  if (!approval) {
    return (
      <div className="space-y-3">
        <p role="status">Hồ sơ này chưa có quyết định cuối nên chưa có biên bản thẩm định.</p>
        {back}
      </div>
    );
  }
  const review = detail.reviewVersion;
  const identity = detail.ownerIdentity;
  const rejected = approval.kind === "REJECTED";
  return (
    <article className="space-y-5 rounded-2xl border border-heritage-border bg-white p-6 print:border-0 print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        {back}
        <button type="button" className={buttonStyles.dark} onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden="true" />
          In biên bản
        </button>
      </div>
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-heritage-muted">
          LegacyVault · Hệ thống két sắt di sản số
        </p>
        <h2 className="text-2xl font-semibold text-heritage-primary">
          Biên bản thẩm định hồ sơ báo tin
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          {rejected ? (
            <Chip tone="danger">Từ chối · Hồ sơ đã đóng</Chip>
          ) : (
            <Chip tone="success">Chấp thuận · Kho đã mở</Chip>
          )}
          <span className="text-sm text-heritage-muted">Mã biên bản</span>
          <span className="font-mono text-base font-semibold">{approval.recordCode}</span>
        </div>
      </header>

      <Section title="1. Hồ sơ được thẩm định">
        <dl>
          <Row label="Mã hồ sơ" value={caseCode(detail.id)} />
          <Row label="Chủ kho" value={identity.fullName ?? "—"} />
          <Row label="Số CCCD chủ kho" value={maskCitizenId(identity.citizenId)} />
          <Row label="Người nộp" value={detail.executor?.fullName ?? "—"} />
          <Row
            label="Nộp hồ sơ lúc"
            value={review.submittedAt ? formatDateTime(review.submittedAt) : "—"}
          />
          <Row
            label="Số lần nộp"
            value={review.versionNo === 1 ? "1 (lần nộp đầu)" : `${review.versionNo} (bản nộp lại)`}
          />
        </dl>
      </Section>

      {rejected ? (
        <Section title="2. Lý do từ chối">
          <p className="text-sm font-semibold">{approval.reason}</p>
          <p className="text-sm text-heritage-muted">
            Hồ sơ đã đóng, kho vẫn khóa. Người nộp phải tạo hồ sơ mới từ đầu.
          </p>
        </Section>
      ) : (
        <Section title="2. Kết quả đối chiếu">
          <p className="text-sm text-heritage-muted">
            Nút duyệt chỉ mở khi người thẩm định đã tích đủ bốn mục dưới đây.
          </p>
          <ul className="space-y-1 text-sm">
            {REVIEW_CHECKS.map((check) => (
              <li key={check} className="flex items-center justify-between gap-3 py-1">
                <span>{check}</span>
                <Chip tone="success">Đạt</Chip>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="3. Tài liệu đã thẩm định">
        {review.files.length === 0 ? (
          <p className="text-sm text-heritage-muted">Không có tệp.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {review.files.map((file) => (
              <li key={file.id}>
                <span className="font-semibold">{KIND_LABELS[file.kind]}</span> · {file.fileName} ·{" "}
                {formatStorageSize(file.sizeBytes)}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="4. Quyết định">
        <dl>
          <Row
            label="Quyết định"
            value={rejected ? "Từ chối hồ sơ và đóng hồ sơ" : "Chấp thuận hồ sơ, mở gói tài sản"}
          />
          <Row label="Người thẩm định" value={user?.fullName ?? "—"} />
          <Row label="Thời điểm" value={`${formatDateTime(approval.decidedAt)} (giờ Việt Nam)`} />
        </dl>
      </Section>

      <Section title="5. Nhật ký thẩm định">
        <p className="text-sm text-heritage-muted">
          Hệ thống tự ghi mỗi quyết định của Người xét duyệt trên hồ sơ này. Không ai sửa hoặc xóa
          được.
        </p>
        <ul className="divide-y divide-heritage-border text-sm">
          {detail.decisions.map((decision) => (
            <li
              key={`${decision.kind}-${decision.versionNo}-${decision.decidedAt}`}
              className="flex flex-wrap items-center justify-between gap-2 py-2"
            >
              <span>
                v{decision.versionNo} · {decisionLabels[decision.kind]} · {decision.reason}
              </span>
              <span className="text-xs text-heritage-muted">
                {formatDateTime(decision.decidedAt)}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <p className="text-xs text-heritage-muted">
        Biên bản do hệ thống tạo tự động tại thời điểm Người xét duyệt bấm duyệt. Nội dung không
        chỉnh sửa được.
      </p>
    </article>
  );
}
