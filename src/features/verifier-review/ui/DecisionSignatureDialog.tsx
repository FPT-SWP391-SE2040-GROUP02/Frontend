import type { z } from "zod";
import { formatDateTime } from "@/shared/lib/dateFormat";
import { buttonStyles, Chip, type Tone } from "@/shared/ui/heritageKit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { useDecisionSignature } from "../model/useVerifierReview";
import {
  decisionSignatureLabels,
  hasDecisionSignatureLabel,
  type LabelledSignatureStatus,
  type decisionSignatureSchema,
  type decisionSignatureStatusSchema,
} from "../model/verifierReview.schema";

type SignatureStatus = z.infer<typeof decisionSignatureStatusSchema>;
type DecisionSignature = z.infer<typeof decisionSignatureSchema>;

const statusTones: Record<LabelledSignatureStatus, Tone> = {
  VALID: "success",
  INVALID: "danger",
  NOT_SIGNED: "neutral",
};

/** Số ký tự đầu của chữ ký Base64 hiện trên màn; bản đầy đủ nằm ở `title`. */
const SIGNATURE_PREVIEW_LENGTH = 24;

/** Chữ ký Base64 rút gọn để hiện trên màn. */
function signaturePreview(signature: string | null): string {
  if (signature === null) return "—";
  return signature.length > SIGNATURE_PREVIEW_LENGTH
    ? `${signature.slice(0, SIGNATURE_PREVIEW_LENGTH)}…`
    : signature;
}

/** "Duyệt (bản 2)" / "Từ chối (bản 2)"; thiếu loại quyết định thì "—". */
function decisionText(signature: DecisionSignature): string {
  if (signature.decisionKind === null) return "—";
  const kind = signature.decisionKind === "APPROVED" ? "Duyệt" : "Từ chối";
  return signature.versionNo === null ? kind : `${kind} (bản ${signature.versionNo})`;
}

/**
 * Nhãn trạng thái chữ ký số của quyết định cuối. Không có nhãn khi chưa có quyết định cuối hoặc BE cũ không trả
 * trường này. INVALID là cảnh báo nên dùng role="alert".
 */
export function DecisionSignatureStatusLabel({ status }: { status: SignatureStatus | undefined }) {
  if (!hasDecisionSignatureLabel(status)) return null;
  return (
    <span role={status === "INVALID" ? "alert" : undefined}>
      <Chip tone={statusTones[status]}>{decisionSignatureLabels[status]}</Chip>
    </span>
  );
}

/**
 * Dialog "Xem chữ ký số": gọi GET .../decision-signature chỉ khi mở; "Kiểm tra lại" gọi lại API (BE kiểm lại chữ ký,
 * không ghi gì). 404 = BE cũ chưa có API hoặc hồ sơ không còn được giao.
 */
export function DecisionSignatureDialog({
  caseId,
  open,
  onClose,
}: {
  caseId: string;
  open: boolean;
  onClose: () => void;
}) {
  const query = useDecisionSignature(caseId, open);
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="rounded-2xl bg-[#FAFAF6] p-6 sm:max-w-[560px] max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chữ ký số của quyết định</DialogTitle>
          <DialogDescription>
            Chữ ký số chứng minh đúng Verifier này đã ký và dữ liệu quyết định chưa bị sửa sau khi
            ký. Đây là chữ ký số nội bộ hệ thống.
          </DialogDescription>
        </DialogHeader>
        <SignatureBody
          pending={query.isPending}
          failed={query.isError}
          signature={query.data}
          fetching={query.isFetching}
        />
        <DialogFooter>
          <button
            type="button"
            className={buttonStyles.outline}
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {query.isFetching ? "Đang kiểm tra…" : "Kiểm tra lại"}
          </button>
          <button type="button" className={buttonStyles.dark} onClick={onClose}>
            Đóng
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SignatureBody({
  pending,
  failed,
  signature,
  fetching,
}: {
  pending: boolean;
  failed: boolean;
  signature: DecisionSignature | null | undefined;
  fetching: boolean;
}) {
  if (pending)
    return (
      <p role="status" className="text-sm text-heritage-muted">
        Đang kiểm tra chữ ký số…
      </p>
    );
  if (failed)
    return (
      <p role="alert" className="text-sm text-destructive">
        Không kiểm tra được chữ ký số. Bấm "Kiểm tra lại" để thử lại.
      </p>
    );
  if (signature === null || signature === undefined)
    return (
      <p role="status" className="rounded-xl bg-[#F1E6CC] px-4 py-3 text-sm text-[#5A4318]">
        Máy chủ chưa hỗ trợ xem chữ ký số, hoặc hồ sơ không còn được giao cho bạn.
      </p>
    );
  if (!hasDecisionSignatureLabel(signature.status))
    return (
      <p role="status" className="text-sm text-heritage-muted">
        Hồ sơ chưa có quyết định cuối nên chưa có chữ ký số.
      </p>
    );
  return (
    <div className="space-y-4" aria-busy={fetching}>
      <p role="status">
        <Chip tone={statusTones[signature.status]}>
          {decisionSignatureLabels[signature.status]}
        </Chip>
      </p>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Item label="Quyết định" value={decisionText(signature)} />
        <Item label="Người ký" value={signature.signedByFullName ?? "—"} />
        <Item
          label="Thời điểm"
          value={signature.decidedAt === null ? "—" : formatDateTime(signature.decidedAt)}
        />
        <Item label="Thuật toán" value={signature.algorithm ?? "—"} />
        <Item label="Dấu vân tay khóa" value={signature.keyFingerprint ?? "—"} mono />
        <div>
          <dt className="text-xs text-heritage-muted">Chữ ký (Base64)</dt>
          <dd
            className="mt-1 break-all font-mono text-sm"
            title={signature.signatureBase64 ?? undefined}
          >
            {signaturePreview(signature.signatureBase64)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function Item({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-heritage-muted">{label}</dt>
      <dd className={`mt-1 break-words font-semibold ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
