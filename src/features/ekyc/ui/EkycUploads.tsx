import { useEffect, useState, type ReactNode } from "react";

import { Link } from "react-router-dom";

import type { z } from "zod";

import { useQueryClient } from "@tanstack/react-query";

import { ArrowRight, Check, Lock, X, ZoomIn } from "lucide-react";

import { useAccountHome } from "@/entities/user/model/useAccountHome";

import { usePrivateAction } from "@/shared/api/usePrivateAction";

import { Button } from "@/shared/ui/button";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";

import { ekycDocumentSchema, ekycPurposeSchema, ekycStatusSchema } from "../model/ekyc.schema";

import { ekycService } from "../api/ekycService";

import { LivenessPanel } from "./LivenessPanel";

import { EkycReviewForm } from "./EkycReviewForm";

import { EkycStepper } from "./EkycStepper";

import { EkycDropzone } from "./EkycDropzone";

import { MatchRing } from "./MatchRing";

import { useImagePreview } from "./useImagePreview";

type Purpose = z.infer<typeof ekycPurposeSchema>;

type Document = z.infer<typeof ekycDocumentSchema>;

type Status = z.infer<typeof ekycStatusSchema>;

type Step = "consent" | "front" | "back" | "liveness" | "done";

type Tab = "front" | "back";

const CARD = "rounded-2xl border border-heritage-border bg-heritage-surface p-6";

const GOLD_BUTTON = "bg-[#E0C486] font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B]";

const CONSENT_PROMISES = [
  "Chụp hoặc tải ảnh căn cước, mặt trước và mặt sau",

  "Chụp ảnh khuôn mặt và thử thách camera trực tiếp",

  "So khớp khuôn mặt với ảnh trên căn cước",

  "Chỉ dùng để xác minh bạn là người nhận được chỉ định",
];

const PREPARE_CHIPS = ["Căn cước còn hạn, bản gốc", "Nơi đủ sáng", "Bỏ khẩu trang, kính tối màu"];

/**

 * Bước đồng ý trước khi chụp (thiết kế 113): hai ô xác nhận, chỉ khi tick đủ mới bật "Đồng ý và bắt đầu".

 * Hai ô chỉ là bước xác nhận ở giao diện; Backend ghi nhận đồng ý qua lệnh consent của nút bắt đầu.

 */

function ConsentStep({
  purposeLabel,

  pending,

  error,

  onAgree,
}: {
  purposeLabel: string;

  pending: boolean;

  error: string;

  onAgree: () => void;
}) {
  const accountHome = useAccountHome();

  const [processing, setProcessing] = useState(false);

  const [readOnly, setReadOnly] = useState(false);

  const ready = processing && readOnly;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section aria-labelledby="ekyc-consent-title" className={`${CARD} space-y-4`}>
        <h3 id="ekyc-consent-title" className="text-xl font-medium text-heritage-primary">
          Chúng tôi sẽ làm gì với ảnh của bạn
        </h3>

        <ul className="space-y-2 text-sm">
          {CONSENT_PROMISES.map((text) => (
            <li key={text} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-[#1F7A55]" aria-hidden="true" />

              {text}
            </li>
          ))}
        </ul>

        <p className="border-b border-heritage-border pb-4 text-sm text-heritage-muted">
          Mục đích: {purposeLabel}. Đây là xác minh cơ bản, không có giá trị pháp lý. Ảnh được mã
          hóa và xóa theo chính sách lưu giữ. Phiên đồng ý có hiệu lực trong 30 phút.
        </p>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"

            className="mt-0.5 size-5 shrink-0"

            checked={processing}

            disabled={pending}

            onChange={(event) => setProcessing(event.target.checked)}
          />
          Tôi đồng ý cho LegacyVault xử lý ảnh căn cước và khuôn mặt của tôi để xác minh danh tính.
        </label>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"

            className="mt-0.5 size-5 shrink-0"

            checked={readOnly}

            disabled={pending}

            onChange={(event) => setReadOnly(event.target.checked)}
          />
          Tôi hiểu thông tin đọc từ căn cước không thể chỉnh sửa. Nếu sai, tôi chụp lại.
        </label>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"

            size="lg"

            className={`${GOLD_BUTTON} disabled:bg-[#ECE8DB] disabled:text-[#8A8574] disabled:opacity-100`}

            disabled={!ready || pending}

            onClick={onAgree}
          >
            {pending ? "Đang gửi đồng ý…" : "Đồng ý và bắt đầu"}
          </Button>

          <Link
            to={accountHome}

            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#0A281E] px-6 text-sm font-semibold text-[#0A281E] hover:bg-[#F4F1E6]"
          >
            Để sau
          </Link>
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-[#F8E1DE] px-4 py-3 text-sm text-[#A32119]">
            {error}
          </p>
        )}
      </section>

      <section aria-labelledby="ekyc-prepare-title" className={`${CARD} space-y-4`}>
        <h3 id="ekyc-prepare-title" className="text-xl font-medium text-heritage-primary">
          Chuẩn bị
        </h3>

        <ul className="flex flex-wrap gap-2">
          {PREPARE_CHIPS.map((text) => (
            <li
              key={text}

              className="flex items-center gap-2 rounded-full bg-heritage-canvas px-3 py-1.5 text-xs"
            >
              <Check className="size-3.5 text-[#1F7A55]" aria-hidden="true" />

              {text}
            </li>
          ))}
        </ul>

        <p className="flex items-start gap-2 text-xs text-heritage-muted">
          <Lock className="mt-0.5 size-3.5 shrink-0 text-[#1F7A55]" aria-hidden="true" />
          Ảnh chỉ dùng để đối chiếu. Không chia sẻ cho chủ kho hay người khác.
        </p>
      </section>
    </div>
  );
}

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

/** Nhãn 3 pha đọc ảnh: tải lên (NN%) → OCR → hoàn tất; pha hiện theo tiến độ upload thật. */

function ocrPhaseLabel(pending: boolean, succeeded: boolean, percent: number | null): string {
  if (succeeded) return "Hoàn tất đọc dữ liệu";

  if (pending) {
    return percent !== null && percent < 100
      ? `Đang tải ảnh lên… ${percent}%`
      : "Đang phân tích OCR…";
  }

  return "Sẵn sàng";
}

/** Ảnh đã gửi kèm nút phóng to; không có ảnh thì giữ placeholder xám cũ. */

function CompareTile({ url, label }: { url: string | null; label: string }) {
  const [zoomed, setZoomed] = useState(false);

  return (
    <div>
      <div
        className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-heritage-canvas"

        aria-hidden="true"
      >
        {url ? (
          <>
            <img src={url} alt="" className="size-full object-contain" />

            <button
              type="button"

              onClick={() => setZoomed(true)}

              aria-label={`Phóng to ${label}`}

              className="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            >
              <ZoomIn className="size-4" aria-hidden="true" />
            </button>
          </>
        ) : (
          <span className="size-14 rounded-full bg-heritage-border" />
        )}
      </div>

      <p className="mt-3">{label}</p>

      <Dialog open={zoomed} onOpenChange={setZoomed}>
        <DialogContent aria-label={label}>
          <DialogTitle>{label}</DialogTitle>

          <DialogDescription>Ảnh đã gửi đến máy chủ để đối chiếu.</DialogDescription>

          {url && <img src={url} alt="" className="max-h-[70vh] rounded-lg object-contain" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Kết quả so khớp theo trạng thái Backend trả về; không tự quyết PASSED hay MATCHED. */

function ResultStep({
  status,

  frontUrl,

  backUrl,

  selfieUrl,

  onRestart,
}: {
  status: Status;

  frontUrl: string | null;

  backUrl: string | null;

  selfieUrl: string | null;

  onRestart: () => void;
}) {
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
          <CompareTile url={frontUrl ?? backUrl} label="Căn cước đã đọc" />

          <CompareTile url={selfieUrl} label="Selfie của bạn" />
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

  // Ảnh đã gửi giữ lại (blob URL thu hồi khi đổi/unmount) để xem trước + zoom trước bước so khớp.

  const [sentFront, setSentFront] = useState<File | null>(null);

  const [sentBack, setSentBack] = useState<File | null>(null);

  const [frontPercent, setFrontPercent] = useState<number | null>(null);

  const [backPercent, setBackPercent] = useState<number | null>(null);

  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);

  const [zoomFront, setZoomFront] = useState(false);

  const [zoomBack, setZoomBack] = useState(false);

  // Action riêng cho mỗi bước để lỗi hiển thị đúng chỗ và retry đúng bước.

  const consentAction = usePrivateAction();

  const frontAction = usePrivateAction();

  const backAction = usePrivateAction();

  const sentFrontUrl = useImagePreview(sentFront);

  const sentBackUrl = useImagePreview(sentBack);

  useEffect(() => {
    return () => {
      if (selfieUrl) {
        try {
          URL.revokeObjectURL(selfieUrl);
        } catch {
          /* jsdom */
        }
      }
    };
  }, [selfieUrl]);

  function resetAll() {
    if (selfieUrl) {
      try {
        URL.revokeObjectURL(selfieUrl);
      } catch {
        /* jsdom */
      }

      setSelfieUrl(null);
    }

    setStep("consent");

    setTab("front");

    setOcr(null);

    setStatus(null);

    setFrontImage(null);

    setBackImage(null);

    setConfirmed(false);

    setBackSent(false);

    setBackAddress("");

    setSentFront(null);

    setSentBack(null);

    setFrontPercent(null);

    setBackPercent(null);

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

    setFrontPercent(null);

    await frontAction.execute(
      () => ekycService.submitDocument(file!, purpose, turnId, (p) => setFrontPercent(p)),

      (result) => {
        setOcr(result);

        setSentFront(file);

        setFrontImage(null);

        setFrontPercent(null);

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

    setBackPercent(null);

    await backAction.execute(
      () => ekycService.submitDocumentBack(file!, purpose, turnId, (p) => setBackPercent(p)),

      (result) => {
        setStatus(result);

        setSentBack(file);

        setBackImage(null);

        setBackPercent(null);

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

  if (step === "consent") {
    title = "Trước khi chụp";

    description = "Xin bạn đọc và đồng ý. Bạn chỉ phải làm bước này một lần cho lần xác minh này.";
  }

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
        <ConsentStep
          purposeLabel={PURPOSE_LABELS[purpose]}

          pending={consentAction.pending}

          error={consentAction.error}

          onAgree={() => void handleConsent()}
        />
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

            {tab === "front" && sentFrontUrl && (
              <div className="mt-5 space-y-4">
                <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-heritage-border bg-heritage-canvas">
                  <img
                    src={sentFrontUrl}

                    alt="Mặt trước căn cước đã đọc"

                    className="size-full object-contain"
                  />

                  <button
                    type="button"

                    onClick={() => setZoomFront(true)}

                    aria-label="Phóng to ảnh mặt trước"

                    className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                  >
                    <ZoomIn className="size-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <p className="flex items-center gap-1.5 font-medium text-green-700">
                    <Check className="size-4" aria-hidden="true" />
                    Đã đọc thông tin mặt trước
                  </p>

                  <Button
                    type="button"

                    variant="outline"

                    size="sm"

                    onClick={() => {
                      setSentFront(null);

                      setFrontImage(null);

                      setOcr(null);

                      setConfirmed(false);

                      setBackSent(false);

                      setBackAddress("");

                      setSentBack(null);

                      onVerificationBound?.(null);
                    }}
                  >
                    Chọn ảnh khác
                  </Button>
                </div>

                <p className="text-xs text-heritage-muted">
                  Đối chiếu ảnh mặt trước này với biểu mẫu thông tin bên phải. Bấm biểu tượng kính
                  lúp để phóng to.
                </p>

                <Dialog open={zoomFront} onOpenChange={setZoomFront}>
                  <DialogContent aria-label="Mặt trước căn cước">
                    <DialogTitle>Mặt trước căn cước</DialogTitle>

                    <DialogDescription>Ảnh mặt trước đã tải lên để đối chiếu.</DialogDescription>

                    <img
                      src={sentFrontUrl}

                      alt="Mặt trước căn cước phóng to"

                      className="max-h-[75vh] w-full rounded-lg object-contain"
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {tab === "front" && !sentFrontUrl && (
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
                    {frontAction.pending ? "Đang xử lý…" : "Đọc thông tin"}

                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>

                  {frontAction.pending && (
                    <div>
                      <p role="status" className="text-xs text-heritage-muted">
                        {ocrPhaseLabel(frontAction.pending, frontAction.succeeded, frontPercent)}
                      </p>

                      <div
                        role="progressbar"

                        aria-valuemin={0}

                        aria-valuemax={100}

                        aria-valuenow={frontPercent ?? 100}

                        className="mt-2 h-1.5 overflow-hidden rounded-full bg-heritage-canvas"
                      >
                        <div
                          className="h-full bg-[#1d4d3c]"

                          style={{
                            width: frontPercent === null ? "100%" : `${frontPercent}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
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

            {tab === "back" && sentBackUrl && (
              <div className="mt-5 space-y-4">
                <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-heritage-border bg-heritage-canvas">
                  <img
                    src={sentBackUrl}

                    alt="Mặt sau căn cước đã đọc"

                    className="size-full object-contain"
                  />

                  <button
                    type="button"

                    onClick={() => setZoomBack(true)}

                    aria-label="Phóng to ảnh mặt sau"

                    className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                  >
                    <ZoomIn className="size-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <p className="flex items-center gap-1.5 font-medium text-green-700">
                    <Check className="size-4" aria-hidden="true" />
                    Đã đọc thông tin mặt sau
                  </p>

                  <Button
                    type="button"

                    variant="outline"

                    size="sm"

                    onClick={() => {
                      setSentBack(null);

                      setBackImage(null);

                      setBackSent(false);

                      setBackAddress("");
                    }}
                  >
                    Chọn ảnh khác
                  </Button>
                </div>

                <Dialog open={zoomBack} onOpenChange={setZoomBack}>
                  <DialogContent aria-label="Mặt sau căn cước">
                    <DialogTitle>Mặt sau căn cước</DialogTitle>

                    <DialogDescription>Ảnh mặt sau đã tải lên để đối chiếu.</DialogDescription>

                    <img
                      src={sentBackUrl}

                      alt="Mặt sau căn cước phóng to"

                      className="max-h-[75vh] w-full rounded-lg object-contain"
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {tab === "back" && !sentBackUrl && (
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
                    {backAction.pending ? "Đang xử lý…" : "Đọc mặt sau"}

                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>

                  {backAction.pending && (
                    <div>
                      <p role="status" className="text-xs text-heritage-muted">
                        {ocrPhaseLabel(backAction.pending, backAction.succeeded, backPercent)}
                      </p>

                      <div
                        role="progressbar"

                        aria-valuemin={0}

                        aria-valuemax={100}

                        aria-valuenow={backPercent ?? 100}

                        className="mt-2 h-1.5 overflow-hidden rounded-full bg-heritage-canvas"
                      >
                        <div
                          className="h-full bg-[#1d4d3c]"

                          style={{
                            width: backPercent === null ? "100%" : `${backPercent}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
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

              frontUrl={sentFrontUrl}

              backUrl={sentBackUrl}

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
          onCompleted={(s, selfie) => {
            setStatus(s);

            if (selfie) {
              setSelfieUrl(selfie);
            }

            setOcr(null);

            setConfirmed(false);

            setStep("done");

            void client.invalidateQueries({ queryKey: ["ekyc"] });

            onVerified?.();
          }}
        />
      )}

      {step === "done" && status && (
        <ResultStep
          status={status}

          frontUrl={sentFrontUrl}

          backUrl={sentBackUrl}

          selfieUrl={selfieUrl}

          onRestart={resetAll}
        />
      )}

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
