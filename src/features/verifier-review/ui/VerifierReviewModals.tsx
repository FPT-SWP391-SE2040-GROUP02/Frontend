import { useForm, useWatch } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
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

const supplementPartLabels: Record<SupplementPart, string> = {
  OWNER_FULL_NAME: "Họ tên Owner",
  OWNER_CITIZEN_ID: "Số CCCD",
  DATE_OF_DEATH: "Ngày mất",
  CERTIFICATE_NUMBER: "Số giấy chứng tử",
  ISSUED_ON: "Ngày cấp",
  ISSUED_BY: "Nơi cấp",
  FILES: "Trang giấy tờ",
};
const allSupplementParts: SupplementPart[] = supplementPartSchema.options;
const confirmation = z.boolean().refine(Boolean, "Cần xác nhận trước khi tiếp tục.");

function ReviewError({ error, onClose }: { error: string; onClose: () => void }) {
  const client = useQueryClient();
  return (
    <div role="alert" className="space-y-2 text-sm text-destructive">
      <p>{error}</p>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          void client.invalidateQueries({ queryKey: verifierKeys.all });
          onClose();
        }}
      >
        Tải lại hồ sơ
      </Button>
    </div>
  );
}

/** Các modal cho Verifier: review flag, request supplement, approve, reject. Mỗi modal dùng confirmation mặc định false. */
export function VerifierReviewModals({ caseId, detail }: { caseId: string; detail: Detail }) {
  const [params, setParams] = useSearchParams();
  const modal = params.get("modal");
  const flagId = params.get("flagId");
  const close = () => {
    const next = new URLSearchParams(params);
    next.delete("modal");
    next.delete("flagId");
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
        key={`${caseId}:${detail.etag}`}
        caseId={caseId}
        detail={detail}
        onClose={close}
      />
    );
  }
  if (modal === "approve" && actions.canOpenApprove) {
    return (
      <ApproveModal
        key={`${caseId}:${detail.etag}`}
        caseId={caseId}
        detail={detail}
        onClose={close}
      />
    );
  }
  if (modal === "reject" && actions.canReject) {
    return (
      <RejectModal
        key={`${caseId}:${detail.etag}`}
        caseId={caseId}
        detail={detail}
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xem xét cờ</DialogTitle>
          <DialogDescription>
            {flag
              ? `${flagLabels[flag.kind]}: ${flag.detail}`
              : "Cờ không tìm thấy trong hồ sơ hiện tại."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm">
            Ghi chú xem xét
            <Textarea
              {...form.register("note")}
              maxLength={1000}
              aria-invalid={Boolean(form.formState.errors.note)}
              className="mt-1 min-h-24"
            />
            {form.formState.errors.note && (
              <span className="text-xs text-destructive">{form.formState.errors.note.message}</span>
            )}
          </label>
          <CustomCheckbox
            className="min-h-11 w-full items-center!"
            label="Tôi đã xem xét cờ này."
            {...form.register("confirm")}
          />
          {action.error && <ReviewError error={action.error} onClose={onClose} />}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={action.pending}>
              Hủy
            </Button>
            <Button type="submit" disabled={action.pending || !confirmed}>
              {action.pending ? "Đang ghi…" : "Ghi nhận"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RequestSupplementModal({
  caseId,
  detail,
  onClose,
}: {
  caseId: string;
  detail: Detail;
  onClose: () => void;
}) {
  const action = usePrivateAction();
  const request = useRequestSupplement();
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
    defaultValues: { etag: detail.etag, reason: "", parts: [], confirm: false },
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yêu cầu bổ sung</DialogTitle>
          <DialogDescription>
            Executor sẽ nhận được thông báo với lý do và các phần cần bổ sung.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm">
            Lý do
            <Textarea
              {...form.register("reason")}
              maxLength={1000}
              aria-invalid={Boolean(form.formState.errors.reason)}
              className="mt-1 min-h-24"
            />
            {form.formState.errors.reason && (
              <span className="text-xs text-destructive">
                {form.formState.errors.reason.message}
              </span>
            )}
          </label>
          <fieldset className="space-y-2 text-sm">
            <legend className="text-xs text-heritage-muted">Phần cần bổ sung</legend>
            {allSupplementParts.map((part) => (
              <CustomCheckbox
                key={part}
                className="min-h-11 w-full items-center!"
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
            {form.formState.errors.parts && (
              <span className="text-xs text-destructive">
                {form.formState.errors.parts.message as string}
              </span>
            )}
          </fieldset>
          <CustomCheckbox
            className="min-h-11 w-full items-center!"
            label="Tôi xác nhận yêu cầu này sẽ được gửi cho Executor."
            {...form.register("confirm")}
          />
          {action.error && <ReviewError error={action.error} onClose={onClose} />}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={action.pending}>
              Hủy
            </Button>
            <Button type="submit" disabled={action.pending || !confirm || parts.length === 0}>
              {action.pending ? "Đang gửi…" : "Gửi yêu cầu"}
            </Button>
          </DialogFooter>
        </form>
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
    defaultValues: { etag: detail.etag, reason: "", confirm: false, legalConfirm: false },
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
      <DialogContent>
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
              className="mt-1 min-h-24"
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
            <Button type="button" variant="outline" onClick={onClose} disabled={action.pending}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={action.pending || !detail.canApprove || !confirm || !legalConfirm}
            >
              {action.pending ? "Đang duyệt…" : "Duyệt"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RejectModal({
  caseId,
  detail,
  onClose,
}: {
  caseId: string;
  detail: Detail;
  onClose: () => void;
}) {
  const action = usePrivateAction();
  const reject = useRejectCase();
  const form = useForm<{ etag: string; reason: string; confirm: boolean }>({
    resolver: zodResolver(rejectCaseRequestSchema.extend({ confirm: confirmation })),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { etag: detail.etag, reason: "", confirm: false },
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
      <DialogContent>
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
              className="mt-1 min-h-24"
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
            <Button type="button" variant="outline" onClick={onClose} disabled={action.pending}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={action.pending || !confirm || !reason.trim()}
            >
              {action.pending ? "Đang từ chối…" : "Từ chối"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
