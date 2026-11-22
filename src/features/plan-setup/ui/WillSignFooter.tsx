import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Link } from "react-router-dom";
import type { z } from "zod";
import { Button } from "@/shared/ui/button";
import { privateActionError, usePrivateAction } from "@/shared/api/usePrivateAction";
import { readVaultPinFailure, type VaultPinFailure } from "@/shared/api/vaultPin";
import { PIN_DIGITS, PinCodeInput } from "@/shared/ui/pin-input";
import { StatusBanner } from "@/shared/ui/status-banner";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { ROUTES } from "@/shared/config/routes.config";
import type { planSetupSchema } from "../model/planSetup.schema";
import { planSetupService } from "../api/planSetupService";
import { computeHandoverProgress } from "../lib/handoverProgress";
import { willIdentityQueryKey } from "../model/useWillIdentity";

type PlanSetup = z.infer<typeof planSetupSchema>;

/** Thông báo kết quả ký hiện ngay trên chân khung; nơi gọi giữ để thông báo không mất khi chân khung bị gỡ. */
export interface WillSignNotice {
  tone: "success" | "error";
  text: string;
}

/** Lý do ngắn dưới nút ký khi nút đang khóa; rỗng khi nút bấm được. */
function signLockReason(
  canActivate: boolean,
  missingCount: number,
  acknowledge: boolean,
  pinComplete: boolean,
): string {
  if (!canActivate) {
    if (missingCount > 0) {
      return `Chưa thể ký: còn ${missingCount} điều kiện chưa đạt. Bấm vào chỗ đỏ trong biên bản phân chia để điền.`;
    }
    return "Chưa thể ký: còn điều kiện cần kiểm tra. Tải lại điều kiện hoặc thử lại sau.";
  }
  if (!acknowledge) {
    return "Cần tick ô xác nhận phía trên.";
  }
  if (!pinComplete) {
    return "Nhập đủ 6 số của mã PIN.";
  }
  return "";
}

/** Mã lỗi nghiệp vụ trong body lỗi của Backend; rỗng khi không có. */
function readErrorCode(error: unknown): string {
  if (!isAxiosError(error)) {
    return "";
  }
  const data: unknown = error.response?.data;
  if (typeof data === "object" && data !== null && "code" in data) {
    if (typeof data.code === "string") {
      return data.code;
    }
  }
  return "";
}

/**
 * Chân khung xem trước biên bản phân chia: tick đã đọc, nhập mã PIN kho và nút ký. Hai chế độ theo trạng thái kế hoạch:
 * - Còn nháp: "Ký và kích hoạt" (gửi bản cấu hình và chính sách hiện hành).
 * - Đang chạy mà có thay đổi chưa ký: "Ký phiên bản mới" (gửi bản cấu hình đang xem; Người thực thi không phải ký lại).
 * PIN đi ở header X-Vault-Pin (không trong body). Không tự ký: mọi xác nhận mặc định chưa tick, quyền và điều kiện do
 * Backend quyết định. Lỗi cấu hình đã đổi (EDIT_CONFLICT) và kế hoạch không cho ký lại báo qua `onNotice` rồi làm mới.
 */
export function WillSignFooter({
  vaultId,
  setup,
  initialPin = "",
  onPinChange,
  externalPinFailure = null,
  onNotice,
}: {
  vaultId: string;
  setup: PlanSetup;
  /** PIN đã xác nhận khi mở khung xem trước, điền sẵn để khỏi nhập lại; người dùng vẫn sửa hoặc xóa được. */
  initialPin?: string;
  /** Báo PIN người dùng gõ cho khung cha (để tải danh tính đầy đủ bằng chính PIN này, khỏi hỏi lần hai). */
  onPinChange?: (pin: string) => void;
  /** Lỗi PIN khi tải danh tính bằng PIN vừa gõ; hiện ngay dưới ô PIN. */
  externalPinFailure?: VaultPinFailure | null;
  onNotice: (notice: WillSignNotice | null) => void;
}) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const [acknowledge, setAcknowledge] = useState(false);
  const [typedPin, setPin] = useState<string | null>(null);
  const pin = typedPin ?? initialPin;
  const [ownPinFailure, setPinFailure] = useState<VaultPinFailure | null>(null);
  const pinFailure = ownPinFailure ?? externalPinFailure;
  // Lỗi đã báo qua onNotice thì không lặp lại ở khung lỗi của chân khung.
  const [errorReported, setErrorReported] = useState(false);
  const isResign = setup.planStatus !== "DRAFT";

  function sync(): void {
    void client.invalidateQueries({ queryKey: ["plan-setup", vaultId] });
    void client.invalidateQueries({ queryKey: ["owner-vault"] });
    void client.invalidateQueries({ queryKey: ["vault-check-in", vaultId] });
    void client.invalidateQueries({ queryKey: willIdentityQueryKey(vaultId) });
    // Kích hoạt xong server tự tạo mã mở gói: trạng thái mã cũ (chưa có) không còn đúng.
    void client.invalidateQueries({ queryKey: ["executor-key", vaultId] });
  }

  // Chế độ ký lại không cần canActivate: kế hoạch đang chạy và Backend đã báo có thay đổi chưa ký.
  let eligible = setup.canActivate;
  if (isResign) {
    eligible = true;
  }
  const missingCount = computeHandoverProgress(setup).missingTexts.length;
  const needsUpgrade = action.error.includes("gói dịch vụ trả phí");
  const pinComplete = pin.length === PIN_DIGITS;
  const lockedOut = pinFailure !== null && pinFailure.code === "VAULT_PIN_LOCKED";
  let canSign = false;
  if (eligible && acknowledge && pinComplete && !lockedOut && !action.pending) {
    canSign = true;
  }
  let reasonText = signLockReason(eligible, missingCount, acknowledge, pinComplete);
  if (action.pending) {
    reasonText = "Chờ hệ thống xác nhận mã PIN.";
  }
  let buttonText = "Ký và kích hoạt";
  if (isResign) {
    buttonText = "Ký phiên bản mới";
  }
  if (action.pending) {
    buttonText = "Đang kiểm tra…";
  }
  let tickText =
    "Tôi đã đọc toàn bộ biên bản phân chia, tự nguyện lập, ký biên bản phân chia này và chủ động kích hoạt kế hoạch.";
  let formLabel = "Ký biên bản phân chia và kích hoạt";
  if (isResign) {
    tickText =
      "Tôi đã đọc toàn bộ biên bản phân chia phiên bản mới, tự nguyện ký lại và đồng ý với các thay đổi đã nêu.";
    formLabel = "Ký phiên bản mới của biên bản phân chia";
  }
  // Lỗi PIN hiện ngay dưới ô PIN; các lỗi khác (kế hoạch đổi, hết hạn gói...) hiện ở khung lỗi phía dưới.
  let pinErrorText = "";
  if (pinFailure !== null) {
    pinErrorText = pinFailure.message;
  }
  let generalError = "";
  if (pinFailure === null && !errorReported) {
    generalError = action.error;
  }

  function handleSigned(result: PlanSetup): void {
    if (!isResign) {
      sync();
      return;
    }
    // PIN và xác nhận không được nằm lại sau khi ký xong.
    setPin("");
    setAcknowledge(false);
    client.setQueryData(["plan-setup", vaultId], result);
    sync();
    let text = "Đã ký phiên bản mới của biên bản phân chia. Từ nay bàn giao theo bản ký này.";
    if (result.willVersion !== undefined && result.willVersion !== null) {
      text = `Đã ký phiên bản ${result.willVersion} của biên bản phân chia. Từ nay bàn giao theo bản ký này.`;
    }
    onNotice({ tone: "success", text });
  }

  function handleFailure(error: unknown): void {
    // Sai PIN thì xóa ô nhập để gõ lại; PIN không được nằm lại trong ô sau khi gửi.
    setPin("");
    setPinFailure(readVaultPinFailure(error));
    const code = readErrorCode(error);
    if (code === "EDIT_CONFLICT") {
      setErrorReported(true);
      onNotice({
        tone: "error",
        text: "Cấu hình đã thay đổi, đang tải lại. Hãy xem lại biên bản phân chia rồi ký lại.",
      });
      sync();
    }
    if (code === "WILL_SIGN_NOT_ALLOWED") {
      setErrorReported(true);
      onNotice({ tone: "error", text: privateActionError(error) });
      sync();
    }
  }

  function sign(): void {
    if (!canSign) {
      return;
    }
    setPinFailure(null);
    setErrorReported(false);
    onNotice(null);
    if (isResign) {
      void action.execute(
        () => planSetupService.signWill(vaultId, setup.configVersion, pin),
        handleSigned,
        handleFailure,
      );
      return;
    }
    void action.execute(
      () =>
        planSetupService.activate(
          vaultId,
          {
            configVersion: setup.configVersion,
            policyVersion: setup.policyVersion,
            acknowledgePolicy: acknowledge,
          },
          pin,
        ),
      handleSigned,
      handleFailure,
    );
  }

  return (
    <form
      className="max-h-[50vh] shrink-0 overflow-y-auto border-t border-heritage-border bg-heritage-canvas px-5 py-4"
      aria-label={formLabel}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        sign();
      }}
    >
      {isResign && (
        <p className="mb-3 text-[13px] leading-5 text-heritage-muted">
          Ký lại để bản biên bản phân chia khớp với cấu hình hiện tại và phần thêm hoặc đổi người
          nhận được bàn giao. Phần đã xóa không còn được bàn giao. Người thực thi không phải ký lại.
        </p>
      )}
      <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-6">
        <input
          type="checkbox"
          className="mt-0.5 size-5 shrink-0 accent-heritage-primary"
          checked={acknowledge}
          disabled={action.pending || !eligible}
          onChange={(event) => setAcknowledge(event.target.checked)}
        />
        <span>{tickText}</span>
      </label>
      <label htmlFor="sign-pin" className="mt-3 block text-[13px] font-semibold">
        Nhập mã PIN của kho (6 số)
      </label>
      <PinCodeInput
        id="sign-pin"
        value={pin}
        placeholder="••••••"
        disabled={action.pending || lockedOut || !eligible}
        aria-invalid={pinErrorText !== "" ? true : undefined}
        aria-describedby="sign-pin-error"
        onValueChange={(digits) => {
          setPin(digits);
          setPinFailure(null);
          action.reset();
          if (onPinChange) {
            onPinChange(digits);
          }
        }}
      />
      <p className="mt-2 text-[13px] text-heritage-muted">
        Cùng mã PIN bạn dùng khi sửa tài sản.{" "}
        <Link
          className="font-semibold text-heritage-gold-hover underline underline-offset-4"
          to={ROUTES.DASHBOARD.SETTINGS}
        >
          Quên mã PIN?
        </Link>
      </p>
      <p
        id="sign-pin-error"
        role="alert"
        className="mb-3 mt-1.5 min-h-0 text-sm font-medium text-heritage-danger"
      >
        {pinErrorText}
      </p>
      <Button
        type="submit"
        size="lg"
        className="w-full rounded-xl bg-heritage-primary font-semibold text-white shadow-none hover:bg-heritage-primary-hover disabled:opacity-50"
        disabled={!canSign}
        aria-describedby="sign-reason"
      >
        {buttonText}
      </Button>
      <p id="sign-reason" role="status" className="mt-2.5 min-h-5 text-[13px] text-heritage-muted">
        {reasonText}
      </p>
      {generalError !== "" && (
        <div className="mt-3">
          <StatusBanner tone="error">
            <p>{generalError}</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={sync}>
                Tải lại điều kiện
              </Button>
              {needsUpgrade && (
                <Link className={buttonStyles.outline} to={ROUTES.BILLING.PLANS}>
                  Xem gói dịch vụ
                </Link>
              )}
            </div>
          </StatusBanner>
        </div>
      )}
    </form>
  );
}
