import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, CircleAlert, X } from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/shared/ui/button";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { StatusBanner } from "@/shared/ui/status-banner";
import { ROUTES } from "@/shared/config/routes.config";
import type { planSetupSchema } from "../model/planSetup.schema";
import { planSetupService } from "../api/planSetupService";
import { usePlanSetup } from "../model/usePlanSetup";

const missingLabels: Record<string, string> = {
  ACCOUNT_NOT_ACTIVE: "Tài khoản chưa hoạt động.",
  EMAIL_VERIFICATION_REQUIRED: "Cần xác minh email.",
  VAULT_NOT_OPEN: "Kho phải đang mở.",
  PAID_SERVICE_REQUIRED: "Cần gói trả phí còn hạn.",
  OWNER_EKYC_REQUIRED: "Chủ kho cần hoàn tất xác minh danh tính eKYC.",
  READY_CONTAINER_REQUIRED: "Cần ít nhất một gói có tài sản và người nhận hợp lệ.",
  PRIMARY_EXECUTOR_REQUIRED: "Cần Executor đã chấp nhận nhiệm vụ.",
  PLAN_NOT_DRAFT: "Kế hoạch đã rời trạng thái nháp.",
  NO_ASSET: "Gói chưa có tài sản.",
  NO_DESIGNATION: "Gói chưa có người nhận.",
};
// Backend hiện không trả cảnh báo nào; mã lạ (nếu có) vẫn hiện nguyên văn.
const warningLabels: Record<string, string> = {};
const CHECKLIST_ITEMS = [
  { code: "OWNER_EKYC_REQUIRED", done: "Đã xác minh danh tính eKYC.", link: "identity" },
  { code: "READY_CONTAINER_REQUIRED", done: "Có ít nhất một gói sẵn sàng bàn giao.", link: "" },
  {
    code: "PRIMARY_EXECUTOR_REQUIRED",
    done: "Người thực hiện chính đã chấp nhận nhiệm vụ.",
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

/** Danh sách điều kiện kích hoạt: dòng nào đạt hiện dấu tích, dòng nào thiếu kèm lý do và đường đi tiếp. */
function ActivationChecklist({ missing }: { missing: string[] }) {
  const rows: ReactNode[] = [];
  const known: string[] = [];
  for (const item of CHECKLIST_ITEMS) {
    known.push(item.code);
    const isMissing = missing.includes(item.code);
    let text = item.done;
    if (isMissing) {
      text = missingLabels[item.code];
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
      action = (
        <Link className={ROW_LINK} to={ROUTES.DASHBOARD.TRUSTED_PEOPLE}>
          Đến Người tin cậy
        </Link>
      );
    }
    rows.push(<ChecklistRow key={item.code} ok={!isMissing} text={text} action={action} />);
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
    rows.push(<ChecklistRow key={code} ok={false} text={text} action={null} />);
  }
  return <ul className="space-y-3">{rows}</ul>;
}

function ChecklistRow({ ok, text, action }: { ok: boolean; text: string; action: ReactNode }) {
  let mark = (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
      <X className="size-4" aria-hidden="true" />
    </span>
  );
  let rowStyle = "border-heritage-border bg-heritage-canvas";
  if (ok) {
    mark = (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
        <Check className="size-4" aria-hidden="true" />
      </span>
    );
    rowStyle = "border-green-200 bg-green-50/60";
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

/** Owner-scoped readiness; no auto-invite or activation, all confirmations default false. */
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
  return (
    <PlanSetupForm
      key={`${vaultId}:${query.data.configVersion}:${query.data.policyVersion}:${query.data.planStatus}`}
      vaultId={vaultId}
      setup={query.data}
    />
  );
}

function PlanSetupForm({
  vaultId,
  setup,
}: {
  vaultId: string;
  setup: z.infer<typeof planSetupSchema>;
}) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const [acknowledge, setAcknowledge] = useState(false);
  const sync = () => {
    void client.invalidateQueries({ queryKey: ["plan-setup", vaultId] });
    void client.invalidateQueries({ queryKey: ["owner-vault"] });
    void client.invalidateQueries({ queryKey: ["vault-check-in", vaultId] });
  };
  const draft = setup.planStatus === "DRAFT";
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
  return (
    <section
      className="space-y-6 rounded-2xl border border-heritage-border bg-heritage-surface p-6"
      aria-label="Kích hoạt kế hoạch"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-medium text-heritage-primary">Sẵn sàng kích hoạt</h2>
            <p className="text-sm text-heritage-muted">
              {draft
                ? "Kế hoạch đang nháp; gói Sẵn sàng chưa tự kích hoạt lịch điểm danh."
                : `Trạng thái kế hoạch: ${setup.planStatus}`}
            </p>
          </div>
          {draft && (
            <span className="rounded-full bg-[#F1E7D0] px-3 py-1 text-xs font-semibold text-[#7A5B24]">
              Đã đạt {progress.done}/{progress.total} điều kiện
            </span>
          )}
        </div>
        {draft && (
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
        )}
        {draft && <ActivationChecklist missing={setup.missingRequirements} />}
        {draft && setup.canActivate && (
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
      {draft && (
        <div className="space-y-4 rounded-xl bg-heritage-canvas p-5">
          <div className="space-y-2">
            <h3 className="font-semibold text-heritage-primary">Thông tin trước khi kích hoạt</h3>
            <p className="text-sm leading-6 text-heritage-muted">{setup.policyText}</p>
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
            Tôi đã đọc cảnh báo về điểm danh, hạn phản hồi, tải và lưu/xóa dữ liệu; tôi chủ động
            kích hoạt kế hoạch này.
          </label>
          <Button
            size="lg"
            className="bg-[#E0C486] font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B] disabled:opacity-60"
            disabled={!setup.canActivate || !acknowledge || action.pending}
            onClick={() =>
              void action.execute(
                () =>
                  planSetupService.activate(vaultId, {
                    configVersion: setup.configVersion,
                    policyVersion: setup.policyVersion,
                    acknowledgePolicy: acknowledge,
                  }),
                sync,
              )
            }
          >
            Kích hoạt kế hoạch
          </Button>
        </div>
      )}
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
