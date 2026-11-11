import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, ImageOff } from "lucide-react";
import {
  HandoverDocumentText,
  handoverDocumentKeys,
  termsBullets,
  TERMS_DISCLAIMER,
  verifierCheckTexts,
  vietnamDayOf,
  formatDocumentDate,
  useVerifierDocuments,
  VERIFIER_CHECK_COUNT,
  type HandoverDocument,
} from "@/entities/handoverDocument";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { formatTimeThenDate } from "@/shared/lib/dateFormat";
import { buttonStyles, Chip, Notice, Panel } from "@/shared/ui/heritageKit";
import { recipientReviewService } from "../api/recipientReviewService";
import {
  recipientReviewKeys,
  useRecipientImage,
  useRecipientSubmission,
} from "../model/useRecipientReview";
import {
  SUBMISSION_KIND_LABELS,
  type RecipientSubmissionDetail,
} from "../model/recipientReview.schema";
import { RecipientChoiceChip } from "./RecipientReviewList";

/** Ba lý do chọn nhanh khi yêu cầu bổ sung: bấm thì điền vào ô lý do. */
const QUICK_REASONS: readonly string[] = [
  "Ảnh căn cước mờ, không đọc được",
  "Thông tin trên ảnh không khớp",
  "Biên bản chưa đúng hoặc thiếu chữ ký",
];

const STATUS_CHIPS: Record<
  RecipientSubmissionDetail["status"],
  { label: string; tone: "success" | "warning" | "neutral" }
> = {
  SUBMITTED: { label: "Chờ bạn duyệt", tone: "warning" },
  APPROVED: { label: "Đã duyệt", tone: "success" },
  SUPPLEMENT_REQUESTED: { label: "Chờ người nhận bổ sung", tone: "neutral" },
  SUPERSEDED: { label: "Đã được nộp lại", tone: "neutral" },
};

/** Một dòng đối chiếu ở luồng cũ (hồ sơ chưa có biên bản): tên mục, giá trị và nhãn Khớp hoặc Không khớp. */
export function MatchRow({
  label,
  matches,
  detail,
}: {
  label: string;
  matches: boolean;
  detail?: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-3 text-sm">
      <span className="min-w-0">
        {label}
        {detail && (
          <span className="ml-2 break-words font-mono text-xs text-heritage-primary">{detail}</span>
        )}
      </span>
      <Chip tone={matches ? "success" : "danger"}>{matches ? "Khớp" : "Không khớp"}</Chip>
    </li>
  );
}

/** Ảnh căn cước một mặt; bấm để mở cỡ lớn ở thẻ mới. large: khung ảnh cao hơn (màn duyệt mới). */
export function IdImage({
  id,
  side,
  label,
  large = false,
}: {
  id: string;
  side: "front" | "back";
  label: string;
  large?: boolean;
}) {
  const { state, retry } = useRecipientImage(id, side);
  const height = large ? "h-64 sm:h-72" : "h-48";
  if (state.status === "loading")
    return (
      <div
        role="status"
        className={`flex ${height} items-center justify-center rounded-xl bg-[#ECE8DB] text-sm text-heritage-muted`}
      >
        Đang tải ảnh…
      </div>
    );
  if (state.status === "error")
    return (
      <div role="alert" className="space-y-3 rounded-xl bg-[#F8E1DE] p-4 text-sm text-[#7A1A14]">
        <p className="flex items-center gap-2">
          <ImageOff className="size-4" aria-hidden="true" />
          Không tải được ảnh {label.toLowerCase()}.
        </p>
        <button type="button" className={buttonStyles.outline} onClick={retry}>
          Thử lại
        </button>
      </div>
    );
  return (
    <a
      href={state.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} (mở cỡ lớn)`}
      className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
    >
      <img
        src={state.url}
        alt={label}
        className={`${height} w-full rounded-xl border border-heritage-border bg-white object-contain`}
      />
    </a>
  );
}

/** Ô nhập lý do yêu cầu bổ sung. */
export function SupplementReason({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}): ReactNode {
  return (
    <label className="block text-sm">
      <span className="font-medium text-heritage-primary">Lý do</span>
      <textarea
        value={value}
        maxLength={1000}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 min-h-20 w-full rounded-xl border border-heritage-border bg-white p-3 text-sm outline-none focus-visible:border-heritage-gold"
      />
    </label>
  );
}

/** Số thứ tự của bước; tick xong thì thành dấu ✓ xanh. */
function StepBadge({ number, done }: { number: number; done: boolean }) {
  if (done) {
    return (
      <span
        data-testid={`step-${number}-done`}
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1F7A55] text-white"
      >
        <Check className="size-4" aria-hidden="true" />
        <span className="sr-only">Bước {number} đã kiểm xong</span>
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E0C486] text-sm font-semibold text-[#0A281E]"
    >
      {number}
    </span>
  );
}

function lastFour(value: string): string {
  if (value.length < 4) return value;
  return value.slice(value.length - 4);
}

/** Bảng đối chiếu 3 cột: người nhận khai, Chủ kho đã khai và kết quả khớp. Số căn cước chỉ hiện 4 số cuối. */
function MatchTable({
  detail,
  document,
}: {
  detail: RecipientSubmissionDetail;
  document: HandoverDocument | null;
}) {
  let declaredName = "";
  let declaredYear = "";
  let declaredId = `•••• ${detail.citizenIdLast4}`;
  let ownerDeclaredId = "—";
  if (document) {
    declaredName = document.recipient.fullName;
    if (document.recipient.birthYear) declaredYear = String(document.recipient.birthYear);
    if (document.recipient.citizenId.length > 4) {
      ownerDeclaredId = `•••• ${lastFour(document.recipient.citizenId)}`;
    }
    declaredId = `•••• ${lastFour(document.recipient.citizenIdLast4)}`;
  }
  const rows: Array<{ label: string; claimed: string; declared: string; matches: boolean }> = [
    {
      label: "Họ tên",
      claimed: declaredName || "—",
      declared: "Hệ thống đã đối chiếu",
      matches: detail.nameMatches,
    },
    {
      label: "Năm sinh",
      claimed: declaredYear || "—",
      declared: "Hệ thống đã đối chiếu",
      matches: detail.dateOfBirthMatches,
    },
    {
      label: "Số căn cước",
      claimed: declaredId,
      declared: ownerDeclaredId,
      matches: detail.citizenIdMatches,
    },
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-left text-sm">
        <caption className="sr-only">Đối chiếu thông tin người nhận</caption>
        <thead>
          <tr className="border-b border-heritage-border text-xs text-heritage-muted">
            <th scope="col" className="py-2 pr-3 font-semibold">
              Thông tin
            </th>
            <th scope="col" className="px-3 py-2 font-semibold">
              Người nhận khai
            </th>
            <th scope="col" className="px-3 py-2 font-semibold">
              Chủ kho đã khai
            </th>
            <th scope="col" className="py-2 pl-3 font-semibold">
              <span className="sr-only">Kết quả</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-heritage-border">
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row" className="py-3 pr-3 font-medium">
                {row.label}
              </th>
              <td className="px-3 py-3">{row.claimed}</td>
              <td className="px-3 py-3 text-heritage-muted">{row.declared}</td>
              <td className="py-3 pl-3">
                <Chip tone={row.matches ? "success" : "danger"}>
                  {row.matches ? "Khớp" : "Không khớp"}
                </Chip>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function dayText(instant: string): string {
  const day = vietnamDayOf(instant);
  return `${day.day}/${day.month}/${day.year}`;
}

/** Câu tóm tắt hồ sơ báo tin đã duyệt; thiếu mục nào thì bỏ cụm đó. */
function caseSummary(document: HandoverDocument): string {
  let head = "Hồ sơ báo tin của Chủ kho đã được duyệt";
  if (document.caseApprovedAt) head = `${head} ngày ${dayText(document.caseApprovedAt)}`;
  const facts: string[] = [];
  if (document.owner.dateOfDeath) {
    facts.push(`mất ngày ${formatDocumentDate(document.owner.dateOfDeath)}`);
  }
  if (document.owner.certificateIssuedOn) {
    let place = "";
    if (document.owner.deathRegistrationPlace) place = `${document.owner.deathRegistrationPlace} `;
    facts.push(
      `${place}đăng ký khai tử ngày ${formatDocumentDate(document.owner.certificateIssuedOn)}`,
    );
  }
  let sentence = `${head}.`;
  if (facts.length > 0) sentence = `${head}: ${facts.join(", ")}.`;
  return `${sentence} Bạn chỉ cần kiểm ${VERIFIER_CHECK_COUNT} việc dưới đây.`;
}

/**
 * Màn duyệt một hồ sơ người nhận. Hồ sơ thuộc biên bản: hai bước kiểm (đúng người, đúng biên bản) rồi thanh quyết định dính đáy
 * màn hình. Hồ sơ luồng cũ (chưa có biên bản): chỉ đối chiếu tự động và nút Duyệt như trước.
 */
export function RecipientReviewDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const query = useRecipientSubmission(id);
  const client = useQueryClient();
  const action = usePrivateAction();
  const documents = useVerifierDocuments();
  const [supplementing, setSupplementing] = useState(false);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [checks, setChecks] = useState<boolean[]>(() =>
    new Array<boolean>(VERIFIER_CHECK_COUNT).fill(false),
  );
  const [acknowledged, setAcknowledged] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const back = (
    <button type="button" className={`${buttonStyles.outline} mb-4`} onClick={onBack}>
      <ArrowLeft className="size-4" aria-hidden="true" />
      Về hàng chờ
    </button>
  );

  if (query.isPending) return <p role="status">Đang tải hồ sơ…</p>;
  if (query.isError)
    return (
      <div className="space-y-3">
        {back}
        <p role="alert" className="rounded-2xl bg-[#F8E1DE] p-5 text-sm text-[#7A1A14]">
          Không mở được hồ sơ này. Hồ sơ không tồn tại hoặc không thuộc kho bạn đã duyệt.
        </p>
      </div>
    );

  const detail: RecipientSubmissionDetail = query.data;
  let document: HandoverDocument | null = null;
  if (documents.data) {
    for (const candidate of documents.data) {
      if (detail.documentId && candidate.id === detail.documentId) document = candidate;
      else if (!detail.documentId && candidate.submissionId === detail.id) document = candidate;
    }
  }
  const forDocument = Boolean(detail.documentId);
  const checkedCount = checks.filter(Boolean).length;
  const allChecked = checkedCount === VERIFIER_CHECK_COUNT;
  const canSign = allChecked && acknowledged && document !== null && !action.pending;
  const statusChip = STATUS_CHIPS[detail.status];
  const checkTexts = verifierCheckTexts(detail.kind);

  const refresh = (message: string) => {
    setDone(message);
    void client.invalidateQueries({ queryKey: recipientReviewKeys.all });
    void client.invalidateQueries({ queryKey: handoverDocumentKeys.verifier() });
  };
  const complete = () => {
    if (!canSign) return;
    void action.execute(
      () => recipientReviewService.complete(id, checks, acknowledged),
      () => refresh("Đã kiểm tra và gửi biên bản"),
    );
  };
  const sendSupplement = () => {
    void action.execute(
      () => recipientReviewService.requestSupplement(id, reason),
      () => {
        setSupplementing(false);
        setReason("");
        refresh("Đã yêu cầu người nhận bổ sung");
      },
    );
  };
  const toggleCheck = (index: number, value: boolean) => {
    setChecks((previous) =>
      previous.map((current, position) => (position === index ? value : current)),
    );
  };

  const recipientName = document?.recipient.fullName ?? "";
  let title = `Hồ sơ người nhận · ${detail.containerName}`;
  if (recipientName) title = `${recipientName} · ${detail.containerName}`;
  const subtitleParts: string[] = [];
  if (document?.owner.fullName) subtitleParts.push(`Chủ kho ${document.owner.fullName}`);
  subtitleParts.push(
    `Người nhận ký biên bản lúc ${formatTimeThenDate(document?.recipient.signedAt ?? detail.submittedAt)}`,
  );

  const supplementPanel = supplementing && (
    <section
      aria-label="Yêu cầu người nhận bổ sung"
      className="space-y-3 border-b border-heritage-border bg-[#FFFBEF] p-4"
    >
      <p className="text-sm font-semibold text-heritage-primary">Yêu cầu người nhận bổ sung</p>
      <div className="flex flex-wrap gap-2">
        {QUICK_REASONS.map((text) => (
          <button
            key={text}
            type="button"
            className="rounded-full border border-heritage-border bg-white px-3 py-1.5 text-sm hover:bg-[#F4F1E6]"
            onClick={() => setReason(text)}
          >
            {text}
          </button>
        ))}
      </div>
      <SupplementReason value={reason} onChange={setReason} />
      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          className={buttonStyles.outline}
          onClick={() => {
            setSupplementing(false);
            setReason("");
          }}
        >
          Hủy
        </button>
        <button
          type="button"
          className={buttonStyles.gold}
          disabled={action.pending || reason.trim().length === 0}
          onClick={sendSupplement}
        >
          Gửi yêu cầu
        </button>
      </div>
    </section>
  );

  const errorLine = action.error && !action.pending && (
    <p role="alert" className="px-4 pt-3 text-sm text-[#A32119]">
      {action.error}
    </p>
  );

  let approvedNote: ReactNode = null;
  if (detail.status === "APPROVED") {
    let text =
      "Đã duyệt và ký biên bản. Người nhận được thông báo và có thể nhập mã mở gói để tải tài sản.";
    if (detail.kind === "DECLINE") {
      text = "Đã duyệt và ký văn bản từ chối. Người nhận và Người thực thi được thông báo.";
    }
    approvedNote = (
      <p
        role="status"
        className="rounded-2xl bg-[#DDEFE6] px-5 py-4 text-sm font-semibold text-[#1F7A55]"
      >
        {text}
      </p>
    );
  }

  return (
    <div className={`space-y-6 ${forDocument && detail.canApprove ? "pb-6" : ""}`}>
      {back}
      {done && (
        <Notice tone="success" title={done}>
          Kết quả đã được ghi nhật ký và gửi tới người nhận.
        </Notice>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-heritage-primary">{title}</h2>
          <p className="mt-1 text-sm text-heritage-muted">{subtitleParts.join(" · ")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RecipientChoiceChip kind={detail.kind} />
          <Chip tone={statusChip.tone}>{statusChip.label}</Chip>
        </div>
      </div>
      {approvedNote}
      {detail.supplementReason && detail.status === "SUPPLEMENT_REQUESTED" && (
        <p className="rounded-xl bg-[#F1E6CC] px-4 py-3 text-sm text-[#7A5B24]">
          Đã yêu cầu bổ sung: {detail.supplementReason}
        </p>
      )}

      {forDocument ? (
        <>
          {document && (
            <p className="rounded-xl bg-[#F4F1E6] px-4 py-3 text-sm text-heritage-text">
              {caseSummary(document)}
            </p>
          )}
          <section
            aria-labelledby="review-step-1"
            className="space-y-4 rounded-2xl border border-heritage-border bg-white p-5"
          >
            <div className="flex items-center gap-3">
              <StepBadge number={1} done={checks[0] === true} />
              <h3 id="review-step-1" className="text-lg font-semibold text-heritage-primary">
                Người nhận có đúng là người Chủ kho đã chọn?
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <IdImage id={id} side="front" label="Căn cước mặt trước" large />
              <IdImage id={id} side="back" label="Căn cước mặt sau" large />
            </div>
            <MatchTable detail={detail} document={document} />
            {detail.canApprove && (
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 size-5 shrink-0"
                  checked={checks[0] ?? false}
                  disabled={action.pending}
                  onChange={(event) => toggleCheck(0, event.target.checked)}
                />
                <span>{checkTexts[0]}</span>
              </label>
            )}
          </section>
          <section
            aria-labelledby="review-step-2"
            className="space-y-4 rounded-2xl border border-heritage-border bg-white p-5"
          >
            <div className="flex items-center gap-3">
              <StepBadge number={2} done={checks[1] === true} />
              <h3 id="review-step-2" className="text-lg font-semibold text-heritage-primary">
                Biên bản có đúng và đủ chữ ký?
              </h3>
            </div>
            {document ? (
              <HandoverDocumentText
                document={document}
                blank={document.status !== "COMPLETED"}
                wide
              />
            ) : documents.isError ? (
              <div role="alert" className="space-y-3 text-sm text-[#7A1A14]">
                <p>Không tải được biên bản. Bạn chưa thể duyệt khi chưa xem biên bản.</p>
                <button
                  type="button"
                  className={buttonStyles.outline}
                  onClick={() => void documents.refetch()}
                >
                  Thử lại
                </button>
              </div>
            ) : (
              <p role="status" className="text-sm text-heritage-muted">
                Đang tải biên bản…
              </p>
            )}
            {detail.canApprove && (
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5 size-5 shrink-0"
                  checked={checks[1] ?? false}
                  disabled={action.pending}
                  onChange={(event) => toggleCheck(1, event.target.checked)}
                />
                <span>{checkTexts[1]}</span>
              </label>
            )}
          </section>
          {detail.canApprove && (
            <div className="sticky bottom-0 z-20 -mx-1 overflow-hidden rounded-t-2xl border border-heritage-border bg-white shadow-[0_-8px_24px_rgba(10,40,30,0.12)]">
              {supplementPanel}
              {termsOpen && (
                <section
                  aria-label="Điều khoản cần biết trước khi ký"
                  className="space-y-2 border-b border-heritage-border bg-heritage-gold-light px-4 py-3 text-sm"
                >
                  <ul className="list-disc space-y-1 pl-5">
                    {termsBullets("verifier", detail.kind).map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                  <p className="text-heritage-muted">{TERMS_DISCLAIMER}</p>
                </section>
              )}
              {errorLine}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0 space-y-1">
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5 size-5 shrink-0"
                      checked={acknowledged}
                      disabled={action.pending}
                      onChange={(event) => setAcknowledged(event.target.checked)}
                    />
                    <span>Tôi chịu trách nhiệm về kết quả kiểm tra này.</span>
                  </label>
                  <button
                    type="button"
                    aria-expanded={termsOpen}
                    className="ml-8 text-sm font-semibold text-heritage-primary underline underline-offset-4"
                    onClick={() => setTermsOpen((value) => !value)}
                  >
                    Xem {termsBullets("verifier", detail.kind).length} điều khoản
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs text-heritage-muted" aria-live="polite">
                    Đã kiểm {checkedCount}/{VERIFIER_CHECK_COUNT}
                  </span>
                  <button
                    type="button"
                    className={buttonStyles.outline}
                    disabled={!detail.canRequestSupplement || action.pending}
                    onClick={() => setSupplementing(true)}
                  >
                    Yêu cầu bổ sung
                  </button>
                  <button
                    type="button"
                    className={buttonStyles.gold}
                    disabled={!canSign}
                    onClick={complete}
                  >
                    {action.pending ? "Đang gửi…" : "Duyệt và ký"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <Panel title="Đối chiếu với thông tin Chủ kho đã khai">
              <ul className="divide-y divide-heritage-border">
                <MatchRow label="Họ tên" matches={detail.nameMatches} />
                <MatchRow
                  label="Số căn cước"
                  matches={detail.citizenIdMatches}
                  detail={`•••••••• ${detail.citizenIdLast4}`}
                />
                <MatchRow label="Ngày sinh" matches={detail.dateOfBirthMatches} />
              </ul>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-heritage-muted">Lựa chọn</dt>
                  <dd className="font-semibold">{SUBMISSION_KIND_LABELS[detail.kind]}</dd>
                </div>
                <div>
                  <dt className="text-xs text-heritage-muted">Tài sản trong gói</dt>
                  <dd className="font-semibold">{detail.itemCount}</dd>
                </div>
                <div>
                  <dt className="text-xs text-heritage-muted">Đã đọc điều khoản</dt>
                  <dd className="font-semibold">{detail.acknowledged ? "Có" : "Không"}</dd>
                </div>
                {detail.kind === "DECLINE" && (
                  <div>
                    <dt className="text-xs text-heritage-muted">Tự nguyện từ chối</dt>
                    <dd className="font-semibold">{detail.voluntaryDecline ? "Có" : "Không"}</dd>
                  </div>
                )}
              </dl>
            </Panel>
            <Panel title="Căn cước người nhận">
              <div className="grid gap-3 sm:grid-cols-2">
                <IdImage id={id} side="front" label="Căn cước mặt trước" />
                <IdImage id={id} side="back" label="Căn cước mặt sau" />
              </div>
            </Panel>
          </div>
          <Panel title="Quyết định">
            <div className="space-y-3">
              {!detail.allMatch && (
                <p role="note" className="rounded-xl bg-[#F8E1DE] px-4 py-3 text-sm text-[#A32119]">
                  Có trường không khớp. Chỉ có thể yêu cầu người nhận bổ sung.
                </p>
              )}
              {action.error && !action.pending && (
                <p role="alert" className="text-sm text-[#A32119]">
                  {action.error}
                </p>
              )}
              {supplementPanel}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={buttonStyles.gold}
                  disabled={!detail.canApprove || action.pending}
                  onClick={() =>
                    void action.execute(
                      () => recipientReviewService.approve(id),
                      () => refresh("Đã duyệt hồ sơ người nhận"),
                    )
                  }
                >
                  Duyệt
                </button>
                <button
                  type="button"
                  className={buttonStyles.outline}
                  disabled={!detail.canRequestSupplement || action.pending}
                  onClick={() => setSupplementing(true)}
                >
                  Yêu cầu bổ sung
                </button>
              </div>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
