import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import type { HandoverSlipContext } from "@/features/executor-key";
import { usePlanSetup } from "@/features/plan-setup/model/usePlanSetup";

const NO_VAULT_NAME = "Chưa đặt tên";
const NO_EXECUTOR = "Chưa có Người thực thi";

/**
 * Ghép phần "ai, kho nào, Người thực thi nào" in lên phiếu bàn giao mã mở gói.
 * Backend không trả họ tên Người thực thi nên dùng email của người đã chấp nhận lời mời.
 */
export function useHandoverSlipContext(
  vaultId: string,
  vaultName: string | null | undefined,
): HandoverSlipContext {
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  const plan = usePlanSetup(vaultId);

  let ownerName = "";
  if (user) {
    ownerName = user.fullName;
  }
  let displayVaultName = NO_VAULT_NAME;
  if (vaultName) {
    displayVaultName = vaultName;
  }
  let executorEmail = NO_EXECUTOR;
  if (plan.data) {
    for (const executor of plan.data.executors) {
      if (executor.status === "ACCEPTED" && executorEmail === NO_EXECUTOR) {
        executorEmail = executor.inviteeEmail;
      }
    }
  }
  return { ownerName, vaultName: displayVaultName, executorEmail };
}
