import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, CircleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/shared/ui/button";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { StatusBanner } from "@/shared/ui/status-banner";
import { ROUTES } from "@/shared/config/routes.config";
import type { planSetupSchema } from "../model/planSetup.schema";
import { planSetupService } from "../api/planSetupService";
import { usePlanSetup } from "../model/usePlanSetup";

// Backend hiện không trả cảnh báo nào; mã lạ (nếu có) vẫn hiện nguyên văn.
const warningLabels: Record<string, string> = {};

const ROW_LINK =
  "inline-flex min-h-9 shrink-0 items-center rounded-full border border-heritage-border px-4 text-sm font-semibold text-heritage-primary hover:bg-heritage-primary/5 focus-visible:outline-2 focus-visible:outline-heritage-gold";

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
  const [showPolicy, setShowPolicy] = useState(false);
  let policyChevronClass = "size-5 shrink-0 transition-transform";
  if (showPolicy) {
    policyChevronClass = `${policyChevronClass} rotate-180`;
  }
  const sync = () => {
    void client.invalidateQueries({ queryKey: ["plan-setup", vaultId] });
    void client.invalidateQueries({ queryKey: ["owner-vault"] });
    void client.invalidateQueries({ queryKey: ["vault-check-in", vaultId] });
  };
  const draft = setup.planStatus === "DRAFT";
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
        <div className="space-y-1">
          <h2 className="text-xl font-medium text-heritage-primary">Sẵn sàng kích hoạt</h2>
          <p className="text-sm text-heritage-muted">
            {draft
              ? "Kế hoạch đang nháp; gói Sẵn sàng chưa tự kích hoạt lịch điểm danh."
              : `Trạng thái kế hoạch: ${setup.planStatus}`}
          </p>
        </div>
        {draft && setup.canActivate && (
          <StatusBanner tone="success">
            <p>Đủ điều kiện hiện tại. Đọc cảnh báo trước khi kích hoạt.</p>
          </StatusBanner>
        )}
        {draft && !setup.canActivate && (
          <p className="text-sm text-heritage-muted">Chưa đủ điều kiện để kích hoạt kế hoạch.</p>
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
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 text-left font-semibold text-heritage-primary focus-visible:outline-2 focus-visible:outline-heritage-gold"
              aria-expanded={showPolicy}
              aria-controls="plan-policy-text"
              onClick={() => setShowPolicy(!showPolicy)}
            >
              Thông tin trước khi kích hoạt
              <ChevronDown className={policyChevronClass} aria-hidden="true" />
            </button>
            {showPolicy && (
              <div id="plan-policy-text" className="space-y-2">
                <p className="text-sm leading-6 text-heritage-muted">{setup.policyText}</p>
                <p className="text-xs text-heritage-muted">Phiên bản: {setup.policyVersion}</p>
              </div>
            )}
          </div>
          <label className="flex min-h-11 items-start gap-3 rounded-xl bg-heritage-warning-bg p-4 text-sm leading-6 text-heritage-warning">
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
            className="bg-heritage-gold-soft font-semibold text-heritage-on-gold shadow-none hover:bg-heritage-gold-soft-hover disabled:opacity-60"
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
