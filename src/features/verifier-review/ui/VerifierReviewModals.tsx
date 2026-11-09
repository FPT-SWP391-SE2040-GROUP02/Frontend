import { useEffect, useId, useState } from "react";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { Textarea } from "@/shared/ui/textarea";
import { CustomCheckbox } from "@/shared/ui/CustomCheckbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import {
  approveCaseRequestSchema,
  requestSupplementRequestSchema,
  reviewFlagRequestSchema,
  blockerLabels,
  flagLabels,
} from "../model/verifierReview.schema";
import { getVerifierActions } from "../model/verifierActions";
import {
  readSigningFailure,
  signingFailureMessage,
  type SigningFailure,
} from "../model/signingError";
import {
  useApproveCase,
  useRequestSupplement,
  useReviewFlag,
  verifierKeys,
} from "../model/useVerifierReview";
import type { verifierCaseDetailSchema } from "../model/verifierReview.schema";
import {
  APPROVE_REASON,
  composeReason,
  RESUBMIT_REASONS,
  type ReasonOption,
} from "../model/decisionReasons";

type Detail = z.infer<typeof verifierCaseDetailSchema>;

const confirmation = z.boolean().refine(Boolean, "Cần xác nhận trước khi tiếp tục.");

function ReviewError({ error, onClose }: { error: string; onClose: () => void }) {
  const client = useQueryClient();
  return (
    <div role="alert" className="space-y-2 text-sm text-destructive">
      <p>{error}</p>
      <button
        type="button"
        className={buttonStyles.outline}
        onClick={() => {
          void client.invalidateQueries({ queryKey: verifierKeys.all });
          onClose();
        }}
      >
        Tải lại hồ sơ
      </button>
    </div>
  );
}

/** setTimeout chỉ nhận tối đa 2^31-1 ms; khóa dài nhất 24 giờ nên không vượt, giữ chặn cho chắc. */
const MAX_TIMER_MS = 2_147_483_647;
/** setTimeout có thể nổ sớm vài ms so với Date.now(); cộng thêm chút để lần kiểm tra chắc chắn nằm sau lockedUntil. */
const UNLOCK_MARGIN_MS = 50;

/**
 * Lỗi xác nhận mật khẩu của một lần mở modal Duyệt/Từ chối. Đang khóa (423 có lockedUntil) thì `locked` = true tới đúng
 * lockedUntil rồi tự mở lại; đóng modal là mất trạng thái (BE vẫn chặn nếu còn khóa).
 */
function useSigningFailure() {
  const [failure, setFailure] = useState<SigningFailure | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const lockedUntil = failure?.kind === "locked" ? failure.lockedUntil : null;
  useEffect(() => {
    if (lockedUntil === null) return;
    const timer = setTimeout(
      () => setNow(Date.now()),
      Math.min(Math.max(lockedUntil - Date.now(), 0) + UNLOCK_MARGIN_MS, MAX_TIMER_MS),
    );
    return () => clearTimeout(timer);
  }, [lockedUntil]);
  return {
    failure,
    locked: lockedUntil !== null && now < lockedUntil,
    clear: () => setFailure(null),
    /** Ghi nhận lỗi xác nhận mật khẩu nếu có; lỗi khác để null để UI giữ ReviewError. */
    capture: (error: unknown) => {
      setNow(Date.now());
      setFailure(readSigningFailure(error));
    },
  };
}

/** Ô mật khẩu xác nhận (DEATH-03); giá trị chỉ nằm trong state form của modal. */
function SigningPasswordField({
  registration,
  error,
}: {
  registration: UseFormRegisterReturn<"password">;
  error?: string;
}) {
  const inputId = useId();
  const hintId = useId();
  return (
    <div className="space-y-1 text-sm">
      <label htmlFor={inputId} className="block">
        Mật khẩu xác nhận
      </label>
      <input
        id={inputId}
        type="password"
        autoComplete="current-password"
        maxLength={256}
        aria-invalid={Boolean(error)}
        aria-describedby={hintId}
        className="min-h-11 w-full rounded-xl border border-heritage-border bg-heritage-surface px-3 py-2 text-sm text-heritage-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-primary aria-invalid:border-destructive"
        {...registration}
      />
      <p id={hintId} className="text-xs text-heritage-muted">
        Nhập mật khẩu tài khoản để xác nhận quyết định. Nhập sai 5 lần sẽ tạm khóa chức năng
        duyệt/từ chối.
      </p>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}

/** Lỗi xác nhận mật khẩu có câu riêng (không kèm "Tải lại hồ sơ" vì tải lại không giúp gì); lỗi khác giữ ReviewError. */
function DecisionError({
  signing,
  error,
  onClose,
}: {
  signing: SigningFailure | null;
  error: string;
  onClose: () => void;
}) {
  if (signing)
    return (
      <p role="alert" className="text-sm text-destructive">
        {signingFailureMessage(signing)}
      </p>
    );
  return error ? <ReviewError error={error} onClose={onClose} /> : null;
}

/** Các modal cho Verifier: review flag, request supplement, approve, reject. Mỗi modal dùng confirmation mặc định false. */
export function VerifierReviewModals({ caseId, detail }: { caseId: string; detail: Detail }) {
  const [params, setParams] = useSearchParams();
  const modal = params.get("modal");
  const flagId = params.get("flagId");
  const reason = params.get("reason");
  const close = () => {
    const next = new URLSearchParams(params);
    next.delete("modal");
    next.delete("flagId");
    next.delete("reason");
    setParams(next);
  };
  if (!modal) return null;
  // Modal mở qua URL vẫn theo cùng luật với nút: không mở thao tác BE sẽ chặn.
  const actions = getVerifierActions(detail);
  if (modal === "reviewFlag" && flagId && actions.canReviewFlag) {
    return (
      <ReviewFlagModal
        key={`${caseId}:${detail.etag}:${flagId}`}
        caseId={caseId}
        detail={detail}
        flagId={flagId}
        onClose={close}
      />
    );
  }
  if (modal === "supplement" && actions.canRequestSupplement) {
    return (
      <RequestSupplementModal
        key={`${caseId}:${detail.etag}:${reason ?? ""}`}
        caseId={caseId}
        detail={detail}
        initialReason={reason ?? ""}
        onClose={close}
      />
    );
  }
  if (modal === "approve" && actions.canOpenApprove) {
    return (
      <ApproveModal
        key={`${caseId}:${detail.etag}:${reason ?? ""}`}
        caseId={caseId}
        detail={detail}
        initialReason={reason ?? ""}
        onClose={close}
      />
    );
  }
  return null;
}

function ReviewFlagModal({
  caseId,
  detail,
  flagId,
  onClose,
}: {
  caseId: string;
  detail: Detail;
  flagId: string;
  onClose: () => void;
}) {
  const action = usePrivateAction();
  const review = useReviewFlag();
  const form = useForm<{ etag: string; note: string; confirm: boolean }>({
    resolver: zodResolver(reviewFlagRequestSchema.extend({ confirm: confirmation })),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { etag: detail.etag, note: "", confirm: false },
  });
  const confirmed = useWatch({ control: form.control, name: "confirm" });
  const onSubmit = form.handleSubmit((values) => {
    void action.execute(
      () => review(caseId, flagId, reviewFlagRequestSchema.parse(values)),
      () => onClose(),
    );
  });
  const flag = detail.flags.find((f) => f.id === flagId);
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl bg-[#FAFAF6] p-6 sm:max-w-[540px] max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kiểm tra cảnh báo</DialogTitle>
          <DialogDescription>
            {flag
              ? `${flagLabels[flag.kind]}: ${flag.detail} Hãy xem cảnh báo này có đáng lo không rồi ghi lại nhận định của bạn. Kiểm tra hết cảnh báo thì mới duyệt được hồ sơ.`
              : "Không tìm thấy cảnh báo trong hồ sơ hiện tại."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm">
            Ghi chú kiểm tra
            <Textarea
              {...form.register("note")}
              maxLength={1000}
              aria-invalid={Boolean(form.formState.errors.note)}
              className="mt-1 min-h-24 max-h-36"
            />
            {form.formState.errors.note && (
              <span className="text-xs text-destructive">{form.formState.errors.note.message}</span>
            )}
          </label>
          <CustomCheckbox
            className="min-h-11 w-full items-center!"
            label="Tôi đã kiểm tra cảnh báo này."
            {...form.register("confirm")}
          />
          {action.error && <ReviewError error={action.error} onClose={onClose} />}
          <DialogFooter>
            <button
              type="button"
              className={buttonStyles.outline}
              onClick={onClose}
              disabled={action.pending}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={buttonStyles.gold}
              disabled={action.pending || !confirmed}
            >
              {action.pending ? "Đang ghi…" : "Ghi nhận"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Danh sách lý do chọn một: mỗi dòng là một nút radio đủ lớn để bấm. */
function ReasonRadios({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: readonly ReasonOption[];
  value: string;
  onChange: (next: string) => void;
}) {
  const name = useId();
  return (
    <fieldset className="space-y-2 text-sm">
      <legend className="text-xs font-semibold uppercase tracking-wider text-heritage-muted">
        {legend} <span aria-hidden="true">*</span>
      </legend>
      {options.map((option) => (
        <label
          key={option.value}
          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-heritage-border bg-white px-3 py-2"
        >
          <input
            type="radio"
            name={name}
            className="size-5"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}

function RequestSupplementModal({
  caseId,
  detail,
  onClose,
}: {
  caseId: string;
  detail: Detail;
  initialReason?: string;
  onClose: () => void;
}) {
  const action = usePrivateAction();
  const request = useRequestSupplement();
  const [choice, setChoice] = useState("");
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(false);
  const option = RESUBMIT_REASONS.find((item) => item.value === choice);
  const noteRequired = choice === "OTHER";
  const ready = Boolean(option) && (!noteRequired || note.trim().length > 0) && confirm;
  const submit = () => {
    if (!option || !ready) return;
    void action.execute(
      () =>
        request(
          caseId,
          requestSupplementRequestSchema.parse({
            etag: detail.etag,
            reason: composeReason(option.label, note),
            requestedParts: ["FILES"],
          }),
        ),
      () => onClose(),
    );
  };
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-2xl bg-[#FAFAF6] p-6 sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>Yêu cầu nộp lại file</DialogTitle>
          <DialogDescription>
            Dùng khi đúng là giấy của chủ kho nhưng file chưa đọc được. Người thực hiện chỉ cần tải
            lại PDF.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <ReasonRadios
            legend="File gặp vấn đề gì?"
            options={RESUBMIT_REASONS}
            value={choice}
            onChange={setChoice}
          />
          <label className="block text-sm">
            <span className="font-medium text-heritage-primary">
              Lời nhắn cho Người thực hiện {noteRequired ? "*" : "(không bắt buộc)"}
            </span>
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={900}
              className="mt-1 min-h-20 max-h-36"
            />
          </label>
          <CustomCheckbox
            className="min-h-11 w-full items-center!"
            label="Tôi xác nhận yêu cầu này sẽ được gửi cho Người thực hiện."
            checked={confirm}
            onChange={(event) => setConfirm(event.target.checked)}
          />
          {action.error && <ReviewError error={action.error} onClose={onClose} />}
          <DialogFooter>
            <button
              type="button"
              className={buttonStyles.outline}
              onClick={onClose}
              disabled={action.pending}
            >
              Quay lại
            </button>
            <button
              type="button"
              className={buttonStyles.gold}
              disabled={action.pending || !ready}
              onClick={submit}
            >
              {action.pending ? "Đang gửi…" : "Gửi yêu cầu"}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ApproveModal({
  caseId,
  detail,
  onClose,
}: {
  caseId: string;
  detail: Detail;
  initialReason?: string;
  onClose: () => void;
}) {
  const action = usePrivateAction();
  const approve = useApproveCase();
  const signing = useSigningFailure();
  const form = useForm<{ etag: string; password: string; confirm: boolean }>({
    resolver: zodResolver(
      approveCaseRequestSchema.omit({ reason: true }).extend({ confirm: confirmation }),
    ),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { etag: detail.etag, password: "", confirm: false },
  });
  const blockers = detail.approveBlockers;
  const confirm = useWatch({ control: form.control, name: "confirm" });
  const password = useWatch({ control: form.control, name: "password" }) ?? "";
  const onSubmit = form.handleSubmit((values) => {
    const request = approveCaseRequestSchema.parse({
      etag: values.etag,
      reason: APPROVE_REASON,
      password: values.password,
    });
    // Mật khẩu chỉ dùng cho đúng một lần gửi; ô xác nhận giữ nguyên để thử lại.
    form.setValue("password", "");
    signing.clear();
    void action.execute(
      () => approve(caseId, request),
      () => onClose(),
      (error) => signing.capture(error),
    );
  });
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-2xl bg-[#FAFAF6] p-6 sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Duyệt và mở kho ngay?</DialogTitle>
          <DialogDescription>
            Bạn đã tích đủ 4 mục đối chiếu. Ngay khi bấm, hệ thống sẽ ghi tên bạn vào nhật ký, mở
            gói tài sản và gửi lời mời cho người nhận. Việc này không hoàn tác được.
          </DialogDescription>
        </DialogHeader>
        {blockers.length > 0 && (
          <div
            role="status"
            className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800"
          >
            <p className="font-semibold">Chưa duyệt được vì:</p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {blockers.map((b) => (
                <li key={b}>{blockerLabels[b]}</li>
              ))}
            </ul>
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-3">
          <CustomCheckbox
            id="verifier-approve-confirm"
            className="min-h-11 w-full items-center!"
            label="Tôi đã đối chiếu kỹ và chịu trách nhiệm về quyết định này."
            {...form.register("confirm")}
          />
          <SigningPasswordField
            registration={form.register("password")}
            error={form.formState.errors.password?.message}
          />
          <DecisionError signing={signing.failure} error={action.error} onClose={onClose} />
          <DialogFooter>
            <button
              type="button"
              className={buttonStyles.outline}
              onClick={onClose}
              disabled={action.pending}
            >
              Quay lại
            </button>
            <button
              type="submit"
              className={buttonStyles.gold}
              disabled={
                action.pending || signing.locked || !detail.canApprove || !confirm || !password
              }
            >
              {action.pending ? "Đang duyệt…" : "Duyệt và mở kho"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
