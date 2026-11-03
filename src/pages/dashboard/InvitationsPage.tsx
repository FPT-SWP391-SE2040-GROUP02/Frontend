import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { MyInvitationsInbox } from "@/features/plan-setup/ui/MyInvitationsInbox";
import { useExecutorVaults } from "@/features/death-case/model/useExecutorVaults";
import type { ExecutorVault } from "@/features/death-case/model/deathCase.schema";
import { ROUTES } from "@/shared/config/routes.config";
import { Chip, Panel, type Tone } from "@/shared/ui/heritageKit";
import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";

/** Trạng thái kho nhìn từ phía Người thực hiện; cùng cách gọi với bộ chọn kho của không gian Người thực hiện. */
function vaultState(vault: ExecutorVault): { label: string; tone: Tone } {
  if (vault.openDeathCaseId) return { label: "Hồ sơ đang xử lý", tone: "warning" };
  if (vault.checkInOverdue) return { label: "Quá hạn điểm danh", tone: "danger" };
  return { label: "Đang chạy bình thường", tone: "success" };
}

/** Kho mà tài khoản đang là Người thực hiện; không có kho nào thì không hiện mục này. */
function ResponsibleVaults() {
  const authenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const vaults = useExecutorVaults(authenticated && Boolean(accessTokenMemory.get()));
  if (!vaults.isSuccess || vaults.data.length === 0) return null;
  return (
    <Panel title="Kho bạn đang nhận trách nhiệm" labelledBy="responsible-vaults-heading">
      <ul className="divide-y divide-heritage-border">
        {vaults.data.map((vault) => {
          const state = vaultState(vault);
          return (
            <li key={vault.vaultId} className="flex flex-wrap items-center gap-3 py-3">
              <span className="min-w-0 flex-1 font-semibold">{vault.ownerFullName}</span>
              <Chip tone={state.tone}>{state.label}</Chip>
              <Link
                to={`${ROUTES.EXECUTOR.ROOT}?vault=${encodeURIComponent(vault.vaultId)}`}
                className="text-sm font-medium text-heritage-primary underline"
              >
                Mở trong không gian Người thực hiện
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-sm text-heritage-muted">
        Bạn có thể rời vai Người thực hiện bất cứ lúc nào bằng cách báo Chủ kho để họ mời người
        khác.
      </p>
    </Panel>
  );
}

/** Nội dung trang Lời mời, dùng chung cho không gian Chủ kho và Người thực hiện. */
export function InvitationsContent() {
  return (
    <div className="space-y-6">
      <MyInvitationsInbox />
      <ResponsibleVaults />
    </div>
  );
}

const DESCRIPTION =
  "Ai mời bạn làm Người thực hiện, bạn nhận hay từ chối, và bạn đang nhận trách nhiệm cho những kho nào.";

export function InvitationsPage() {
  return (
    <OwnerWorkspace title="Lời mời" description={DESCRIPTION}>
      <InvitationsContent />
    </OwnerWorkspace>
  );
}
