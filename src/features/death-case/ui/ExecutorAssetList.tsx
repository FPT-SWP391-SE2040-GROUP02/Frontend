import { FileText, Lock, NotebookText } from "lucide-react";
import type { ExecutorVault } from "../model/deathCase.schema";
import { useExecutorPackages } from "../model/useExecutorPackages";
import { buttonStyles, Chip, Notice, Panel } from "@/shared/ui/heritageKit";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Danh sách tài sản của kho theo từng gói bàn giao. Người thực thi chỉ thấy tên, loại và dung lượng,
 * không có nút xem hay tải: nội dung chỉ người nhận mở được.
 */
export function ExecutorAssetList({ vault }: { vault: ExecutorVault }) {
  const query = useExecutorPackages(vault.vaultId);
  if (query.isPending) return <p role="status">Đang tải danh sách tài sản…</p>;
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p>Không tải được danh sách tài sản.</p>
        <button type="button" className={buttonStyles.outline} onClick={() => void query.refetch()}>
          Thử lại
        </button>
      </div>
    );
  }
  const packages = query.data;
  return (
    <div className="space-y-6">
      <Notice tone="neutral" title="Bạn chỉ thấy danh sách">
        <span className="inline-flex items-center gap-2">
          <Lock className="size-4 shrink-0" aria-hidden="true" />
          Nội dung chỉ người nhận mở được.
        </span>
      </Notice>
      {packages.length === 0 && (
        <Panel title="Chưa có gói bàn giao">
          <p role="status" className="text-sm text-heritage-muted">
            Kho của {vault.ownerFullName} chưa có gói nào sẵn sàng bàn giao.
          </p>
        </Panel>
      )}
      {packages.map((item) => (
        <Panel
          key={item.containerId}
          title={item.containerName}
          action={<Chip>{item.assets.length} tài sản</Chip>}
        >
          <p className="mb-4 text-sm text-heritage-muted">
            Giao cho{" "}
            {item.recipients.length === 0
              ? "chưa có người nhận"
              : item.recipients
                  .map((recipient) => recipient.fullName ?? `CCCD ***${recipient.citizenIdLast4}`)
                  .join(", ")}
          </p>
          <ul className="divide-y divide-heritage-border">
            {item.assets.map((asset) => (
              <li key={asset.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-heritage-gold-border bg-heritage-gold-light text-heritage-gold"
                >
                  {asset.kind === "TEXT" ? (
                    <NotebookText className="size-4" />
                  ) : (
                    <FileText className="size-4" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="break-words font-medium">{asset.name}</p>
                  <p className="text-xs text-heritage-muted">
                    {asset.kind === "TEXT" ? "Nội dung chữ" : "Tệp"} · {formatSize(asset.sizeBytes)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      ))}
    </div>
  );
}
