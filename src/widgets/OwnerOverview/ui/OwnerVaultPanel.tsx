import {
  isOwnerVaultMissing,
  useOwnerPackages,
  useOwnerVault,
} from "@/features/vault-management/model/useOwnerVault";
import { Button, Card, Skeleton } from "@/shared/ui";

/** Nội dung panel dữ liệu server; không sử dụng số liệu hoặc chính sách từ prototype. */
const CONTENT = {
  title: "Kho và gói bàn giao từ máy chủ",
  waiting: "Dữ liệu kho chưa sẵn sàng. Vui lòng đăng nhập để xem kho của bạn.",
  missingTitle: "Bạn chưa có kho di sản.",
  missingDescription: "Kho di sản giúp bạn sắp xếp tài sản và các gói bàn giao.",
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
 * @returns Panel dữ liệu server tách biệt các khối preview trên trang Owner.
 * @example <OwnerVaultPanel enabled={sessionReady} />
 */
export function OwnerVaultPanel({ enabled }: OwnerVaultPanelProps) {
  const vault = useOwnerVault(enabled);
  const packages = useOwnerPackages(enabled && vault.isSuccess);

  return (
    <Card className="rounded-2xl border-heritage-border bg-heritage-surface p-6 shadow-none">
      <h2 className="text-lg font-semibold">{CONTENT.title}</h2>
      {!enabled ? (
        <p role="status" className="text-sm text-heritage-muted">
          {CONTENT.waiting}
        </p>
      ) : vault.isError && isOwnerVaultMissing(vault.error) ? (
        <div role="status" className="space-y-2">
          <p className="font-medium">{CONTENT.missingTitle}</p>
          <p className="text-sm text-heritage-muted">{CONTENT.missingDescription}</p>
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
              <dd className="text-2xl font-semibold">{packages.data.meta.totalItems}</dd>
            </div>
            <div>
              <dt className="text-sm text-heritage-muted">{CONTENT.storage}</dt>
              <dd className="text-2xl font-semibold">{vault.data.storageUsedBytes}</dd>
            </div>
          </dl>
          {packages.data.data.length === 0 ? (
            <p role="status" className="text-sm text-heritage-muted">
              {CONTENT.empty}
            </p>
          ) : (
            <ul aria-label={CONTENT.list} className="divide-y divide-heritage-border">
              {packages.data.data.map((item) => (
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
    </Card>
  );
}
