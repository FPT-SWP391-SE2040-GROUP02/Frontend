import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { z } from "zod";
import { Button } from "@/shared/ui/button";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { readVaultPinFailure, type VaultPinFailure } from "@/shared/api/vaultPin";
import { PIN_DIGITS, PinCodeInput } from "@/shared/ui/pin-input";
import { StatusBanner } from "@/shared/ui/status-banner";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { ROUTES } from "@/shared/config/routes.config";
import type { planSetupSchema } from "../model/planSetup.schema";
import { planSetupService } from "../api/planSetupService";
import { computeHandoverProgress } from "../lib/handoverProgress";

type PlanSetup = z.infer<typeof planSetupSchema>;

/** Lý do ngắn dưới nút ký khi nút đang khóa; rỗng khi nút bấm được. */
function signLockReason(
  canActivate: boolean,
  missingCount: number,
  acknowledge: boolean,
  pinComplete: boolean,
): string {
  if (!canActivate) {
    if (missingCount > 0) {
      return `Chưa thể ký: còn ${missingCount} điều kiện chưa đạt. Bấm vào chỗ đỏ trong di chúc để điền.`;
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

/**
 * Chân khung xem trước di chúc: tick đã đọc, nhập mã PIN kho và nút "Ký và kích hoạt". Gửi đúng một lần bản cấu hình và
 * chính sách hiện hành, PIN đi ở header X-Vault-Pin (không trong body). Không tự ký: mọi xác nhận mặc định chưa tick,
 * quyền và điều kiện do Backend quyết định. Chỉ dùng khi kế hoạch còn nháp.
 */
export function WillSignFooter({ vaultId, setup }: { vaultId: string; setup: PlanSetup }) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const [acknowledge, setAcknowledge] = useState(false);
  const [pin, setPin] = useState("");
  const [pinFailure, setPinFailure] = useState<VaultPinFailure | null>(null);

  function sync(): void {
    void client.invalidateQueries({ queryKey: ["plan-setup", vaultId] });
    void client.invalidateQueries({ queryKey: ["owner-vault"] });
    void client.invalidateQueries({ queryKey: ["vault-check-in", vaultId] });
    // Kích hoạt xong server tự tạo mã mở gói: trạng thái mã cũ (chưa có) không còn đúng.
    void client.invalidateQueries({ queryKey: ["executor-key", vaultId] });
  }

  const missingCount = computeHandoverProgress(setup).missingTexts.length;
  const needsUpgrade = action.error.includes("gói dịch vụ trả phí");
  const pinComplete = pin.length === PIN_DIGITS;
  const lockedOut = pinFailure !== null && pinFailure.code === "VAULT_PIN_LOCKED";
  let canSign = false;
  if (setup.canActivate && acknowledge && pinComplete && !lockedOut && !action.pending) {
    canSign = true;
  }
  let reasonText = signLockReason(setup.canActivate, missingCount, acknowledge, pinComplete);
  if (action.pending) {
    reasonText = "Chờ hệ thống xác nhận mã PIN.";
  }
  let buttonText = "Ký và kích hoạt";
  if (action.pending) {
    buttonText = "Đang kiểm tra…";
  }
  // Lỗi PIN hiện ngay dưới ô PIN; các lỗi khác (kế hoạch đổi, hết hạn gói...) hiện ở khung lỗi phía dưới.
  let pinErrorText = "";
  if (pinFailure !== null) {
    pinErrorText = pinFailure.message;
  }
  let generalError = "";
  if (pinFailure === null) {
    generalError = action.error;
  }

  function activate(): void {
    if (!canSign) {
      return;
    }
    setPinFailure(null);
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
      sync,
      (error) => {
        // Sai PIN thì xóa ô nhập để gõ lại; PIN không được nằm lại trong ô sau khi gửi.
        setPin("");
        setPinFailure(readVaultPinFailure(error));
      },
    );
  }

  return (
    <form
      className="max-h-[50vh] shrink-0 overflow-y-auto border-t border-heritage-border bg-heritage-canvas px-5 py-4"
      aria-label="Ký di chúc và kích hoạt"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        activate();
      }}
    >
      <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-6">
        <input
          type="checkbox"
          className="mt-0.5 size-5 shrink-0 accent-[#0b291e]"
          checked={acknowledge}
          disabled={action.pending || !setup.canActivate}
          onChange={(event) => setAcknowledge(event.target.checked)}
        />
        <span>
          Tôi đã đọc toàn bộ di chúc, tự nguyện lập, ký di chúc này và chủ động kích hoạt kế hoạch.
        </span>
      </label>
      <label htmlFor="sign-pin" className="mt-3 block text-[13px] font-semibold">
        Nhập mã PIN của kho (6 số)
      </label>
      <PinCodeInput
        id="sign-pin"
        value={pin}
        placeholder="••••••"
        disabled={action.pending || lockedOut || !setup.canActivate}
        aria-invalid={pinErrorText !== "" ? true : undefined}
        aria-describedby="sign-pin-error"
        onValueChange={(digits) => {
          setPin(digits);
          setPinFailure(null);
          action.reset();
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
        className="mb-3 mt-1.5 min-h-0 text-sm font-medium text-[#a32119]"
      >
        {pinErrorText}
      </p>
      <Button
        type="submit"
        size="lg"
        className="w-full rounded-[20px] bg-heritage-gold font-semibold text-white shadow-none hover:bg-heritage-gold-hover disabled:opacity-50"
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
