import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { HeartPulse } from "lucide-react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { Textarea } from "@/shared/ui/textarea";
import { CustomCheckbox } from "@/shared/ui/CustomCheckbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { formatDateTime } from "@/shared/lib/dateFormat";
import {
  allowedObjectionConclusions,
  concludeObjectionRequestSchema,
  objectionConclusionLabels,
} from "../model/verifierReview.schema";
import { useConcludeObjection, useVerifierObjection } from "../model/useVerifierReview";

const formatDate = (value: string | null) => (value ? formatDateTime(value) : "—");

/**
 * Khối "Báo còn sống" đặt trên phần xét giấy tờ để Verifier không bỏ sót.
 * `canConclude=false` (VERIFIER_CONFLICT) chỉ cho xem.
 */
export function VerifierObjectionBlock({
  caseId,
  enabled,
  canConclude,
}: {
  caseId: string;
  enabled: boolean;
  canConclude: boolean;
}) {
  const query = useVerifierObjection(caseId, enabled);
  const [open, setOpen] = useState(false);
  if (!enabled || query.isPending) return null;
  if (query.isError)
    return (
      <div role="alert" className="space-y-3 rounded-2xl bg-[#F8E1DE] p-5">
        <p className="text-sm text-[#7A1A14]">Không đọc được lời báo còn sống của hồ sơ này.</p>
        <button
          type="button"
          className={buttonStyles.outline}
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
        >
          Thử lại
        </button>
      </div>
    );
  const objection = query.data;
  if (!objection) return null;
  const options = allowedObjectionConclusions(objection);
  return (
    <section
      aria-label="Báo còn sống"
      className="space-y-3 rounded-2xl border border-[#E6C98B] bg-[#F1E6CC] p-6 text-sm text-[#5A4318]"
    >
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <HeartPulse className="size-5" aria-hidden="true" />
        Owner báo còn sống
      </h3>
      <dl className="grid gap-3 sm:grid-cols-2">
        <Info label="Báo lần đầu" value={formatDate(objection.firstReportedAt)} />
        <Info label="Số lần báo" value={String(objection.reportCount)} />
        <Info label="Hạn selfie của Owner" value={formatDate(objection.selfieDeadlineAt)} />
        <Info
          label="Selfie"
          value={
            objection.selfiePassed
              ? `Đạt lúc ${formatDate(objection.selfiePassedAt)}`
              : objection.selfieWindowOpen
                ? `Chưa đạt · còn ${objection.selfieAttemptsRemaining} lượt thử`
                : "Chưa đạt · đã hết hạn 7 ngày"
          }
        />
        <Info label="Hạn bạn kết luận" value={formatDate(objection.verifierDueAt)} />
        {objection.insufficientEvidenceCount > 0 && (
          <Info
            label="Số lần chưa đủ bằng chứng"
            value={String(objection.insufficientEvidenceCount)}
          />
        )}
      </dl>
      {objection.conclusion && (
        <div role="status" className="rounded-lg border border-amber-300 bg-white p-3">
          <p className="font-semibold">
            Kết luận gần nhất: {objectionConclusionLabels[objection.conclusion]}
          </p>
          {objection.conclusionReason && (
            <p className="mt-1 break-words">Lý do: {objection.conclusionReason}</p>
          )}
        </div>
      )}
      {!objection.selfiePassed && objection.selfieWindowOpen && (
        <p role="status">
          Chưa thể xác nhận còn sống: cần selfie đạt hoặc đợi hết hạn 7 ngày của Owner.
        </p>
      )}
      {objection.selfiePassed && (
        <p role="status">Selfie đã khớp nên bạn không thể bác lời báo (ALIVE-05).</p>
      )}
      {canConclude && options.length > 0 && (
        <button type="button" className={buttonStyles.dark} onClick={() => setOpen(true)}>
          Kết luận lời báo
        </button>
      )}
      {open && <ConcludeDialog caseId={caseId} options={options} onClose={() => setOpen(false)} />}
    </section>
  );
}

function ConcludeDialog({
  caseId,
  options,
  onClose,
}: {
  caseId: string;
  options: z.infer<typeof concludeObjectionRequestSchema>["conclusion"][];
  onClose: () => void;
}) {
  const action = usePrivateAction();
  const conclude = useConcludeObjection();
  // Không chọn sẵn kết luận nào: quyết định của Verifier phải là lựa chọn chủ động.
  const form = useForm<{ conclusion: string; reason: string; confirm: boolean }>({
    resolver: zodResolver(
      concludeObjectionRequestSchema.extend({
        // Nhóm radio chưa chọn gì thì react-hook-form đọc ra null, nên cần thông báo tiếng Việt cho cả kiểu null.
        conclusion: z
          .string({ invalid_type_error: "Chọn một kết luận." })
          .min(1, "Chọn một kết luận.")
          .pipe(concludeObjectionRequestSchema.shape.conclusion),
        confirm: z.boolean().refine(Boolean, "Cần xác nhận trước khi tiếp tục."),
      }),
    ),
    // onTouched: kiểm tra lần đầu khi rời ô, sau đó kiểm tra lại mỗi lần đổi để dòng lỗi cũ biến mất khi Verifier đã chọn.
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { conclusion: "", reason: "", confirm: false },
  });
  const confirmed = useWatch({ control: form.control, name: "confirm" });
  const onSubmit = form.handleSubmit((values) => {
    void action.execute(
      () =>
        conclude(
          caseId,
          concludeObjectionRequestSchema.parse({
            conclusion: values.conclusion,
            reason: values.reason,
          }),
        ),
      () => onClose(),
    );
  });
  return (
    <Dialog open onOpenChange={(next) => !next && !action.pending && onClose()}>
      <DialogContent className="rounded-2xl bg-[#FAFAF6] p-6 sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Kết luận lời báo còn sống</DialogTitle>
          <DialogDescription>
            Kết luận sẽ ảnh hưởng đến hồ sơ, kế hoạch và quyền tải của kho. Chỉ chọn khi đã xem đủ
            bằng chứng.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Kết luận</legend>
            {options.map((option) => (
              <label
                key={option}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[#BDB8A6] bg-white px-4 py-3 text-sm font-medium has-[:checked]:border-[#0A281E] has-[:checked]:bg-[#F4F1E6]"
              >
                <input type="radio" value={option} {...form.register("conclusion")} />
                {objectionConclusionLabels[option]}
              </label>
            ))}
            {form.formState.errors.conclusion && (
              <span className="text-xs text-destructive">
                {form.formState.errors.conclusion.message}
              </span>
            )}
          </fieldset>
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
          <CustomCheckbox
            className="min-h-11 w-full items-center!"
            label="Tôi xác nhận kết luận này."
            {...form.register("confirm")}
          />
          {action.error && (
            <p role="alert" className="text-sm text-destructive">
              {action.error}
            </p>
          )}
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
              {action.pending ? "Đang ghi…" : "Ghi kết luận"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-amber-800">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
