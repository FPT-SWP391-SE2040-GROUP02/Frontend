import {
  isOwnerVaultMissing,
  useOwnerPackages,
  useOwnerVault,
} from "@/features/vault-management/model/useOwnerVault";
import { Vault } from "lucide-react";
import { Button, Skeleton } from "@/shared/ui";
import { OwnerResourcesPanel } from "./OwnerResourcesPanel";
import { CreateVaultForm } from "@/features/vault-management/ui/CreateVaultForm";
import { EditVaultForm } from "@/features/vault-management/ui/EditVaultForm";

/** Nội dung panel dữ liệu server; không sử dụng số liệu hoặc chính sách từ prototype. */
const CONTENT = {
  title: "Kho của bạn",
  waiting: "Dữ liệu kho chưa sẵn sàng. Vui lòng đăng nhập để xem kho của bạn.",
  missingTitle: "Bạn chưa có kho di sản.",
  missingDescription:
    "Kho di sản giúp bạn sắp xếp tài sản và các gói bàn giao. Tính năng tạo kho đang được hoàn thiện.",
  loading: "Đang tải kho và gói bàn giao…",
  vaultError: "Không tải được kho. Kiểm tra phiên đăng nhập hoặc thử lại.",
  packagesError: "Không tải được danh sách gói bàn giao. Vui lòng thử lại.",
  retry: "Thử lại",
  empty: "Kho chưa có gói bàn giao.",
  packages: "Tổng số gói bàn giao",
  storage: "Dung lượng đã dùng (byte)",
  list: "Gói bàn giao trên trang hiện tại",
} as const;

/** Cờ sẵn sàng do tầng lắp ghép cấp; không thay thế authorization phía server. */
interface OwnerVaultPanelProps {
  /** Chỉ bật truy vấn sau khi có phiên và access token trong RAM. */
  enabled: boolean;
}

/**
 * @description Đọc kho/gói bằng hooks hiện có và hiển thị bốn trạng thái bất đồng bộ.
 * @param props Cờ phiên sẵn sàng; không tự tạo hoặc kích hoạt kho khi render.
 * @returns Panel dữ liệu kho của tài khoản hiện tại.
 * @example <OwnerVaultPanel enabled={sessionReady} />
 */
export function OwnerVaultPanel({ enabled }: OwnerVaultPanelProps) {
  const vault = useOwnerVault(enabled);
  const packages = useOwnerPackages(vault.data?.id ?? "", enabled && vault.isSuccess);

  return (
    <section
      aria-labelledby="owner-server-vault"
      className="space-y-5 rounded-xl border border-heritage-border bg-heritage-surface p-6"
    >
      <h2 id="owner-server-vault" className="text-base font-semibold">
        {CONTENT.title}
      </h2>
      {!enabled ? (
        <p role="status" className="text-sm text-heritage-muted">
          {CONTENT.waiting}
        </p>
      ) : vault.isError && isOwnerVaultMissing(vault.error) ? (
        <div
          role="status"
          className="flex min-h-60 flex-col items-center justify-center space-y-3 rounded-xl border border-dashed border-heritage-border bg-heritage-canvas px-6 py-10 text-center"
        >
          <Vault className="mb-2 size-10 text-heritage-gold" aria-hidden="true" />
          <p className="font-medium">{CONTENT.missingTitle}</p>
          <p className="text-sm text-heritage-muted">
            Kho di sản giúp bạn sắp xếp tài sản và các gói bàn giao.
          </p>
          <div className="w-full max-w-xl">
            <CreateVaultForm />
          </div>
        </div>
      ) : vault.isError ? (
        <div role="alert" className="space-y-4">
          <p>{CONTENT.vaultError}</p>
          <Button size="lg" onClick={() => void vault.refetch()} disabled={vault.isFetching}>
            {CONTENT.retry}
          </Button>
        </div>
      ) : vault.isPending || packages.isPending ? (
        <div role="status" aria-label={CONTENT.loading} className="space-y-3">
          <span className="sr-only">{CONTENT.loading}</span>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : packages.isError ? (
        <div role="alert" className="space-y-4">
          <p>{CONTENT.packagesError}</p>
          <Button size="lg" onClick={() => void packages.refetch()} disabled={packages.isFetching}>
            {CONTENT.retry}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-heritage-muted">{CONTENT.packages}</dt>
              <dd className="text-2xl font-semibold">{packages.data.totalCount}</dd>
            </div>
            <div>
              <dt className="text-sm text-heritage-muted">{CONTENT.storage}</dt>
              <dd className="text-2xl font-semibold">{vault.data.storageUsedBytes}</dd>
            </div>
          </dl>
          {packages.data.items.length === 0 ? (
            <p role="status" className="text-sm text-heritage-muted">
              {CONTENT.empty}
            </p>
          ) : (
            <ul aria-label={CONTENT.list} className="divide-y divide-heritage-border">
              {packages.data.items.map((item) => (
                <li key={item.id} className="py-3">
                  <p className="font-medium">{item.name}</p>
                  {item.description && (
                    <p className="mt-1 text-sm text-heritage-muted">{item.description}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {enabled && vault.isSuccess && <OwnerResourcesPanel vaultId={vault.data.id} />}
      {enabled && vault.isSuccess && <EditVaultForm vault={vault.data} />}
    </section>
  );
}
