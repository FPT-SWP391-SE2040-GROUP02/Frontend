import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, CircleAlert, Clock, KeyRound, X } from "lucide-react";
import { Link } from "react-router-dom";
import type { z } from "zod";
import { Button } from "@/shared/ui/button";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { StatusBanner } from "@/shared/ui/status-banner";
import { ROUTES } from "@/shared/config/routes.config";
import type { planSetupSchema } from "../model/planSetup.schema";
import { planSetupService } from "../api/planSetupService";
import { usePlanSetup } from "../model/usePlanSetup";
import { PlanReviewSummary } from "./PlanReviewSummary";

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
 * Thẻ "Việc cần làm để kích hoạt" của Chủ kho. Không tự mời Người thực thi hay tự kích hoạt; mọi xác nhận mặc định chưa tick.
 * `onActivated` chạy ngay khi Backend xác nhận kích hoạt, trước khi làm mới dữ liệu kế hoạch; nơi dùng nhận việc cấp
 * mã mở gói (thuộc tính năng khác nên không gọi ở đây). Kế hoạch đã rời trạng thái nháp thì thẻ này không hiện.
 */
export function PlanSetupPanel({
  vaultId,
  onActivated,
}: {
  vaultId: string;
  onActivated?: () => void;
}) {
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
      onActivated={onActivated}
    />
  );
}

/** Lý do ngắn bên cạnh nút kích hoạt khi nút đang khóa; rỗng khi nút bấm được. */
function activationLockReason(canActivate: boolean, acknowledge: boolean): string {
  if (!canActivate) {
    return "Còn điều kiện chưa đạt ở trên.";
  }
  if (!acknowledge) {
    return "Cần tick ô xác nhận phía trên.";
  }
  return "";
}

function PlanSetupForm({
  vaultId,
  setup,
  onActivated,
}: {
  vaultId: string;
  setup: PlanSetup;
  onActivated?: () => void;
}) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const [acknowledge, setAcknowledge] = useState(false);
  const sync = () => {
    void client.invalidateQueries({ queryKey: ["plan-setup", vaultId] });
    void client.invalidateQueries({ queryKey: ["owner-vault"] });
    void client.invalidateQueries({ queryKey: ["vault-check-in", vaultId] });
  };
  const progress = countProgress(setup.missingRequirements);
  let progressPercent = 0;
  if (progress.total > 0) {
    progressPercent = Math.round((progress.done / progress.total) * 100);
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
  const lockReason = activationLockReason(setup.canActivate, acknowledge);

  function activate(): void {
    void action.execute(
      () =>
        planSetupService.activate(vaultId, {
          configVersion: setup.configVersion,
          policyVersion: setup.policyVersion,
          acknowledgePolicy: acknowledge,
        }),
      () => {
        if (onActivated) {
          onActivated();
        }
        sync();
      },
    );
  }

  return (
    <section
      className="space-y-6 rounded-2xl border border-heritage-border bg-heritage-surface p-6"
      aria-label="Việc cần làm để kích hoạt"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-xl font-medium text-heritage-primary">Việc cần làm để kích hoạt</h2>
          <span className="rounded-full bg-[#F1E7D0] px-3 py-1 text-xs font-semibold text-[#7A5B24]">
            Đã đạt {progress.done}/{progress.total} điều kiện
          </span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-heritage-canvas"
          role="progressbar"
          aria-label="Tiến độ điều kiện kích hoạt"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
        >
          <div
            className="h-full rounded-full bg-[#B68F4C]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <ActivationChecklist missing={setup.missingRequirements} executors={setup.executors} />
        <div className="flex items-start gap-3 rounded-xl border border-heritage-border bg-heritage-canvas px-4 py-3 text-sm leading-6 text-heritage-muted">
          <KeyRound className="mt-0.5 size-5 shrink-0 text-heritage-gold" aria-hidden="true" />
          <p>Mã mở gói: bạn nhận ngay sau khi kích hoạt, kèm phiếu để trao cho Người thực thi.</p>
        </div>
        {setup.canActivate && (
          <StatusBanner tone="success">
            <p>Đủ điều kiện hiện tại. Đọc cảnh báo trước khi kích hoạt.</p>
          </StatusBanner>
        )}
      </div>
      {warnings.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div className="space-y-1">
            <h3 className="font-semibold">Cảnh báo</h3>
            <ul className="list-disc space-y-1 pl-5">{warnings}</ul>
          </div>
        </div>
      )}
      <div className="space-y-3">
        <h3 className="font-semibold text-heritage-primary">Soát lại trước khi kích hoạt</h3>
        <PlanReviewSummary
          containers={setup.containers}
          assetsOutsideContainer={setup.assetsOutsideContainer}
          showActivationNote
        />
      </div>
      <div className="space-y-4 rounded-xl bg-heritage-canvas p-5">
        <div className="space-y-2">
          <h3 className="font-semibold text-heritage-primary">Thông tin trước khi kích hoạt</h3>
          <p className="text-sm leading-6 text-heritage-muted">{setup.policyText}</p>
          <p className="text-sm leading-6 text-heritage-muted">
            Khi kích hoạt, mỗi người nhận sẽ nhận một email báo họ đã được chọn, kèm email và số
            điện thoại của bạn và của Người thực thi để họ liên hệ.
          </p>
          <p className="text-xs text-heritage-muted">Phiên bản: {setup.policyVersion}</p>
        </div>
        <label className="flex min-h-11 items-start gap-3 rounded-xl bg-[#F1E7D0] p-4 text-sm leading-6 text-[#7A5B24]">
          <input
            type="checkbox"
            className="mt-1 size-5"
            checked={acknowledge}
            disabled={action.pending}
            onChange={(event) => setAcknowledge(event.target.checked)}
          />
          Tôi đã đọc cảnh báo về điểm danh, hạn phản hồi, tải và lưu/xóa dữ liệu; tôi chủ động kích
          hoạt kế hoạch này.
        </label>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button
            size="lg"
            className="bg-[#E0C486] font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B] disabled:opacity-60"
            disabled={!setup.canActivate || !acknowledge || action.pending}
            aria-describedby={lockReason === "" ? undefined : "activation-lock-reason"}
            onClick={activate}
          >
            Kích hoạt kế hoạch
          </Button>
          {lockReason !== "" && (
            <p id="activation-lock-reason" className="text-xs text-heritage-muted">
              {lockReason}
            </p>
          )}
        </div>
      </div>
      {action.pending && (
        <p
          role="status"
          className="rounded-xl border border-heritage-border bg-heritage-surface px-4 py-3 text-sm text-heritage-muted"
        >
          Đang gửi yêu cầu…
        </p>
      )}
      {action.error && (
        <StatusBanner tone="error">
          <p>{action.error}</p>
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
      )}
    </section>
  );
}
