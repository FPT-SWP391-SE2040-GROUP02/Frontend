import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { HeartPulse, ShieldAlert } from "lucide-react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { CustomCheckbox } from "@/shared/ui/CustomCheckbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { ownerObjectionService } from "../api/ownerObjectionService";
import { ownerDeathCaseKeys, useOwnerDeathCase } from "../model/useOwnerDeathCase";
import { formatDateTime } from "@/shared/lib/dateFormat";
import {
  conclusionLabels,
  validateSelfie,
  type OwnerDeathCase,
  type OwnerObjection,
} from "../model/ownerObjection.schema";

/** Trạng thái hồ sơ mà Owner cần được cảnh báo; DRAFT là Executor chưa gửi nên chưa hiện. */
const ACTIVE_CASE_STATUSES = new Set([
  "UNDER_REVIEW",
  "SUPPLEMENT_REQUIRED",
  "APPROVED_FOR_HANDOVER",
  "SUSPENDED",
]);

const caseStatusLabels: Record<string, string> = {
  UNDER_REVIEW: "Đang được xét",
  SUPPLEMENT_REQUIRED: "Đang chờ bổ sung",
  APPROVED_FOR_HANDOVER: "Đã duyệt, đang bàn giao",
  SUSPENDED: "Tạm dừng do bạn báo còn sống",
  REJECTED: "Đã bị từ chối",
  DRAFT: "Bản nháp",
};

const formatDate = (value: string | null | undefined) => (value ? formatDateTime(value) : "—");

/**
 * Cảnh báo "Có hồ sơ chứng tử" và luồng "Tôi còn sống" của Owner (BE mục 6.14).
 * Không optimistic: chỉ hiện trạng thái mới sau response của BE.
 */
export function OwnerDeathCasePanel({ vaultId, enabled }: { vaultId: string; enabled: boolean }) {
  const query = useOwnerDeathCase(vaultId, enabled);
  if (!enabled || !vaultId || query.isPending) return null;
  if (query.isError)
    return (
      <div role="alert" className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm text-red-800">
          Không kiểm tra được hồ sơ chứng tử của kho. Vui lòng thử lại.
        </p>
        <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>
          Thử lại
        </Button>
      </div>
    );
  const record = query.data;
  if (!record) return null;
  if (!record.objection && !ACTIVE_CASE_STATUSES.has(record.status)) return null;
  return <CasePanel vaultId={vaultId} record={record} />;
}

function CasePanel({ vaultId, record }: { vaultId: string; record: OwnerDeathCase }) {
  const objection = record.objection;
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <section
      aria-labelledby="owner-death-case-title"
      className="space-y-4 rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-800" aria-hidden="true" />
        <div className="min-w-0">
          <h2 id="owner-death-case-title" className="text-lg font-semibold text-amber-900">
            Có hồ sơ chứng tử trên kho của bạn
          </h2>
          <p className="mt-1 text-sm text-amber-900">
            Mã hồ sơ {record.caseCode} · {caseStatusLabels[record.status] ?? record.status}
            {record.objectionEndsAt && <> · Hạn phản đối {formatDate(record.objectionEndsAt)}</>}
          </p>
        </div>
      </div>
      {!objection && (
        <div className="space-y-3">
          <p className="text-sm text-amber-900">
            Nếu bạn vẫn còn sống, hãy báo ngay. Hồ sơ, kế hoạch bàn giao và quyền tải sẽ bị chặn
            ngay lập tức.
          </p>
          <Button type="button" onClick={() => setConfirmOpen(true)}>
            <HeartPulse className="size-4" aria-hidden="true" />
            Tôi còn sống
          </Button>
        </div>
      )}
      {objection && <ObjectionState vaultId={vaultId} objection={objection} />}
      {confirmOpen && <ReportDialog vaultId={vaultId} onClose={() => setConfirmOpen(false)} />}
    </section>
  );
}

function ReportDialog({ vaultId, onClose }: { vaultId: string; onClose: () => void }) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const [confirmed, setConfirmed] = useState(false);
  const submit = () =>
    void action.execute(
      () => ownerObjectionService.report(vaultId),
      (result) => {
        client.setQueryData(ownerDeathCaseKeys.vault(vaultId), result);
        onClose();
      },
    );
  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận bạn còn sống</DialogTitle>
          <DialogDescription>
            Hồ sơ chứng tử, kế hoạch bàn giao và mọi quyền tải sẽ bị chặn ngay. Bạn có 7 ngày để gửi
            ảnh selfie xác minh; Verifier sẽ kết luận sau đó.
          </DialogDescription>
        </DialogHeader>
        <CustomCheckbox
          className="min-h-11 w-full items-center!"
          label="Tôi xác nhận mình vẫn còn sống và muốn chặn hồ sơ này."
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
        />
        {action.error && (
          <p role="alert" className="text-sm text-destructive">
            {action.error}
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={action.pending}>
            Hủy
          </Button>
          <Button type="button" onClick={submit} disabled={!confirmed || action.pending}>
            {action.pending ? "Đang gửi…" : "Xác nhận còn sống"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ObjectionState({ vaultId, objection }: { vaultId: string; objection: OwnerObjection }) {
  const rejected = objection.conclusion === "OBJECTION_REJECTED";
  const confirmedAlive = objection.conclusion === "ALIVE_CONFIRMED";
  // Sau khi bị bác, selfie khớp mới là bằng chứng mở lại lời báo (ALIVE-09).
  const canSubmitSelfie =
    !confirmedAlive &&
    !objection.selfiePassed &&
    objection.selfieAttemptsRemaining > 0 &&
    (objection.selfieWindowOpen || rejected);
  // BR-76 (c): Verifier ghi "chưa đủ bằng chứng" là yêu cầu chụp selfie mới; BE đã bỏ kết quả cũ và mở hạn mới.
  const retakeRequested =
    objection.conclusion === null &&
    objection.insufficientEvidenceCount > 0 &&
    !objection.selfiePassed;
  return (
    <div className="space-y-3 text-sm text-amber-900">
      <p className="font-medium">
        {confirmedAlive
          ? "Verifier đã xác nhận bạn còn sống. Hồ sơ đã đóng và kế hoạch hoạt động lại."
          : rejected
            ? "Lời báo còn sống đã bị bác. Hồ sơ trở lại trạng thái trước khi bạn báo; kế hoạch không còn bị chặn."
            : "Lời báo còn sống đã được ghi nhận. Hồ sơ và kế hoạch đang bị chặn."}
      </p>
      <dl className="grid gap-3 sm:grid-cols-2">
        <Info label="Báo lần đầu" value={formatDate(objection.firstReportedAt)} />
        <Info label="Số lần báo" value={String(objection.reportCount)} />
        {!confirmedAlive && !rejected && (
          <Info label="Hạn gửi selfie" value={formatDate(objection.selfieDeadlineAt)} />
        )}
        {!confirmedAlive && !objection.selfiePassed && (
          <Info
            label="Lượt thử còn lại (24 giờ)"
            value={String(objection.selfieAttemptsRemaining)}
          />
        )}
        {objection.verifierDueAt && !confirmedAlive && !rejected && (
          <Info label="Hạn Verifier kết luận" value={formatDate(objection.verifierDueAt)} />
        )}
      </dl>
      {retakeRequested && (
        <div role="alert" className="rounded-lg border border-amber-400 bg-white p-3">
          <p className="font-semibold">
            Verifier cần thêm bằng chứng: hãy chụp selfie trực tiếp mới.
          </p>
          <p className="mt-1">
            Ảnh selfie trước không còn được tính. Gửi ảnh mới trước{" "}
            {formatDate(objection.selfieDeadlineAt)}; quá hạn thì Verifier có thể từ chối báo tử.
          </p>
          {objection.conclusionReason && (
            <p className="mt-1 break-words">Lý do: {objection.conclusionReason}</p>
          )}
        </div>
      )}
      {objection.selfiePassed && !confirmedAlive && (
        <p role="status" className="rounded-lg bg-emerald-50 p-3 text-emerald-800">
          Ảnh selfie đã khớp mẫu khuôn mặt ({formatDate(objection.selfiePassedAt)}). Đang chờ
          Verifier kết luận.
        </p>
      )}
      {objection.conclusion && (
        <div role="status" className="rounded-lg border border-amber-300 bg-white p-3">
          <p className="font-semibold">{conclusionLabels[objection.conclusion]}</p>
          {objection.conclusionReason && (
            <p className="mt-1 break-words">Lý do: {objection.conclusionReason}</p>
          )}
        </div>
      )}
      {!confirmedAlive && !objection.selfiePassed && !canSubmitSelfie && (
        <p role="status">
          {objection.selfieAttemptsRemaining === 0
            ? "Bạn đã hết lượt thử selfie trong 24 giờ qua. Hãy thử lại sau."
            : "Đã hết hạn 7 ngày gửi selfie. Verifier sẽ kết luận dựa trên hồ sơ hiện có."}
        </p>
      )}
      {canSubmitSelfie && <SelfieForm vaultId={vaultId} reopen={rejected} />}
    </div>
  );
}

function SelfieForm({ vaultId, reopen }: { vaultId: string; reopen: boolean }) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [notice, setNotice] = useState("");
  const submit = () => {
    const problem = validateSelfie(file);
    setFileError(problem);
    if (problem || !file) return;
    setNotice("");
    void action.execute(
      () => ownerObjectionService.submitSelfie(vaultId, file),
      (result) => {
        client.setQueryData(ownerDeathCaseKeys.vault(vaultId), result);
        setFile(null);
        if (input.current) input.current.value = "";
        if (!result.objection?.selfiePassed)
          setNotice(
            `Ảnh chưa khớp mẫu khuôn mặt. Còn ${result.objection?.selfieAttemptsRemaining ?? 0} lượt thử trong 24 giờ.`,
          );
      },
    );
  };
  return (
    <div className="space-y-2 rounded-lg border border-amber-300 bg-white p-4">
      <label className="block text-sm font-semibold" htmlFor="owner-objection-selfie">
        {reopen ? "Gửi bằng chứng mới (selfie)" : "Gửi ảnh selfie xác minh"}
      </label>
      <p className="text-xs text-heritage-muted">
        Ảnh JPEG/PNG chụp trực tiếp, một khuôn mặt rõ nét, tối đa 8 MiB.
      </p>
      <Input
        ref={input}
        id="owner-objection-selfie"
        type="file"
        accept="image/jpeg,image/png"
        capture="user"
        aria-invalid={Boolean(fileError)}
        onChange={(event) => {
          setFile(event.target.files?.[0] ?? null);
          setFileError("");
        }}
      />
      {fileError && <p className="text-xs text-destructive">{fileError}</p>}
      {notice && (
        <p role="status" className="text-sm text-amber-800">
          {notice}
        </p>
      )}
      {action.error && (
        <p role="alert" className="text-sm text-destructive">
          {action.error}
        </p>
      )}
      <Button type="button" onClick={submit} disabled={action.pending || !file}>
        {action.pending ? "Đang so khớp…" : "Gửi selfie"}
      </Button>
    </div>
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
