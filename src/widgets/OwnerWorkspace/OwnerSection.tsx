import { useSelector } from "react-redux";
import { Lock, Vault } from "lucide-react";
import type { AuthState } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { confirmVaultPin } from "@/shared/api/vaultPin";
import { vaultPinService } from "@/features/vault-pin/api/vaultPinService";
import { useVaultPinStatus, VaultPinSetupNotice } from "@/features/vault-pin";
import { getVaultLockReason } from "@/entities/vault/model/vaultLock";
import { formatStorageMegabytes } from "@/shared/lib/formatStorageSize";
import { Button } from "@/shared/ui/button";
import { RollingNumber, VaultMeter } from "@/shared/ui/VaultFx";
import {
  useOwnerVault,
  isOwnerVaultMissing,
} from "@/features/vault-management/model/useOwnerVault";
import { VaultEmailRequiredNotice } from "@/features/vault-management/ui/VaultEmailRequiredNotice";
import { CreateAssetForm } from "@/features/assets/ui/CreateAssetForm";
import { AssetList } from "@/features/assets/ui/AssetList";
import { OwnerTrustedPeople } from "./OwnerTrustedPeople";
import { OwnerHandoverOverview } from "./OwnerHandoverOverview";
import { OwnerAssignments } from "./OwnerAssignments";
import { ResignNotice } from "./ResignNotice";

/** Kho chưa đặt mã PIN: mời đặt PIN trên đầu màn Tài sản (BE chặn tạo tài sản tới khi có PIN). */
function VaultPinSetupBanner({ vaultId }: { vaultId: string }) {
  const pinStatus = useVaultPinStatus(vaultId);
  if (!pinStatus.isSuccess || pinStatus.data.isSet) return null;
  return <VaultPinSetupNotice vaultId={vaultId} />;
}

/**
 * Form thêm tài sản chỉ mở khi kho đã có PIN. Lỗi tải trạng thái PIN vẫn hiện form: Backend vẫn tự chặn
 * bằng 409 VAULT_PIN_NOT_SET nên không cần chặn thêm ở đây.
 */
function AssetCreatePanel({
  vaultId,
  remainingBytes,
  lockReason,
}: {
  vaultId: string;
  remainingBytes: number;
  /** Lý do kho đang bị khóa (hồ sơ chứng tử, bàn giao...); khác null thì không cho thêm tài sản. */
  lockReason: string | null;
}) {
  const pinStatus = useVaultPinStatus(vaultId);
  if (lockReason !== null) {
    return (
      <div
        role="status"
        className="rounded-xl border border-dashed border-heritage-border bg-heritage-surface px-6 py-10 text-center"
      >
        <Lock className="mx-auto mb-3 size-6 text-heritage-gold" aria-hidden="true" />
        <p className="text-sm font-semibold">Thêm tài sản đang bị khóa</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-heritage-muted">{lockReason}</p>
      </div>
    );
  }
  if (pinStatus.isPending) {
    return (
      <p role="status" className="text-sm text-heritage-muted">
        Đang kiểm tra mã PIN tài sản…
      </p>
    );
  }
  if (pinStatus.isSuccess && !pinStatus.data.isSet) {
    return (
      <div
        role="status"
        className="rounded-xl border border-dashed border-heritage-border bg-heritage-surface px-6 py-10 text-center"
      >
        <Lock className="mx-auto mb-3 size-6 text-heritage-gold" aria-hidden="true" />
        <p className="text-sm font-semibold">Thêm tài sản đang bị khóa</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-heritage-muted">
          Đặt mã PIN cho tài sản ở phía trên để bắt đầu thêm tài sản.
        </p>
      </div>
    );
  }
  return <CreateAssetForm vaultId={vaultId} remainingBytes={remainingBytes} />;
}

/** Dung lượng đã dùng: phần số cuộn như khóa số, còn "< 0,01 MB" hay dấu gạch thì giữ nguyên chữ. */
function UsedAmount({ bytes }: { bytes: number }) {
  const text = formatStorageMegabytes(bytes);
  const match = /^([\d.,]+) MB$/.exec(text);
  if (match === null) {
    return <>{text}</>;
  }
  return (
    <>
      <RollingNumber value={match[1]} small /> MB
    </>
  );
}

/** Hiển thị lỗi có đường phục hồi; không chuyển lỗi API thành empty/zero. */
function QueryError({ retry, pending }: { retry: () => void; pending: boolean }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-heritage-danger-border bg-heritage-danger-bg p-6"
    >
      <p className="text-sm text-heritage-danger">Không tải được dữ liệu. Vui lòng thử lại.</p>
      <Button variant="outline" disabled={pending} onClick={retry} className="mt-4 min-h-11">
        Thử lại
      </Button>
    </div>
  );
}

/** Chỉ đọc DTO đã được tích hợp; chờ kho thật trước khi mount các truy vấn phụ thuộc. */
export function OwnerSection({
  section,
}: {
  section: "assets" | "assignments" | "plans" | "trusted";
}) {
  const authenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const vault = useOwnerVault(authenticated && Boolean(accessTokenMemory.get()));
  // Kho tự tạo khi đọc; còn "thiếu kho" nghĩa là email chưa xác minh.
  if (vault.isError && isOwnerVaultMissing(vault.error)) return <VaultEmailRequiredNotice />;
  if (vault.isError)
    return <QueryError retry={() => void vault.refetch()} pending={vault.isFetching} />;
  if (!authenticated) return <p role="status">Vui lòng đăng nhập để xem tài sản.</p>;
  if (vault.isPending)
    return (
      <div
        role="status"
        className="flex items-center gap-3 rounded-xl border border-heritage-border p-6 text-sm text-heritage-muted"
      >
        <Vault className="size-5" aria-hidden="true" />
        Đang tải tài sản của bạn…
      </div>
    );
  if (section === "trusted") return <OwnerTrustedPeople vaultId={vault.data.id} />;
  if (section === "assignments") {
    return (
      <div className="space-y-6">
        <ResignNotice vaultId={vault.data.id} />
        <OwnerAssignments vaultId={vault.data.id} lockReason={getVaultLockReason(vault.data)} />
      </div>
    );
  }
  if (section === "assets") {
    const usedBytes = Math.max(0, vault.data.storageUsedBytes);
    return (
      <div className="space-y-6">
        <section
          aria-label="Dung lượng lưu trữ"
          className="rounded-2xl border border-heritage-border bg-heritage-surface p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-semibold text-heritage-text">Dung lượng sử dụng</span>
            <span className="text-heritage-muted">
              Đã dùng{" "}
              <strong className="font-semibold text-heritage-text">
                <UsedAmount bytes={usedBytes} />
              </strong>{" "}
              / {formatStorageMegabytes(vault.data.storageQuotaBytes)} (còn{" "}
              {formatStorageMegabytes(vault.data.storageRemainingBytes)})
            </span>
          </div>
          <VaultMeter
            usedBytes={usedBytes}
            quotaBytes={vault.data.storageQuotaBytes}
            label="Dung lượng đã dùng"
          />
        </section>
        <VaultPinSetupBanner vaultId={vault.data.id} />
        {/* Lưới 12 cột: danh sách (nội dung chính, đọc trước) chiếm 8 cột, form thêm mục 4 cột; dưới xl xếp dọc để bảng đủ rộng. */}
        <div className="grid items-start gap-6 xl:grid-cols-12">
          <div className="min-w-0 xl:col-span-8">
            <AssetList
              vaultId={vault.data.id}
              confirmPin={() =>
                confirmVaultPin(vault.data.id, (pin) => vaultPinService.verify(vault.data.id, pin))
              }
              lockReason={getVaultLockReason(vault.data)}
            />
          </div>
          <div className="min-w-0 xl:col-span-4">
            <AssetCreatePanel
              vaultId={vault.data.id}
              remainingBytes={vault.data.storageRemainingBytes}
              lockReason={getVaultLockReason(vault.data)}
            />
          </div>
        </div>
      </div>
    );
  }
  return <OwnerHandoverOverview vaultId={vault.data.id} />;
}
