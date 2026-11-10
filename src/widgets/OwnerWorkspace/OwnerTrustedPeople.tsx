import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ExecutorKeyCard, useExecutorKeyStatus } from "@/features/executor-key";
import { usePlanSetup } from "@/features/plan-setup/model/usePlanSetup";
import { ExecutorsSection } from "@/features/plan-setup/ui/ExecutorsSection";
import { ExecutorNoteSection } from "@/features/vault-management/ui/ExecutorNoteForm";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { useHandoverSlipContext } from "./useHandoverSlipContext";

/**
 * Trang Người thực thi: một Người thực thi do Chủ kho mời, mã mở gói giao cho họ và lời dặn để lại.
 * Widget ghép các feature với nhau vì feature không được import lẫn nhau.
 */
export function OwnerTrustedPeople({
  vaultId,
  vaultName,
}: {
  vaultId: string;
  vaultName?: string | null;
}) {
  const slip = useHandoverSlipContext(vaultId, vaultName);
  const setup = usePlanSetup(vaultId);
  const keyStatus = useExecutorKeyStatus(vaultId);

  // Kế hoạch còn nháp thì mã chưa được tạo: giải thích khi nào có và dẫn tới trang Bàn giao.
  let emptyState: ReactNode = undefined;
  let showIssueButton = true;
  if (setup.data !== undefined && setup.data.planStatus === "DRAFT") {
    showIssueButton = false;
    let hasAccepted = false;
    for (const executor of setup.data.executors) {
      if (executor.status === "ACCEPTED") {
        hasAccepted = true;
      }
    }
    let reason = "Mã được tạo khi bạn kích hoạt kế hoạch, sau khi Người thực thi đã đồng ý.";
    if (hasAccepted) {
      reason =
        "Đủ điều kiện. Mã được tạo khi bạn kích hoạt kế hoạch ở trang Bàn giao, kèm phiếu để trao.";
    }
    emptyState = (
      <>
        <p>{reason}</p>
        <Link to={ROUTES.WILLS.ROOT} className={buttonStyles.outline}>
          Đến trang Bàn giao
        </Link>
      </>
    );
  }

  let hasHandoverKey = false;
  if (keyStatus.data !== undefined) {
    hasHandoverKey = keyStatus.data.hasKey;
  }

  return (
    <ExecutorsSection
      vaultId={vaultId}
      hasHandoverKey={hasHandoverKey}
      keySlot={
        <ExecutorKeyCard
          vaultId={vaultId}
          slip={slip}
          showIssueButton={showIssueButton}
          emptyState={emptyState}
        />
      }
      noteSlot={<ExecutorNoteSection />}
    />
  );
}
