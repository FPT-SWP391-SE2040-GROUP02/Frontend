import { useSelector } from "react-redux";
import { Vault, FolderOpen, Activity } from "lucide-react";
import type { AuthState } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { Button } from "@/shared/ui/button";
import {
  useOwnerVault,
  isOwnerVaultMissing,
} from "@/features/vault-management/model/useOwnerVault";
import { useCheckIn } from "@/features/dms/model/useCheckIn";
import { CheckInActions } from "@/features/dms/ui/CheckInActions";
import { CreateVaultForm } from "@/features/vault-management/ui/CreateVaultForm";
import { CreateAssetForm } from "@/features/assets/ui/CreateAssetForm";
import { AssetList } from "@/features/assets/ui/AssetList";
import { PlanSetupPanel } from "@/features/plan-setup/ui/PlanSetupPanel";
import { OwnerTrustedPeople } from "./OwnerTrustedPeople";
import { OwnerHandoverOverview } from "./OwnerHandoverOverview";
import { OwnerGroups } from "./OwnerGroups";

function Empty({ title, description }: { title: string; description: string }) {
  return (
    <div
      role="status"
      className="rounded-xl border border-dashed border-heritage-border bg-heritage-surface px-6 py-12 text-center"
    >
      <FolderOpen className="mx-auto mb-4 size-8 text-heritage-gold" aria-hidden="true" />
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-heritage-muted">{description}</p>
    </div>
  );
}

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

const checkInLabels = {
  NOT_STARTED: "Chưa bắt đầu",
  ACTIVE: "Đang trong kỳ điểm danh",
  CHECKIN_OVERDUE: "Đã quá hạn điểm danh",
  AWAITING_CHECK: "Đang chờ kiểm tra",
  PAUSED: "Đang tạm dừng",
};
function CheckIn({ vaultId }: { vaultId: string }) {
  const query = useCheckIn(vaultId);
  if (query.isPending)
    return (
      <p role="status" className="py-8 text-sm text-heritage-muted">
        Đang tải trạng thái điểm danh…
      </p>
    );
  if (query.isError)
    return <QueryError retry={() => void query.refetch()} pending={query.isFetching} />;
  if (!query.data) return null;
  const data = query.data;
  const date = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(
          new Date(value),
        )
      : "Chưa có";
  return (
    <section className="space-y-6 rounded-xl border border-heritage-border bg-heritage-surface p-6">
      <Activity className="size-7 text-heritage-gold" aria-hidden="true" />
      <h2 className="text-lg font-semibold">{checkInLabels[data.status]}</h2>
      <dl className="grid gap-6 sm:grid-cols-2">
        {[
          ["Lần điểm danh gần nhất", date(data.lastCheckInAt)],
          ["Hạn điểm danh tiếp theo", date(data.nextCheckInDueAt)],
          ["Chu kỳ", `${data.settings.cycleDays} ngày`],
          ["Thời gian ân hạn", `${data.settings.graceDays} ngày`],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-heritage-muted">{label}</dt>
            <dd className="mt-2 text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <CheckInActions key={data.settings.etag} vaultId={vaultId} status={data} />
    </section>
  );
}

/** Chỉ đọc DTO đã được tích hợp; chờ kho thật trước khi mount các truy vấn phụ thuộc. */
export function OwnerSection({
  section,
  groupCreate,
}: {
  section: "assets" | "groups" | "plans" | "check-in" | "trusted";
  /** Chỉ dùng cho section "groups": trạng thái hộp thoại "Tạo nhóm" do trang cha điều khiển. */
  groupCreate?: { open: boolean; onOpenChange: (open: boolean) => void };
}) {
  const authenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const vault = useOwnerVault(authenticated && Boolean(accessTokenMemory.get()));
  if (vault.isError && isOwnerVaultMissing(vault.error))
    return (
      <div className="space-y-6">
        <Empty
          title="Bạn chưa có kho di sản"
          description="Kho giúp bạn sắp xếp tài sản, người nhận và kế hoạch bàn giao."
        />
        <CreateVaultForm />
      </div>
    );
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
  if (section === "check-in") return <CheckIn vaultId={vault.data.id} />;
  if (section === "trusted") return <OwnerTrustedPeople vaultId={vault.data.id} />;
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
  if (section === "assets")
    return (
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <AssetList vaultId={vault.data.id} />
        <CreateAssetForm
          vaultId={vault.data.id}
          remainingBytes={vault.data.storageRemainingBytes}
        />
      </div>
    );
  return (
    <div className="space-y-6">
      <OwnerHandoverOverview vaultId={vault.data.id} />
      <PlanSetupPanel vaultId={vault.data.id} />
    </div>
  );
}
