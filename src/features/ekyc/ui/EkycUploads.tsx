import { useState } from "react";
import type { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ekycDocumentSchema, ekycPurposeSchema, ekycStatusSchema } from "../model/ekyc.schema";
import { ekycService } from "../api/ekycService";
import { LivenessPanel } from "./LivenessPanel";
import { EkycReviewForm } from "./EkycReviewForm";

type Purpose = z.infer<typeof ekycPurposeSchema>;
type Document = z.infer<typeof ekycDocumentSchema>;
type Status = z.infer<typeof ekycStatusSchema>;

type Step = "consent" | "front" | "back" | "liveness" | "done";

function validateImage(file: File | null): string {
  if (!file) return "Chọn ảnh JPEG/PNG không rỗng, tối đa 8 MiB.";
  if (file.size === 0) return "Chọn ảnh JPEG/PNG không rỗng, tối đa 8 MiB.";
  if (file.size > 8 * 1024 * 1024) return "Chọn ảnh JPEG/PNG không rỗng, tối đa 8 MiB.";
  if (!["image/jpeg", "image/png"].includes(file.type)) return "Chỉ chấp nhận ảnh JPEG hoặc PNG.";
  return "";
}

/** Quy trình consent → front → back → liveness; ảnh/OCR chỉ trong RAM. */
export function EkycUploads({
  purpose,
  turnId,
  canComplete,
  onComplete,
  onVerificationBound,
  onVerified,
}: {
  purpose: Purpose;
  /** Chỉ áp dụng cho BENEFICIARY_CLAIM; các purpose khác bỏ qua. */
  turnId?: string | null;
  /** Server PASSED + MATCHED + purpose đúng; quyết định do page. */
  canComplete: boolean;
  /** Bước chốt danh tính do page xử lý để tránh phụ thuộc chéo feature. */
  onComplete: () => void;
  /** Báo verificationId mới từ /ekyc/document để page bind với context turn. */
  onVerificationBound?: (verificationId: string | null) => void;
  /** Notify the composing widget after a confirmed server result. */
  onVerified?: () => void;
}) {
  const client = useQueryClient();
  const [step, setStep] = useState<Step>("consent");
  const [ocr, setOcr] = useState<Document | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontError, setFrontError] = useState("");
  const [backError, setBackError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  // BR-88: mặt sau có thể gửi trước khi xác nhận; địa chỉ đọc từ mặt sau chỉ ở RAM để điền vào bản khai.
  const [backSent, setBackSent] = useState(false);
  const [backAddress, setBackAddress] = useState("");

  // Action riêng cho mỗi bước để lỗi hiển thị đúng chỗ và retry đúng bước.
  const consentAction = usePrivateAction();
  const frontAction = usePrivateAction();
  const backAction = usePrivateAction();

  function resetAll() {
    setStep("consent");
    setOcr(null);
    setStatus(null);
    setFrontImage(null);
    setBackImage(null);
    setConfirmed(false);
    setBackSent(false);
    setBackAddress("");
    setFrontError("");
    setBackError("");
    onVerificationBound?.(null);
  }

  /** Chỉ sang thử thách camera khi đã xác nhận bản khai VÀ đã gửi mặt sau, theo thứ tự nào cũng được. */
  function goToLiveness() {
    // canMatchFace=false hoặc verificationId=null: không cho mở camera liveness.
    const canStartLiveness = ocr?.canMatchFace !== false && ocr?.verificationId != null;
    setOcr(null);
    setBackAddress("");
    setStep(canStartLiveness ? "liveness" : "done");
  }

  async function handleConsent() {
    await consentAction.execute(
      () => ekycService.submitConsent(purpose),
      () => {
        setStep("front");
      },
    );
  }

  async function handleFront(form: HTMLFormElement) {
    setFrontError("");
    const err = validateImage(frontImage);
    if (err) {
      setFrontError(err);
      return;
    }
    const file = frontImage;
    await frontAction.execute(
      () => ekycService.submitDocument(file!, purpose, turnId),
      (result) => {
        setOcr(result);
        setFrontImage(null);
        form.reset();
        setStep("back");
        setConfirmed(false);
        setBackSent(false);
        setBackAddress("");
        onVerificationBound?.(result.canMatchFace ? result.verificationId : null);
        void client.invalidateQueries({ queryKey: ["ekyc"] });
      },
    );
  }

  async function handleBack(form: HTMLFormElement) {
    setBackError("");
    const err = validateImage(backImage);
    if (err) {
      setBackError(err);
      return;
    }
    if (!ocr?.canMatchFace || !ocr.verificationId) {
      setBackError("Hãy gửi lại mặt trước giấy tờ có khuôn mặt rõ trước khi gửi mặt sau.");
      return;
    }
    const file = backImage;
    await backAction.execute(
      () => ekycService.submitDocumentBack(file!, purpose, turnId),
      (result) => {
        setStatus(result);
        setBackImage(null);
        form.reset();
        setBackSent(true);
        setBackAddress(result.residenceAddress);
        // Đã xác nhận trước: đi tiếp ngay. Chưa xác nhận: ở lại để người dùng đối chiếu địa chỉ rồi bấm xác nhận.
        if (confirmed) goToLiveness();
        void client.invalidateQueries({ queryKey: ["ekyc"] });
      },
    );
  }

  return (
    <section className="space-y-4 border-t border-heritage-border pt-6">
      <h2 className="text-lg font-semibold">Xác minh danh tính</h2>

      {step === "consent" && (
        <div className="space-y-3 rounded-lg border border-heritage-border p-4 text-sm">
          <p>
            Mục đích xác minh: <strong>{purpose}</strong>.
          </p>
          <p className="text-heritage-muted">
            Ảnh giấy tờ và thử thách camera chỉ dùng để xác minh danh tính và được xử lý trong phiên
            này. Hệ thống không lưu ảnh, OCR hoặc dữ liệu giấy tờ vào bộ nhớ trình duyệt.
          </p>
          <p className="text-heritage-muted">Phiên đồng ý có hiệu lực trong 30 phút.</p>
          <Button
            type="button"
            className="min-h-11"
            disabled={consentAction.pending}
            onClick={() => void handleConsent()}
          >
            {consentAction.pending ? "Đang gửi đồng ý…" : "Tôi đồng ý và tiếp tục"}
          </Button>
          {consentAction.error && (
            <p role="alert" className="text-sm text-destructive">
              {consentAction.error}
            </p>
          )}
        </div>
      )}

      {step === "front" && (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void handleFront(event.currentTarget);
          }}
        >
          <h3 className="text-base font-semibold">Bước 1: Ảnh mặt trước giấy tờ</h3>
          <p className="text-sm text-heritage-muted">JPEG/PNG, tối đa 8 MiB.</p>
          <fieldset disabled={frontAction.pending} className="space-y-3">
            <Input
              type="file"
              accept="image/jpeg,image/png"
              aria-label="Ảnh mặt trước giấy tờ"
              onChange={(event) => setFrontImage(event.target.files?.[0] ?? null)}
            />
            <Button type="submit" className="min-h-11" disabled={!frontImage}>
              {frontAction.pending ? "Đang gửi…" : "Gửi ảnh mặt trước"}
            </Button>
          </fieldset>
          {(frontError || frontAction.error) && (
            <p role="alert" className="text-sm text-destructive">
              {frontError || frontAction.error}
            </p>
          )}
        </form>
      )}

      {step === "back" && (
        <>
          {ocr && (
            <EkycReviewForm
              key={ocr.verificationId ?? "unreadable"}
              document={ocr}
              purpose={purpose}
              turnId={turnId}
              confirmed={confirmed}
              disabled={backAction.pending}
              suggestedAddress={backAddress}
              backSent={backSent}
              onConfirmed={() => {
                setConfirmed(true);
                if (backSent) goToLiveness();
              }}
              onEdit={() => setConfirmed(false)}
            />
          )}
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void handleBack(event.currentTarget);
            }}
          >
            <h3 className="text-base font-semibold">Bước 2: Ảnh mặt sau giấy tờ</h3>
            <p className="text-sm text-heritage-muted">JPEG/PNG, tối đa 8 MiB.</p>
            <fieldset
              disabled={backAction.pending || !ocr?.canMatchFace || !ocr.verificationId}
              className="space-y-3"
            >
              <Input
                type="file"
                accept="image/jpeg,image/png"
                aria-label="Ảnh mặt sau giấy tờ"
                onChange={(event) => setBackImage(event.target.files?.[0] ?? null)}
              />
              <Button type="submit" className="min-h-11" disabled={!backImage}>
                {backAction.pending ? "Đang gửi…" : "Gửi ảnh mặt sau"}
              </Button>
            </fieldset>
            {backSent && !confirmed && (
              <p role="status" className="text-sm text-heritage-muted">
                Đã nhận ảnh mặt sau. Kiểm tra thông tin ở trên rồi bấm Xác nhận và gửi thông tin để
                tiếp tục.
              </p>
            )}
            {status?.backSideChecked === false && (
              <p role="status" className="text-sm text-heritage-muted">
                Máy chủ chưa đọc được mặt sau. Bạn có thể tiếp tục nhưng nên gửi lại ảnh rõ hơn.
              </p>
            )}
            {(backError || backAction.error) && (
              <p role="alert" className="text-sm text-destructive">
                {backError || backAction.error}
              </p>
            )}
          </form>
        </>
      )}

      {step === "liveness" && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold">Bước 3: Thử thách camera</h3>
          <LivenessPanel
            onCompleted={(s) => {
              setStatus(s);
              setOcr(null);
              setConfirmed(false);
              setStep("done");
              void client.invalidateQueries({ queryKey: ["ekyc"] });
              onVerified?.();
            }}
          />
          <Button type="button" variant="outline" className="min-h-11" onClick={resetAll}>
            Bắt đầu lại từ đầu
          </Button>
        </div>
      )}

      {step === "done" && status && (
        <div className="space-y-3 rounded-lg border border-heritage-border p-4 text-sm">
          {status.status === "FAILED" || status.identityMatch === "WRONG_PERSON" ? (
            <p role="alert">
              {status.identityMatch === "WRONG_PERSON"
                ? "Khuôn mặt không khớp với giấy tờ. Không thể hoàn tất lượt này."
                : "Lần xác minh chưa đạt yêu cầu."}
            </p>
          ) : status.identityMatch === "NEEDS_REVIEW" ? (
            <p role="alert">Cần kiểm tra thêm trước khi hoàn tất danh tính.</p>
          ) : (
            <p role="status">Đã hoàn tất bước xác minh.</p>
          )}
          <Button type="button" variant="outline" className="min-h-11" onClick={resetAll}>
            Bắt đầu lại từ đầu
          </Button>
        </div>
      )}

      {canComplete && (
        <div className="space-y-3 rounded-lg border border-heritage-border p-4 text-sm">
          <p>Đủ điều kiện hoàn tất danh tính cho lượt bàn giao.</p>
          <Button type="button" className="min-h-11" onClick={onComplete}>
            Hoàn tất danh tính lượt nhận
          </Button>
        </div>
      )}

      {step !== "done" && (
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={resetAll}
          disabled={frontAction.pending || backAction.pending}
        >
          Bắt đầu lại từ đầu
        </Button>
      )}
    </section>
  );
}
