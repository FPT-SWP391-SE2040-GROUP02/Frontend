import {
  isOwnerVaultMissing,
  useOwnerPackages,
  useOwnerVault,
} from "@/features/vault-management/model/useOwnerVault";
import { Vault, Layers3, HardDrive, Users } from "lucide-react";
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
      className="owner-vault-panel space-y-6 rounded-2xl border border-heritage-border bg-heritage-surface p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-heritage-border pb-5">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-heritage-muted">
            Tổng quan lưu trữ
          </p>
          <h2 id="owner-server-vault" className="text-lg font-semibold">
            {CONTENT.title}
          </h2>
        </div>
        {enabled && vault.isSuccess && (
          <span className="max-w-full break-words rounded-full border border-heritage-border bg-heritage-canvas px-3 py-1.5 text-xs font-medium">
            {vault.data.name}
          </span>
        )}
      </div>
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
        <div className="space-y-6">
          <dl className="owner-metrics grid gap-3">
            <div className="owner-metric">
              <dt>
                <Layers3 className="size-4" aria-hidden="true" />
                {CONTENT.packages}
              </dt>
              <dd>{packages.data.totalCount}</dd>
              <dd className="owner-metric-caption">Sắp xếp nội dung để bàn giao</dd>
            </div>
            <div className="owner-metric">
              <dt>
                <HardDrive className="size-4" aria-hidden="true" />
                {CONTENT.storage}
              </dt>
              <dd>{vault.data.storageUsedBytes}</dd>
              <dd className="owner-metric-caption">
                Trên{" "}
                {new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(
                  vault.data.storageQuotaBytes / 1_048_576,
                )}{" "}
                MiB dung lượng
              </dd>
            </div>
            <div className="owner-metric">
              <dt>
                <Users className="size-4" aria-hidden="true" />
                Suất người nhận đang dùng
              </dt>
              <dd>
                {vault.data.usedBeneficiarySlots}
                <span className="ml-2 text-base font-normal text-heritage-muted">
                  / {vault.data.beneficiarySlots}
                </span>
              </dd>
              <dd className="owner-metric-caption">Tính theo chỉ định trong gói</dd>
            </div>
          </dl>
          {packages.data.items.length === 0 ? (
            <p role="status" className="text-sm text-heritage-muted">
              {CONTENT.empty}
            </p>
          ) : (
            <ul aria-label={CONTENT.list} className="grid gap-3 sm:grid-cols-2">
              {packages.data.items.map((item) => (
                <li key={item.id} className="min-w-0 rounded-xl border border-heritage-border p-4">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <Layers3 className="size-5 text-heritage-gold" aria-hidden="true" />
                    <span className="rounded-full bg-heritage-primary/5 px-2.5 py-1 text-[11px] font-medium text-heritage-primary">
                      {item.status === "READY"
                        ? "Sẵn sàng"
                        : item.status === "DRAFT"
                          ? "Nháp"
                          : item.status}
                    </span>
                  </div>
                  <p className="break-words text-sm font-semibold">{item.name}</p>
                  {item.description && (
                    <p className="mt-2 break-words text-xs leading-5 text-heritage-muted">
                      {item.description}
                    </p>
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
