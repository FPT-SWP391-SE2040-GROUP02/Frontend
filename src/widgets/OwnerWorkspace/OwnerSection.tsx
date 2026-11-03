import { useSelector } from "react-redux";
import { Vault } from "lucide-react";
import type { AuthState } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { Button } from "@/shared/ui/button";
import {
  useOwnerVault,
  isOwnerVaultMissing,
} from "@/features/vault-management/model/useOwnerVault";
import { AutoCreateVault } from "@/features/vault-management/ui/AutoCreateVault";
import { OwnerRelatedPeople } from "./OwnerRelatedPeople";
import { OwnerGroups } from "./OwnerGroups";
import { OwnerAssets } from "./OwnerAssets";
import { OwnerPackages } from "./OwnerPackages";
import { OwnerCheckIn } from "./OwnerCheckIn";

/** Hiển thị lỗi có đường phục hồi; không chuyển lỗi API thành empty/zero. */
function QueryError({ retry, pending }: { retry: () => void; pending: boolean }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6">
      <p className="text-sm text-red-800">Không tải được dữ liệu. Vui lòng thử lại.</p>
      <Button variant="outline" disabled={pending} onClick={retry} className="mt-4 min-h-11">
        Thử lại
      </Button>
    </div>
  );
}

/** Chỉ đọc DTO đã được tích hợp; chờ kho thật trước khi mount các truy vấn phụ thuộc. */
export function OwnerSection({
  section,
  groupCreate,
}: {
  section: "assets" | "packages" | "groups" | "check-in" | "people";
  /** Chỉ dùng cho section "groups": trạng thái hộp thoại "Tạo gói bàn giao" do trang cha điều khiển. */
  groupCreate?: { open: boolean; onOpenChange: (open: boolean) => void };
}) {
  const authenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const vault = useOwnerVault(authenticated && Boolean(accessTokenMemory.get()));
  if (vault.isError && isOwnerVaultMissing(vault.error)) return <AutoCreateVault />;
  if (vault.isError)
    return <QueryError retry={() => void vault.refetch()} pending={vault.isFetching} />;
  if (!authenticated) return <p role="status">Vui lòng đăng nhập để xem kho.</p>;
  if (vault.isPending)
    return (
      <div
        role="status"
        className="flex items-center gap-3 rounded-xl border border-heritage-border p-6 text-sm text-heritage-muted"
      >
        <Vault className="size-5" aria-hidden="true" />
        Đang tải kho của bạn…
      </div>
    );
  if (section === "check-in") return <OwnerCheckIn vaultId={vault.data.id} />;
  if (section === "people") return <OwnerRelatedPeople vaultId={vault.data.id} />;
  if (section === "groups") {
    let open = false;
    let onOpenChange = (value: boolean): void => {
      void value;
    };
    if (groupCreate) {
      open = groupCreate.open;
      onOpenChange = groupCreate.onOpenChange;
    }
    return (
      <OwnerGroups vaultId={vault.data.id} createOpen={open} onCreateOpenChange={onOpenChange} />
    );
  }
  if (section === "packages") return <OwnerPackages vaultId={vault.data.id} />;
  return <OwnerAssets vault={vault.data} />;
}
