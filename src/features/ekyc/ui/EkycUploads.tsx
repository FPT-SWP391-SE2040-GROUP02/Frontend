import { useState, type ReactNode } from "react";
import type { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Lock, X } from "lucide-react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Button } from "@/shared/ui/button";
import { ekycDocumentSchema, ekycPurposeSchema, ekycStatusSchema } from "../model/ekyc.schema";
import { ekycService } from "../api/ekycService";
import { LivenessPanel } from "./LivenessPanel";
import { EkycReviewForm } from "./EkycReviewForm";
import { EkycStepper } from "./EkycStepper";
import { EkycDropzone } from "./EkycDropzone";
import { MatchRing } from "./MatchRing";

type Purpose = z.infer<typeof ekycPurposeSchema>;
type Document = z.infer<typeof ekycDocumentSchema>;
type Status = z.infer<typeof ekycStatusSchema>;

type Step = "consent" | "front" | "back" | "liveness" | "done";
type Tab = "front" | "back";

const CARD = "rounded-2xl border border-heritage-border bg-heritage-surface p-6";
const GOLD_BUTTON = "bg-[#E0C486] font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B]";
const PURPOSE_LABELS: Record<Purpose, string> = {
  OWNER_ENROLLMENT: "xác minh Chủ kho",
  BENEFICIARY_CLAIM: "xác minh Người nhận để nhận bàn giao",
  OWNER_ALIVE: "xác nhận bạn còn sống",
};

function validateImage(file: File | null): string {
  if (!file) return "Chọn ảnh JPEG/PNG không rỗng, tối đa 8 MiB.";
  if (file.size === 0) return "Chọn ảnh JPEG/PNG không rỗng, tối đa 8 MiB.";
  if (file.size > 8 * 1024 * 1024) return "Chọn ảnh JPEG/PNG không rỗng, tối đa 8 MiB.";
  if (!["image/jpeg", "image/png"].includes(file.type)) return "Chỉ chấp nhận ảnh JPEG hoặc PNG.";
  return "";
}

function PageTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-3xl font-medium text-heritage-primary">{title}</h2>
      <p className="mt-2 text-sm text-heritage-muted">{description}</p>
    </div>
  );
}

function CheckRow({ state, text }: { state: "pass" | "fail" | "unknown"; text: string }) {
  let mark: ReactNode = <span className="size-5 rounded-full border border-heritage-border" />;
  if (state === "pass") {
    mark = (
      <span className="flex size-5 items-center justify-center rounded-full bg-green-600 text-white">
        <Check className="size-3.5" aria-hidden="true" />
      </span>
    );
  } else if (state === "fail") {
    mark = (
      <span className="flex size-5 items-center justify-center rounded-full bg-red-800 text-white">
        <X className="size-3.5" aria-hidden="true" />
      </span>
    );
  }
  return (
    <li className="flex items-center gap-3 border-b border-heritage-border py-3 text-sm last:border-b-0">
      {mark}
      {text}
    </li>
  );
}

/** Kết quả so khớp theo trạng thái Backend trả về; không tự quyết PASSED hay MATCHED. */
function ResultStep({ status, onRestart }: { status: Status; onRestart: () => void }) {
  const wrongPerson = status.identityMatch === "WRONG_PERSON";
  const needsReview = status.identityMatch === "NEEDS_REVIEW";
  const failed = status.status === "FAILED" || wrongPerson;
  const passed = !failed && !needsReview && status.status === "PASSED";

  let tone: "idle" | "pass" | "fail" = "idle";
  let chip = "Cần kiểm tra";
  let chipStyle = "bg-[#F1E7D0] text-[#7A5B24]";
  let heading = "Cần kiểm tra thêm";
  if (passed) {
    tone = "pass";
    chip = "Đã chạy";
    chipStyle = "bg-green-100 text-green-800";
    heading = "Khuôn mặt khớp với căn cước";
  } else if (failed) {
    tone = "fail";
    chip = "Chưa khớp";
    chipStyle = "bg-heritage-canvas text-heritage-muted";
    heading = "Chưa đủ độ khớp";
  }

  let spoof: "pass" | "fail" | "unknown" = "unknown";
  if (status.spoofCheckPassed === true) {
    spoof = "pass";
  } else if (status.spoofCheckPassed === false) {
    spoof = "fail";
  }
  let score: "pass" | "fail" | "unknown" = "unknown";
  let scoreText = "Điểm khớp đạt ngưỡng";
  if (status.faceMatchScore !== null) {
    scoreText = `Điểm khớp đạt ngưỡng (${status.faceMatchScore.toFixed(2)} / ${status.matchThreshold.toFixed(2)})`;
    if (status.faceMatchScore >= status.matchThreshold) {
      score = "pass";
    } else {
      score = "fail";
    }
  }
  let profile: "pass" | "fail" | "unknown" = "unknown";
  if (status.identityMatch === "MATCHED") {
    profile = "pass";
  } else if (wrongPerson) {
    profile = "fail";
  }

  let message: ReactNode;
  if (failed) {
    let text = "Lần xác minh chưa đạt yêu cầu.";
    if (wrongPerson) {
      text = "Khuôn mặt không khớp với giấy tờ. Không thể hoàn tất lượt này.";
    }
    message = <p role="alert">{text}</p>;
  } else if (needsReview) {
    message = <p role="alert">Cần kiểm tra thêm trước khi hoàn tất danh tính.</p>;
  } else {
    message = <p role="status">Đã hoàn tất bước xác minh.</p>;
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section aria-label="Ảnh đối chiếu" className={CARD}>
        <h3 className="text-xl font-medium text-heritage-primary">Ảnh đối chiếu</h3>
        <div className="mt-5 grid grid-cols-2 gap-4 text-center text-sm font-semibold">
          <div>
            <div
              className="flex aspect-[4/3] items-center justify-center rounded-xl bg-heritage-canvas"
              aria-hidden="true"
            >
              <span className="size-14 rounded-full bg-heritage-border" />
            </div>
            <p className="mt-3">Căn cước đã đọc</p>
          </div>
          <div>
            <div
              className="flex aspect-[4/3] items-center justify-center rounded-xl bg-heritage-canvas"
              aria-hidden="true"
            >
              <span className="size-14 rounded-full bg-heritage-border" />
            </div>
            <p className="mt-3">Selfie của bạn</p>
          </div>
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-heritage-muted">
          <Lock className="size-3.5 shrink-0" aria-hidden="true" />
          Ảnh được xử lý và không dùng cho mục đích khác.
        </p>
        <div className="mt-4 text-sm">{message}</div>
        {!passed && (
          <Button type="button" size="lg" className={`mt-4 ${GOLD_BUTTON}`} onClick={onRestart}>
            Đọc lại căn cước
          </Button>
        )}
      </section>
      <section aria-label="Kết quả so khớp" className={CARD}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-medium text-heritage-primary">Kết quả so khớp</h3>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${chipStyle}`}>
            {chip}
          </span>
        </div>
        <div className="mt-6">
          <MatchRing score={status.faceMatchScore} tone={tone} />
        </div>
        <p className="mt-4 text-center text-lg font-semibold">{heading}</p>
        <ul className="mt-5">
          <CheckRow state={spoof} text="Qua kiểm tra chống giả mạo" />
          <CheckRow state={score} text={scoreText} />
          {status.identityMatch !== "NOT_CHECKED" && (
            <CheckRow state={profile} text="Khớp hồ sơ người nhận được chỉ định" />
          )}
        </ul>
      </section>
    </div>
  );
}

/** Quy trình consent → giấy tờ (mặt trước, mặt sau tùy chọn) → thử thách camera → kết quả; ảnh/OCR chỉ trong RAM. */
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
  const [tab, setTab] = useState<Tab>("front");
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
    setTab("front");
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

  /** Sang thử thách camera sau khi bản khai đã được xác nhận; mặt sau là tùy chọn. */
  function goToLiveness() {
    // canMatchFace=false hoặc verificationId=null: không cho mở camera liveness.
    const canStartLiveness = ocr?.canMatchFace !== false && ocr?.verificationId != null;
    setOcr(null);
    setBackAddress("");
    if (canStartLiveness) {
      setStep("liveness");
    } else {
      setStep("done");
    }
  }

  async function handleConsent() {
    await consentAction.execute(
      () => ekycService.submitConsent(purpose),
      () => {
        setStep("front");
      },
    );
  }

  async function handleFront() {
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
        setStep("back");
        setTab("back");
        setConfirmed(false);
        setBackSent(false);
        setBackAddress("");
        onVerificationBound?.(result.canMatchFace ? result.verificationId : null);
        void client.invalidateQueries({ queryKey: ["ekyc"] });
      },
    );
  }

  async function handleBack() {
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
        setBackSent(true);
        setBackAddress(result.residenceAddress);
        void client.invalidateQueries({ queryKey: ["ekyc"] });
      },
    );
  }

  let stepNumber: 1 | 2 | 3 | 4 = 1;
  if (step === "liveness") {
    stepNumber = 2;
  } else if (step === "done") {
    stepNumber = 3;
    if (status?.status === "PASSED" && status.identityMatch !== "WRONG_PERSON") {
      stepNumber = 4;
    }
  }

  let title = "Đọc thông tin căn cước";
  let description = "Thêm mặt trước để bắt đầu. Với thẻ mới, thêm mặt sau để lấy nơi cư trú.";
  if (step === "liveness") {
    title = "Bạn đang ở trước camera.";
    description =
      "Giữ khuôn mặt trong khung và làm theo hướng dẫn. Chỉ lấy selfie khi phiên đạt thử thách.";
  } else if (step === "done") {
    title = "Một căn cước. Một khuôn mặt.";
    description = "Ảnh tham chiếu lấy từ căn cước đã đọc.";
  } else if (step === "back") {
    title = "Đã đọc xong căn cước";
    description = "Kiểm tra thông tin bên phải rồi tiếp tục so khớp khuôn mặt.";
  }

  const resetDisabled = frontAction.pending || backAction.pending;
  const documentStep = step === "front" || step === "back";
  let scanChip = "Chưa quét";
  let scanChipStyle = "bg-heritage-canvas text-heritage-muted";
  if (ocr) {
    scanChip = "Đã quét";
    scanChipStyle = "bg-green-100 text-green-800";
  }
  let frontTabStyle = "text-heritage-muted";
  let backTabStyle = "text-heritage-muted";
  if (tab === "front") {
    frontTabStyle = "bg-[#1d4d3c] text-white";
  } else {
    backTabStyle = "bg-[#1d4d3c] text-white";
  }
  const guidance = ["Đủ 4 góc thẻ", "Không chói sáng", "Chữ rõ nét"];
  const chips: ReactNode[] = [];
  for (const text of guidance) {
    chips.push(
      <li
        key={text}
        className="flex items-center gap-2 rounded-full border border-heritage-border px-3 py-1 text-xs"
      >
        <Check className="size-3.5 text-green-700" aria-hidden="true" />
        {text}
      </li>,
    );
  }

  return (
    <section className="space-y-6">
      <PageTitle title={title} description={description} />
      <EkycStepper current={stepNumber} />

      {step === "consent" && (
        <div className={`${CARD} space-y-3 text-sm`}>
          <h3 className="text-xl font-medium text-heritage-primary">Trước khi bắt đầu</h3>
          <p>
            Mục đích: <strong>{PURPOSE_LABELS[purpose]}</strong>.
          </p>
          <p className="text-heritage-muted">
            Ảnh giấy tờ và thử thách camera chỉ dùng để xác minh danh tính và được xử lý trong phiên
            này. Hệ thống không lưu ảnh, OCR hoặc dữ liệu giấy tờ vào bộ nhớ trình duyệt.
          </p>
          <p className="text-heritage-muted">Phiên đồng ý có hiệu lực trong 30 phút.</p>
          <Button
            type="button"
            size="lg"
            className={GOLD_BUTTON}
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

      {documentStep && (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section aria-label="Giấy tờ của bạn" className={CARD}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-medium text-heritage-primary">Giấy tờ của bạn</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${scanChipStyle}`}>
                {scanChip}
              </span>
            </div>
            <div
              role="tablist"
              aria-label="Mặt giấy tờ"
              className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-heritage-canvas p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={tab === "front"}
                className={`min-h-11 rounded-lg text-sm font-semibold ${frontTabStyle}`}
                onClick={() => setTab("front")}
              >
                1 Mặt trước
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "back"}
                className={`min-h-11 rounded-lg text-sm font-semibold ${backTabStyle}`}
                onClick={() => setTab("back")}
              >
                2 Mặt sau <span className="text-xs font-normal">tùy chọn</span>
              </button>
            </div>

            {tab === "front" && (
              <form
                className="mt-5 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleFront();
                }}
              >
                <fieldset disabled={frontAction.pending} className="space-y-4">
                  <EkycDropzone
                    title="Chọn ảnh mặt trước"
                    inputLabel="Ảnh mặt trước giấy tờ"
                    file={frontImage}
                    onFile={setFrontImage}
                    disabled={frontAction.pending}
                  />
                  <ul className="flex flex-wrap gap-2">{chips}</ul>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full justify-between"
                    disabled={!frontImage}
                  >
                    {frontAction.pending ? "Đang đọc…" : "Đọc thông tin"}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                </fieldset>
                {(frontError || frontAction.error) && (
                  <p role="alert" className="text-sm text-destructive">
                    {frontError || frontAction.error}
                  </p>
                )}
                <p className="flex items-start gap-2 text-xs text-heritage-muted">
                  <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  Mặt trước sau khi đọc được khóa để so khớp selfie. Chọn thẻ khác sẽ xóa thẻ tham
                  chiếu và kết quả cũ.
                </p>
              </form>
            )}

            {tab === "back" && (
              <form
                className="mt-5 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleBack();
                }}
              >
                <fieldset
                  disabled={backAction.pending || !ocr?.canMatchFace || !ocr.verificationId}
                  className="space-y-4"
                >
                  <EkycDropzone
                    title="Chọn ảnh mặt sau"
                    inputLabel="Ảnh mặt sau giấy tờ"
                    file={backImage}
                    onFile={setBackImage}
                    disabled={backAction.pending || !ocr?.canMatchFace || !ocr.verificationId}
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full justify-between"
                    disabled={!backImage}
                  >
                    {backAction.pending ? "Đang đọc…" : "Đọc mặt sau"}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                </fieldset>
                {!ocr && (
                  <p className="text-sm text-heritage-muted">
                    Đọc mặt trước trước, rồi mới thêm mặt sau (không bắt buộc).
                  </p>
                )}
                {backSent && !confirmed && (
                  <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">
                    Đã nhận ảnh mặt sau. Kiểm tra thông tin ở bên phải rồi bấm Tiếp tục so khớp mặt.
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
            )}
          </section>

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
                goToLiveness();
              }}
              onEdit={() => setConfirmed(false)}
            />
          )}
          {!ocr && (
            <section aria-label="Thông tin nhận diện" className={CARD}>
              <h3 className="text-xl font-medium text-heritage-primary">Thông tin nhận diện</h3>
              <p className="mt-4 text-sm text-heritage-muted">
                Thông tin đọc từ giấy tờ sẽ hiện ở đây sau khi bạn bấm Đọc thông tin. Bạn có thể sửa
                nếu máy đọc sai.
              </p>
            </section>
          )}
        </div>
      )}

      {step === "liveness" && (
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
      )}

      {step === "done" && status && <ResultStep status={status} onRestart={resetAll} />}

      {canComplete && (
        <div className={`${CARD} space-y-3 text-sm`}>
          <p>Đủ điều kiện hoàn tất danh tính cho lượt bàn giao.</p>
          <Button type="button" size="lg" className={GOLD_BUTTON} onClick={onComplete}>
            Hoàn tất danh tính lượt nhận
          </Button>
        </div>
      )}

      <Button type="button" variant="outline" size="lg" onClick={resetAll} disabled={resetDisabled}>
        Bắt đầu lại từ đầu
      </Button>
    </section>
  );
}
