import { PlanSetupPanel } from "@/features/plan-setup/ui/PlanSetupPanel";
import { buttonStyles, InfoRow, Notice, Panel } from "@/shared/ui/heritageKit";
import type { OwnerStepProps } from "./stepTypes";

const MISSING_TO_STEP: Record<string, { stepId: string; label: string }> = {
  OWNER_EKYC_REQUIRED: { stepId: "identity", label: "Xác minh bạn là chính chủ" },
  PAID_SERVICE_REQUIRED: { stepId: "service-tier", label: "Chọn hạng dịch vụ" },
  READY_CONTAINER_REQUIRED: { stepId: "package", label: "Gói nào trao cho ai?" },
  PRIMARY_EXECUTOR_REQUIRED: { stepId: "executor", label: "Ai sẽ báo tin khi bạn không còn?" },
};

/** Bước 7: điều khoản + nút kích hoạt của PlanSetupPanel; chưa đủ điều kiện thì chỉ đường quay lại. */
export function ActivateStep({ vault, setup, onSelectStep }: OwnerStepProps) {
  if (setup === null) {
    return (
      <Notice tone="warning" role="alert" title="Chưa kiểm tra được điều kiện kích hoạt">
        Kiểm tra mạng rồi bấm Thử lại ở phía trên.
      </Notice>
    );
  }
  const blockers = setup.missingRequirements.filter((code) => Object.hasOwn(MISSING_TO_STEP, code));
  return (
    <div className="space-y-6">
      {setup.planStatus === "DRAFT" && blockers.length > 0 && (
        <Notice tone="warning" title="Còn việc cần làm trước khi kích hoạt">
          <ul className="mt-2 space-y-2">
            {blockers.map((code) => (
              <li key={code} className="flex flex-wrap items-center gap-3">
                <span>{MISSING_TO_STEP[code].label}</span>
                <button
                  type="button"
                  className={buttonStyles.outline}
                  onClick={() => onSelectStep(MISSING_TO_STEP[code].stepId)}
                >
                  Quay lại bước này
                </button>
              </li>
            ))}
          </ul>
        </Notice>
      )}
      <Panel title="Kế hoạch của bạn gồm" labelledBy="activate-summary-title">
        <dl>
          <InfoRow label="Gói bàn giao">{vault.activeContainerCount}</InfoRow>
          <InfoRow label="Người nhận">
            {vault.usedBeneficiarySlots} / {vault.beneficiarySlots} suất đã chỉ định
          </InfoRow>
        </dl>
      </Panel>
      <PlanSetupPanel vaultId={vault.id} />
    </div>
  );
}
