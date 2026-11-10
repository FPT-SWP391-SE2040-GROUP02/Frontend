import { useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, ImageOff } from "lucide-react";
import {
  DocumentSignatureBox,
  HandoverDocumentDetail,
  VERIFIER_CHECKS,
  VERIFIER_CHECK_COUNT,
  useVerifierDocuments,
} from "@/entities/handoverDocument";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { formatDateTime } from "@/shared/lib/dateFormat";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { buttonStyles, Chip, Notice, Panel } from "@/shared/ui/heritageKit";
import { recipientReviewService } from "../api/recipientReviewService";
import {
  recipientReviewKeys,
  useRecipientImage,
  useRecipientSubmission,
  useRecipientSubmissions,
} from "../model/useRecipientReview";
import {
  SUBMISSION_KIND_LABELS,
  SUBMISSION_STATUS_LABELS,
  type RecipientSubmissionDetail,
} from "../model/recipientReview.schema";

/**
 * Hàng chờ duyệt hồ sơ người nhận của Người xét duyệt: danh sách, hoặc chi tiết một hồ sơ khi có ?submissionId=.
 * Chỉ hiện hồ sơ của kho mà mình đã duyệt hồ sơ chứng tử; Backend quyết định, màn hình không tự lọc.
 */
export function RecipientReviewQueue() {
  const [params, setParams] = useSearchParams();
  const selected = params.get("submissionId");
  if (selected) {
    return (
      <RecipientReviewDetail
        id={selected}
        onBack={() => {
          const next = new URLSearchParams(params);
          next.delete("submissionId");
          setParams(next);
        }}
      />
    );
  }
  return (
    <RecipientReviewList
      onOpen={(id) => {
        const next = new URLSearchParams(params);
        next.set("submissionId", id);
        setParams(next);
      }}
    />
  );
}

function RecipientReviewList({ onOpen }: { onOpen: (id: string) => void }) {
  const query = useRecipientSubmissions();
  if (query.isPending) return <p role="status">Đang tải hồ sơ người nhận…</p>;
  if (query.isError)
    return (
      <div role="alert" className="space-y-3 rounded-2xl bg-[#F8E1DE] p-5 text-sm text-[#7A1A14]">
        <p>Không tải được hồ sơ người nhận. Bạn cần là Người xét duyệt đang hoạt động.</p>
        <button
          type="button"
          className={buttonStyles.outline}
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          Thử lại
        </button>
      </div>
    );
  if (query.data.length === 0)
    return (
      <p
        role="status"
        className="rounded-2xl border border-heritage-border bg-white p-6 text-sm text-heritage-muted"
      >
        Chưa có hồ sơ người nhận nào chờ bạn duyệt.
      </p>
    );
  return (
    <ul className="space-y-3" aria-label="Hồ sơ người nhận chờ duyệt">
      {query.data.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onOpen(item.id)}
            className="flex w-full items-center justify-between gap-4 rounded-2xl border border-heritage-border bg-white p-4 text-left shadow-sm transition-colors hover:bg-[#F7F4EA]"
          >
            <span className="min-w-0">
              <b className="block text-heritage-primary">Hồ sơ người nhận · {item.containerName}</b>
              <span className="mt-1 block text-sm text-heritage-muted">
                {SUBMISSION_KIND_LABELS[item.kind]} · nộp lúc {formatDateTime(item.submittedAt)}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-3">
              <Chip tone={item.allMatch ? "success" : "danger"}>
                {item.allMatch ? "Khớp đủ" : "Có trường lệch"}
              </Chip>
              <ChevronRight className="size-5 text-heritage-muted" aria-hidden="true" />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function MatchRow({
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
      <span>
        {label}
        {detail && <span className="ml-2 font-mono text-xs text-heritage-muted">{detail}</span>}
      </span>
      <Chip tone={matches ? "success" : "danger"}>{matches ? "Khớp" : "Không khớp"}</Chip>
    </li>
  );
}

function IdImage({ id, side, label }: { id: string; side: "front" | "back"; label: string }) {
  const { state, retry } = useRecipientImage(id, side);
  if (state.status === "loading")
    return (
      <div
        role="status"
        className="flex h-48 items-center justify-center rounded-xl bg-[#ECE8DB] text-sm text-heritage-muted"
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
        className="h-48 w-full rounded-xl border border-heritage-border bg-white object-contain"
      />
    </a>
  );
}

function RecipientReviewDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const query = useRecipientSubmission(id);
  const client = useQueryClient();
  const action = usePrivateAction();
  const [supplementing, setSupplementing] = useState(false);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const documents = useVerifierDocuments();
  const [checks, setChecks] = useState<boolean[]>(() =>
    new Array<boolean>(VERIFIER_CHECK_COUNT).fill(false),
  );
  const [acknowledged, setAcknowledged] = useState(false);
  const [touched, setTouched] = useState(false);

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
  const document = detail.documentId
    ? (documents.data?.find((item) => item.id === detail.documentId) ?? null)
    : null;
  // Hồ sơ thuộc biên bản thì Người xét duyệt kiểm tra thủ công và chịu trách nhiệm, không còn bị chặn theo kết quả khớp tự động.
  const forDocument = Boolean(detail.documentId);
  const allChecked = checks.every(Boolean);
  let checkError: string | null = null;
  if (touched && !allChecked) checkError = "Phải tick đủ cả bốn mục kiểm tra thủ công.";
  else if (touched && !acknowledged) checkError = "Hãy tick ô xác nhận trách nhiệm để gửi.";
  const complete = () => {
    setTouched(true);
    if (!allChecked || !acknowledged) return;
    void action.execute(
      () => recipientReviewService.complete(id, checks, acknowledged),
      () => refresh("Đã kiểm tra và gửi biên bản"),
    );
  };
  const refresh = (message: string) => {
    setDone(message);
    void client.invalidateQueries({ queryKey: recipientReviewKeys.all });
  };

  return (
    <div className="space-y-6">
      {back}
      {done && (
        <Notice tone="success" title={done}>
          Kết quả đã được ghi nhật ký và gửi tới người nhận.
        </Notice>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-heritage-primary">
          Hồ sơ người nhận · {detail.containerName}
        </h2>
        <Chip tone={detail.status === "APPROVED" ? "success" : "neutral"}>
          {SUBMISSION_STATUS_LABELS[detail.status]}
        </Chip>
      </div>
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
          <p className="mt-4 text-xs text-heritage-muted">
            Hệ thống chỉ giữ kết quả đối chiếu và 4 số cuối căn cước, không lưu họ tên, ngày sinh
            hay số căn cước đầy đủ.
          </p>
        </Panel>
        <Panel title={`Căn cước của ${document?.recipient.fullName || "người nhận"}`}>
          <p className="mb-3 text-xs text-heritage-muted">
            Ảnh người nhận tải lên khi ký, 4 số cuối ••••{detail.citizenIdLast4}. Đối chiếu với tên
            ở Phần 2 trước khi tick.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <IdImage id={id} side="front" label="Căn cước mặt trước" />
            <IdImage id={id} side="back" label="Căn cước mặt sau" />
          </div>
        </Panel>
      </div>
      {detail.supplementReason && detail.status === "SUPPLEMENT_REQUESTED" && (
        <p className="rounded-xl bg-[#F1E6CC] px-4 py-3 text-sm text-[#7A5B24]">
          Đã yêu cầu bổ sung: {detail.supplementReason}
        </p>
      )}
      {document && (
        <Panel title="Biên bản">
          <HandoverDocumentDetail document={document} />
        </Panel>
      )}
      {forDocument && detail.canApprove ? (
        <Panel title="Kiểm tra thủ công và gửi">
          <div className="space-y-4">
            {!detail.allMatch && (
              <p role="note" className="rounded-xl bg-[#F1E6CC] px-4 py-3 text-sm text-[#7A5B24]">
                Đối chiếu tự động có trường lệch. Bạn tự kiểm tra ảnh căn cước và chịu trách nhiệm
                về việc gửi.
              </p>
            )}
            <DocumentSignatureBox
              role="verifier"
              kind={detail.kind}
              idPrefix="verifier-sign"
              checked={acknowledged}
              onCheckedChange={setAcknowledged}
              error={checkError}
              pending={action.pending}
              buttonLabel="Xác nhận đã kiểm tra và gửi"
              onSubmit={complete}
              extra={
                <fieldset className="space-y-2">
                  <legend className="text-sm font-semibold text-heritage-primary">
                    Kiểm tra thủ công. Phải tick đủ cả bốn mục
                  </legend>
                  {VERIFIER_CHECKS.map((text, index) => (
                    <label key={text} className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="mt-0.5 size-5 shrink-0"
                        checked={checks[index] ?? false}
                        disabled={action.pending}
                        onChange={(event) =>
                          setChecks((previous) =>
                            previous.map((value, position) =>
                              position === index ? event.target.checked : value,
                            ),
                          )
                        }
                      />
                      <span>{text}</span>
                    </label>
                  ))}
                </fieldset>
              }
            />
            {action.error && !action.pending && (
              <p role="alert" className="text-sm text-[#A32119]">
                {action.error}
              </p>
            )}
            <button
              type="button"
              className={buttonStyles.outline}
              disabled={!detail.canRequestSupplement || action.pending}
              onClick={() => setSupplementing(true)}
            >
              Yêu cầu bổ sung
            </button>
          </div>
        </Panel>
      ) : (
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
      )}
      {supplementing && (
        <Dialog open onOpenChange={(open) => !open && setSupplementing(false)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Yêu cầu người nhận bổ sung</DialogTitle>
              <DialogDescription>
                Nêu rõ cần sửa gì (ví dụ: ảnh mờ, ngày sinh không đọc được). Người nhận sẽ thấy lý
                do này và nộp lại.
              </DialogDescription>
            </DialogHeader>
            <SupplementReason value={reason} onChange={setReason} />
            <DialogFooter>
              <button
                type="button"
                className={buttonStyles.outline}
                onClick={() => setSupplementing(false)}
              >
                Quay lại
              </button>
              <button
                type="button"
                className={buttonStyles.gold}
                disabled={action.pending || reason.trim().length === 0}
                onClick={() =>
                  void action.execute(
                    () => recipientReviewService.requestSupplement(id, reason),
                    () => {
                      setSupplementing(false);
                      setReason("");
                      refresh("Đã yêu cầu người nhận bổ sung");
                    },
                  )
                }
              >
                Gửi yêu cầu
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function SupplementReason({
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
        className="mt-1 min-h-24 w-full rounded-xl border border-heritage-border bg-white p-3 text-sm outline-none focus-visible:border-heritage-gold"
      />
    </label>
  );
}
