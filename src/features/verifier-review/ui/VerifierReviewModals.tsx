import { useForm, useWatch } from "react-hook-form";
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
  rejectCaseRequestSchema,
  requestSupplementRequestSchema,
  reviewFlagRequestSchema,
  supplementPartSchema,
  supplementPartLabels,
  blockerLabels,
  flagLabels,
  type supplementPartSchema as supplementPartSchemaType,
} from "../model/verifierReview.schema";
import { getVerifierActions } from "../model/verifierActions";
import {
  useApproveCase,
  useRejectCase,
  useRequestSupplement,
  useReviewFlag,
  verifierKeys,
} from "../model/useVerifierReview";
import type { verifierCaseDetailSchema } from "../model/verifierReview.schema";

type Detail = z.infer<typeof verifierCaseDetailSchema>;
type SupplementPart = z.infer<typeof supplementPartSchemaType>;

const allSupplementParts: SupplementPart[] = supplementPartSchema.options;
const confirmation = z.boolean().refine(Boolean, "Cần xác nhận trước khi tiếp tục.");

function inferSuggestedParts(reasonText: string): SupplementPart[] {
  if (!reasonText) return [];
  const lower = reasonText.toLowerCase();
  const suggested: SupplementPart[] = [];
  if (lower.includes("cccd") || lower.includes("căn cước") || lower.includes("định danh")) {
    suggested.push("OWNER_CITIZEN_ID");
  }
  if (lower.includes("họ tên") || lower.includes("tên chủ")) {
    suggested.push("OWNER_FULL_NAME");
  }
  if (
    lower.includes("ngày mất") ||
    lower.includes("thời điểm tử vong") ||
    lower.includes("ngày qua đời")
  ) {
    suggested.push("DATE_OF_DEATH");
  }
  if (
    lower.includes("số giấy") ||
    lower.includes("số trích lục") ||
    lower.includes("số chứng tử")
  ) {
    suggested.push("CERTIFICATE_NUMBER");
  }
  if (lower.includes("ngày cấp")) {
    suggested.push("ISSUED_ON");
  }
  if (lower.includes("nơi cấp") || lower.includes("cơ quan cấp") || lower.includes("ubnd")) {
    suggested.push("ISSUED_BY");
  }
  if (
    lower.includes("giấy tờ") ||
    lower.includes("trang") ||
    lower.includes("ảnh") ||
    lower.includes("tài liệu") ||
    lower.includes("đính kèm") ||
    lower.includes("mờ")
  ) {
    suggested.push("FILES");
  }
  return suggested;
}

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
  if (modal === "reject" && actions.canReject) {
    return (
      <RejectModal
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

function RequestSupplementModal({
  caseId,
  detail,
  initialReason = "",
  onClose,
}: {
  caseId: string;
  detail: Detail;
  initialReason?: string;
  onClose: () => void;
}) {
  const action = usePrivateAction();
  const request = useRequestSupplement();
  const defaultParts = inferSuggestedParts(initialReason);
  const form = useForm<{
    etag: string;
    reason: string;
    parts: SupplementPart[];
    confirm: boolean;
  }>({
    resolver: zodResolver(
      requestSupplementRequestSchema.omit({ requestedParts: true }).extend({
        parts: z.array(supplementPartSchema).min(1, "Chọn phần cần bổ sung."),
        confirm: confirmation,
      }),
    ),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      etag: detail.etag,
      reason: initialReason,
      parts: defaultParts,
      confirm: false,
    },
  });
  const parts = useWatch({ control: form.control, name: "parts" }) ?? [];
  const confirm = useWatch({ control: form.control, name: "confirm" });
  const onSubmit = form.handleSubmit((values) => {
    void action.execute(
      () =>
        request(
          caseId,
          requestSupplementRequestSchema.parse({
            etag: values.etag,
            reason: values.reason,
            requestedParts: values.parts,
          }),
        ),
      () => onClose(),
    );
  });
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl bg-[#FAFAF6] p-6 sm:max-w-[620px] max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yêu cầu bổ sung</DialogTitle>
          <DialogDescription>
            Người thực hiện sẽ nhận được thông báo với lý do và các phần cần bổ sung.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-heritage-primary">
              Lý do <span aria-hidden="true">*</span>
            </span>
            <Textarea
              {...form.register("reason")}
              maxLength={1000}
              placeholder="Nêu rõ cần bổ sung điều gì"
              aria-invalid={Boolean(form.formState.errors.reason)}
              className="mt-1 min-h-24 max-h-36"
            />
            {form.formState.errors.reason && (
              <span className="text-xs text-destructive">
                {form.formState.errors.reason.message}
              </span>
            )}
          </label>
          <fieldset className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <legend className="text-xs font-semibold uppercase tracking-wider text-heritage-muted">
                Phần cần bổ sung <span aria-hidden="true">*</span>
              </legend>
              {parts.length > 0 && (
                <span className="text-xs font-medium text-heritage-gold">
                  Đã chọn {parts.length}/{allSupplementParts.length}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allSupplementParts.map((part) => (
                <CustomCheckbox
                  key={part}
                  className="min-h-11 w-full items-center! text-xs py-2 px-3"
                  label={supplementPartLabels[part]}
                  value={part}
                  checked={parts.includes(part)}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...parts, part]
                      : parts.filter((p) => p !== part);
                    form.setValue("parts", next, { shouldValidate: true });
                  }}
                />
              ))}
            </div>
            {form.formState.errors.parts && (
              <span className="text-xs text-destructive">
                {form.formState.errors.parts.message as string}
              </span>
            )}
          </fieldset>
          <CustomCheckbox
            className="min-h-11 w-full items-center!"
            label="Tôi xác nhận yêu cầu này sẽ được gửi cho Người thực hiện."
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
              disabled={action.pending || !confirm || parts.length === 0}
            >
              {action.pending ? "Đang gửi…" : "Gửi yêu cầu"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ApproveModal({
  caseId,
  detail,
  initialReason = "",
  onClose,
}: {
  caseId: string;
  detail: Detail;
  initialReason?: string;
  onClose: () => void;
}) {
  const action = usePrivateAction();
  const approve = useApproveCase();
  const form = useForm<{ etag: string; reason: string; confirm: boolean; legalConfirm: boolean }>({
    resolver: zodResolver(
      approveCaseRequestSchema.extend({ confirm: confirmation, legalConfirm: confirmation }),
    ),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      etag: detail.etag,
      reason: initialReason,
      confirm: false,
      legalConfirm: false,
    },
  });
  const blockers = detail.approveBlockers;
  const confirm = useWatch({ control: form.control, name: "confirm" });
  const legalConfirm = useWatch({ control: form.control, name: "legalConfirm" });
  const onSubmit = form.handleSubmit((values) => {
    void action.execute(
      () =>
        approve(
          caseId,
          approveCaseRequestSchema.parse({ etag: values.etag, reason: values.reason }),
        ),
      () => onClose(),
    );
  });
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl bg-[#FAFAF6] p-6 sm:max-w-[560px] max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Duyệt hồ sơ và mở bàn giao</DialogTitle>
          <DialogDescription>
            Khi duyệt, hệ thống sẽ tạo lượt bàn giao và gửi lời mời cho người nhận.
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
          <label className="block text-sm">
            Lý do duyệt
            <Textarea
              {...form.register("reason")}
              maxLength={1000}
              aria-invalid={Boolean(form.formState.errors.reason)}
              className="mt-1 min-h-24 max-h-36"
            />
            {form.formState.errors.reason && (
              <span className="text-xs text-destructive">
                {form.formState.errors.reason.message}
              </span>
            )}
          </label>
          <CustomCheckbox
            id="verifier-approve-confirm"
            className="min-h-11 w-full items-center!"
            label="Tôi xác nhận các thông tin đã được đối soát và duyệt hồ sơ này."
            {...form.register("confirm")}
          />
          <CustomCheckbox
            id="verifier-approve-legal"
            className="min-h-11 w-full items-center!"
            label="Tôi đã kiểm tra phạm vi bàn giao và người nhận."
            {...form.register("legalConfirm")}
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
              disabled={action.pending || !detail.canApprove || !confirm || !legalConfirm}
            >
              {action.pending ? "Đang duyệt…" : "Duyệt"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RejectModal({
  caseId,
  detail,
  initialReason = "",
  onClose,
}: {
  caseId: string;
  detail: Detail;
  initialReason?: string;
  onClose: () => void;
}) {
  const action = usePrivateAction();
  const reject = useRejectCase();
  const form = useForm<{ etag: string; reason: string; confirm: boolean }>({
    resolver: zodResolver(rejectCaseRequestSchema.extend({ confirm: confirmation })),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { etag: detail.etag, reason: initialReason, confirm: false },
  });
  const reason = useWatch({ control: form.control, name: "reason" }) ?? "";
  const confirm = useWatch({ control: form.control, name: "confirm" });
  const onSubmit = form.handleSubmit((values) => {
    void action.execute(
      () =>
        reject(caseId, rejectCaseRequestSchema.parse({ etag: values.etag, reason: values.reason })),
      () => onClose(),
    );
  });
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl bg-[#FAFAF6] p-6 sm:max-w-[560px] max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Từ chối hồ sơ</DialogTitle>
          <DialogDescription>
            Hồ sơ sẽ đóng và kế hoạch về trạng thái trước khi gửi; Executor sẽ thấy lý do.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm">
            Lý do từ chối
            <Textarea
              {...form.register("reason")}
              maxLength={1000}
              aria-invalid={Boolean(form.formState.errors.reason)}
              className="mt-1 min-h-24 max-h-36"
            />
            {form.formState.errors.reason && (
              <span className="text-xs text-destructive">
                {form.formState.errors.reason.message}
              </span>
            )}
          </label>
          <CustomCheckbox
            className="min-h-11 w-full items-center!"
            label="Tôi xác nhận từ chối hồ sơ này."
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
              className={
                "inline-flex min-h-11 items-center justify-center rounded-xl bg-[#A32119] px-6 text-sm font-semibold text-white hover:bg-[#8A1B14] disabled:pointer-events-none disabled:opacity-50"
              }
              disabled={action.pending || !confirm || !reason.trim()}
            >
              {action.pending ? "Đang từ chối…" : "Từ chối"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
