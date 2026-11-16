import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, CircleAlert, Clock, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { z } from "zod";
import { Button } from "@/shared/ui/button";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { readVaultPinFailure, type VaultPinFailure } from "@/shared/api/vaultPin";
import { PIN_DIGITS, PinCodeInput } from "@/shared/ui/pin-input";
import { StatusBanner } from "@/shared/ui/status-banner";
import { ROUTES } from "@/shared/config/routes.config";
import type { planSetupSchema } from "../model/planSetup.schema";
import { planSetupService } from "../api/planSetupService";
import { usePlanSetup } from "../model/usePlanSetup";

type PlanSetup = z.infer<typeof planSetupSchema>;

const missingLabels: Record<string, string> = {
  ACCOUNT_NOT_ACTIVE: "Tài khoản chưa hoạt động.",
  EMAIL_VERIFICATION_REQUIRED: "Cần xác minh email.",
  VAULT_NOT_OPEN: "Kho phải đang mở.",
  PAID_SERVICE_REQUIRED: "Cần gói trả phí còn hạn.",
  OWNER_EKYC_REQUIRED: "Chủ kho cần hoàn tất xác minh danh tính eKYC.",
  READY_CONTAINER_REQUIRED: "Cần ít nhất một gói có tài sản và người nhận hợp lệ.",
  PRIMARY_EXECUTOR_REQUIRED: "Cần Người thực thi đã chấp nhận nhiệm vụ.",
  PLAN_NOT_DRAFT: "Kế hoạch đã rời trạng thái nháp.",
  NO_ASSET: "Gói chưa có tài sản.",
  NO_DESIGNATION: "Gói chưa có người nhận.",
};
// Mã cảnh báo lạ (nếu có) vẫn hiện nguyên văn.
const warningLabels: Record<string, string> = {
  NO_BACKUP_EXECUTOR: "Chưa có Người thực thi dự phòng. Bạn vẫn kích hoạt được.",
};
const CHECKLIST_ITEMS = [
  { code: "OWNER_EKYC_REQUIRED", done: "Đã xác minh danh tính eKYC.", link: "identity" },
  { code: "READY_CONTAINER_REQUIRED", done: "Có ít nhất một gói sẵn sàng bàn giao.", link: "" },
  {
    code: "PRIMARY_EXECUTOR_REQUIRED",
    done: "Người thực thi chính đã chấp nhận nhiệm vụ.",
    link: "trusted",
  },
  { code: "PAID_SERVICE_REQUIRED", done: "Gói dịch vụ trả phí còn hạn.", link: "" },
];

const ROW_LINK =
  "inline-flex min-h-9 shrink-0 items-center rounded-full border border-heritage-border px-4 text-sm font-semibold text-heritage-primary hover:bg-heritage-primary/5 focus-visible:outline-2 focus-visible:outline-heritage-gold";

/** Đếm điều kiện đạt/tổng, gồm cả mã lạ của máy chủ, để hiện tiến độ ở đầu thẻ. */
function countProgress(missing: string[]): { done: number; total: number } {
  let done = 0;
  const known: string[] = [];
  for (const item of CHECKLIST_ITEMS) {
    known.push(item.code);
    if (!missing.includes(item.code)) {
      done = done + 1;
    }
  }
  let extra = 0;
  for (const code of missing) {
    if (!known.includes(code)) {
      extra = extra + 1;
    }
  }
  return { done, total: CHECKLIST_ITEMS.length + extra };
}

type RowState = "ok" | "missing" | "waiting";

/**
 * Danh sách điều kiện kích hoạt: dòng nào đạt hiện dấu tích, dòng nào thiếu kèm lý do và nút hành động ngay trong dòng.
 * Người thực thi đã được mời nhưng chưa chấp nhận là trạng thái chờ (màu vàng), không phải thiếu hẳn.
 */
function ActivationChecklist({
  missing,
  executors,
}: {
  missing: string[];
  executors: PlanSetup["executors"];
}) {
  const rows: ReactNode[] = [];
  const known: string[] = [];
  for (const item of CHECKLIST_ITEMS) {
    known.push(item.code);
    const isMissing = missing.includes(item.code);
    let text = item.done;
    if (isMissing) {
      text = missingLabels[item.code];
    }
    let state: RowState = "ok";
    if (isMissing) {
      state = "missing";
    }
    let action: ReactNode = null;
    if (isMissing && item.link === "identity") {
      action = (
        <Link className={ROW_LINK} to={ROUTES.DASHBOARD.IDENTITY}>
          Đi xác minh danh tính
        </Link>
      );
    }
    if (isMissing && item.link === "trusted") {
      let invitedEmail = "";
      for (const executor of executors) {
        if (executor.status === "INVITED" && invitedEmail === "") {
          invitedEmail = executor.inviteeEmail;
        }
      }
      if (invitedEmail !== "") {
        state = "waiting";
        text = `Đã mời ${invitedEmail}, đang chờ chấp nhận`;
      } else {
        action = (
          <Link className={ROW_LINK} to={ROUTES.DASHBOARD.TRUSTED_PEOPLE}>
            Mời Người thực thi
          </Link>
        );
      }
    }
    rows.push(<ChecklistRow key={item.code} state={state} text={text} action={action} />);
  }
  // Mã khác (kho chưa mở, email chưa xác minh...) vẫn hiện để không giấu điều kiện của máy chủ.
  for (const code of missing) {
    if (known.includes(code)) {
      continue;
    }
    let text = "Còn điều kiện cần kiểm tra với máy chủ.";
    if (Object.hasOwn(missingLabels, code)) {
      text = missingLabels[code];
    }
    rows.push(<ChecklistRow key={code} state="missing" text={text} action={null} />);
  }
  return <ul className="space-y-3">{rows}</ul>;
}

function ChecklistRow({
  state,
  text,
  action,
}: {
  state: RowState;
  text: string;
  action: ReactNode;
}) {
  let mark = (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
      <X className="size-4" aria-hidden="true" />
    </span>
  );
  let rowStyle = "border-heritage-border bg-heritage-canvas";
  if (state === "ok") {
    mark = (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
        <Check className="size-4" aria-hidden="true" />
      </span>
    );
    rowStyle = "border-green-200 bg-green-50/60";
  }
  if (state === "waiting") {
    mark = (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
        <Clock className="size-4" aria-hidden="true" />
      </span>
    );
    rowStyle = "border-amber-200 bg-amber-50";
  }
  return (
    <li
      className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border px-4 py-3 text-sm ${rowStyle}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {mark}
        <span className="leading-6">{text}</span>
      </div>
      {action}
    </li>
  );
}

/**
 * Cột phải của trang Bàn giao khi kế hoạch còn nháp: thẻ tiến độ (điều kiện kích hoạt, giữ logic và nhãn của
 * missingRequirements) và thẻ "Ký di chúc và kích hoạt". Không tự mời Người thực thi hay tự kích hoạt; mọi xác nhận
 * mặc định chưa tick. Kế hoạch đã rời trạng thái nháp thì không hiện gì.
 */
export function PlanSetupPanel({ vaultId }: { vaultId: string }) {
  const query = usePlanSetup(vaultId);
  if (query.isPending) return <p role="status">Đang kiểm tra điều kiện kích hoạt…</p>;
  if (query.isError)
    return (
      <div role="alert">
        <p>Không tải được điều kiện kích hoạt.</p>
        <Button onClick={() => void query.refetch()} disabled={query.isFetching}>
          Thử lại
        </Button>
      </div>
    );
  if (query.data.planStatus !== "DRAFT") return null;
  return (
    <PlanSetupForm
      key={`${vaultId}:${query.data.configVersion}:${query.data.policyVersion}:${query.data.planStatus}`}
      vaultId={vaultId}
      setup={query.data}
    />
  );
}

/** Lý do ngắn dưới nút ký khi nút đang khóa; rỗng khi nút bấm được. */
function signLockReason(canActivate: boolean, acknowledge: boolean, pinComplete: boolean): string {
  if (!canActivate) {
    return "Còn điều kiện chưa đạt trong di chúc.";
  }
  if (!acknowledge) {
    return "Cần tick ô xác nhận phía trên.";
  }
  if (!pinComplete) {
    return "Nhập đủ 6 số của mã PIN.";
  }
  return "";
}

function PlanSetupForm({ vaultId, setup }: { vaultId: string; setup: PlanSetup }) {
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
  const progress = countProgress(setup.missingRequirements);
  let progressPercent = 0;
  if (progress.total > 0) {
    progressPercent = Math.round((progress.done / progress.total) * 100);
  }
  const remaining = progress.total - progress.done;
  let progressTitle = "Di chúc đã đủ nội dung";
  if (!setup.canActivate) {
    progressTitle = `Còn ${remaining} điều kiện chưa đạt`;
    if (remaining === 0) {
      progressTitle = "Còn điều kiện cần kiểm tra";
    }
  }
  const needsUpgrade = action.error.includes("gói dịch vụ trả phí");
  const warnings: ReactNode[] = [];
  for (const w of setup.warnings) {
    let text = w;
    if (Object.hasOwn(warningLabels, w)) {
      text = warningLabels[w];
    }
    warnings.push(<li key={w}>{text}</li>);
  }
  const pinComplete = pin.length === PIN_DIGITS;
  const lockedOut = pinFailure !== null && pinFailure.code === "VAULT_PIN_LOCKED";
  const lockReason = signLockReason(setup.canActivate, acknowledge, pinComplete);
  let canSign = false;
  if (setup.canActivate && acknowledge && pinComplete && !lockedOut && !action.pending) {
    canSign = true;
  }
  let reasonText = lockReason;
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
    <>
      <section
        className="rounded-2xl border border-heritage-border bg-heritage-surface p-[22px] shadow-sm"
        aria-label="Việc cần làm để kích hoạt"
      >
        <h2 className="text-[17px] font-semibold leading-[1.3] text-heritage-primary">
          {progressTitle}
        </h2>
        <div
          className="mt-3.5 h-2 overflow-hidden rounded-full bg-heritage-canvas shadow-[inset_2px_2px_5px_rgba(0,0,0,.06),inset_-2px_-2px_5px_rgba(255,255,255,.8)]"
          role="progressbar"
          aria-label="Tiến độ điền di chúc"
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={progress.done}
        >
          <div
            className="h-full rounded-full bg-heritage-primary transition-[width] duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-4">
          <ActivationChecklist missing={setup.missingRequirements} executors={setup.executors} />
        </div>
        {warnings.length > 0 && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              <h3 className="font-semibold">Cảnh báo</h3>
              <ul className="list-disc space-y-1 pl-5">{warnings}</ul>
            </div>
          </div>
        )}
      </section>

      <form
        className="rounded-2xl border border-heritage-border bg-heritage-surface p-[22px] shadow-sm"
        aria-label="Ký di chúc và kích hoạt"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          activate();
        }}
      >
        <h2 className="text-[17px] font-semibold leading-[1.3] text-heritage-primary">
          Ký di chúc và kích hoạt
        </h2>
        <p className="mt-1.5 text-sm text-heritage-muted">
          Ký xong, kế hoạch bắt đầu chạy và lịch điểm danh được tính từ hôm nay. Mỗi người nhận sẽ
          nhận một email báo họ đã được chọn.
        </p>
        <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm leading-6">
          <input
            type="checkbox"
            className="mt-0.5 size-5 shrink-0 accent-[#0b291e]"
            checked={acknowledge}
            disabled={action.pending}
            onChange={(event) => setAcknowledge(event.target.checked)}
          />
          <span>
            Tôi đã đọc toàn bộ di chúc, tự nguyện lập, ký di chúc này và chủ động kích hoạt kế
            hoạch.
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
        <p
          id="sign-reason"
          role="status"
          className="mt-2.5 min-h-5 text-[13px] text-heritage-muted"
        >
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
                  <Link className={ROW_LINK} to={ROUTES.BILLING.PLANS}>
                    Xem gói dịch vụ
                  </Link>
                )}
              </div>
            </StatusBanner>
          </div>
        )}
      </form>
    </>
  );
}
