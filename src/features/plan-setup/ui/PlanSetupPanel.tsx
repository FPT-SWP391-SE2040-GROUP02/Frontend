import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/shared/ui/button";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
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
  PRIMARY_EXECUTOR_REQUIRED: "Cần Executor chính đã chấp nhận nhiệm vụ.",
  BACKUP_EXECUTOR_REQUIRED: "Executor chính là người nhận: cần dự phòng độc lập đã chấp nhận.",
  PLAN_NOT_DRAFT: "Kế hoạch đã rời trạng thái nháp.",
  NO_ASSET: "Gói chưa có tài sản.",
  NO_DESIGNATION: "Gói chưa có người nhận.",
};
const warningLabels: Record<string, string> = {
  NO_BACKUP_EXECUTOR:
    "Chưa có Executor dự phòng. Nếu Executor chính không thể thực hiện nhiệm vụ, kế hoạch có thể chậm trễ.",
};
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
        <Link
          className="inline-flex min-h-11 items-center underline"
          to={ROUTES.DASHBOARD.IDENTITY}
        >
          Đi xác minh danh tính
        </Link>
      );
    }
    if (isMissing && item.link === "trusted") {
      action = (
        <Link
          className="inline-flex min-h-11 items-center underline"
          to={ROUTES.DASHBOARD.TRUSTED_PEOPLE}
        >
          Đến Người tin cậy
        </Link>
      );
    }
    rows.push(<ChecklistRow key={item.code} ok={!isMissing} text={text} action={action} />);
  }
  // Mã khác (kho chưa mở, email chưa xác minh, Executor dự phòng...) vẫn hiện để không giấu điều kiện của máy chủ.
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
  return <ul className="space-y-1">{rows}</ul>;
}

function ChecklistRow({ ok, text, action }: { ok: boolean; text: string; action: ReactNode }) {
  let mark = <X className="mt-1 size-4 shrink-0 text-red-700" aria-hidden="true" />;
  if (ok) {
    mark = <Check className="mt-1 size-4 shrink-0 text-green-700" aria-hidden="true" />;
  }
  return (
    <li className="flex flex-wrap items-start gap-x-3 text-sm leading-6">
      {mark}
      <span>{text}</span>
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
  return (
    <section
      className="space-y-6 rounded-xl border border-heritage-border bg-heritage-surface p-6"
      aria-label="Kích hoạt kế hoạch"
    >
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Sẵn sàng kích hoạt</h2>
        <p>
          {draft
            ? "Kế hoạch đang nháp; gói Sẵn sàng chưa tự kích hoạt lịch điểm danh."
            : `Trạng thái kế hoạch: ${setup.planStatus}`}
        </p>
        {draft && <ActivationChecklist missing={setup.missingRequirements} />}
        {draft && setup.canActivate && (
          <p role="status">Đủ điều kiện hiện tại. Đọc cảnh báo trước khi kích hoạt.</p>
        )}
      </div>
      {setup.containers.length > 0 && (
        <div className="space-y-3 border-t border-heritage-border pt-4">
          <h3 className="font-semibold">Gói trong kho</h3>
          <ul className="divide-y divide-heritage-border rounded-lg border">
            {setup.containers.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm"
              >
                <span className="min-w-0 break-words font-medium">{c.name}</span>
                <span className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      c.status === "READY"
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {c.status === "READY" ? "Sẵn sàng bàn giao" : "Chưa đủ điều kiện"}
                  </span>
                  <span className="text-heritage-muted">
                    {c.assetCount} tài sản · {c.designationCount} người nhận
                  </span>
                  {c.missingRequirements.length > 0 && (
                    <span className="text-xs text-destructive">
                      {c.missingRequirements
                        .map((code) => missingLabels[code] ?? "Gói còn điều kiện cần kiểm tra.")
                        .join(" ")}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {setup.containers.length === 0 && <p>Chưa có gói nào để bàn giao.</p>}
      {setup.assetsOutsideContainer.length > 0 && (
        <div className="space-y-3 border-t border-heritage-border pt-4">
          <h3 className="font-semibold">Tài sản chưa thuộc gói</h3>
          <p className="text-sm text-heritage-muted">
            Những tài sản này chưa được giao cho ai và sẽ không nằm trong phạm vi bàn giao.
          </p>
          <ul className="list-disc space-y-1 pl-6 text-sm">
            {setup.assetsOutsideContainer.map((a) => (
              <li key={a.id} className="break-words">
                {a.name}{" "}
                <span className="text-heritage-muted">
                  ({a.kind === "FILE" ? "Tệp" : "Văn bản"})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {setup.assetsOutsideContainer.length === 0 && <p>Không có tài sản ngoài gói.</p>}
      {setup.warnings.length > 0 && (
        <div className="space-y-2 border-t border-heritage-border pt-4">
          <h3 className="font-semibold">Cảnh báo</h3>
          <ul className="list-disc space-y-1 pl-6 text-sm text-amber-800">
            {setup.warnings.map((w) => (
              <li key={w}>{Object.hasOwn(warningLabels, w) ? warningLabels[w] : w}</li>
            ))}
          </ul>
        </div>
      )}
      {draft && (
        <div className="space-y-4 border-t border-heritage-border pt-4">
          <h3 className="font-semibold">Thông tin trước khi kích hoạt</h3>
          <p className="text-sm leading-6">{setup.policyText}</p>
          <p className="text-xs text-heritage-muted">Phiên bản: {setup.policyVersion}</p>
          <label className="flex min-h-11 items-start gap-3 text-sm">
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
      {action.pending && <p role="status">Đang gửi yêu cầu…</p>}
      {action.error && (
        <div role="alert" className="space-y-3 text-destructive">
          <p>{action.error}</p>
          <Button variant="outline" onClick={sync}>
            Tải lại điều kiện
          </Button>
        </div>
      )}
    </section>
  );
}
