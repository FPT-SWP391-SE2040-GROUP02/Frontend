import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { formatStorageSize } from "@/shared/lib/formatStorageSize";
import { buttonStyles, Panel } from "@/shared/ui/heritageKit";
import { deathCaseService } from "../api/deathCaseService";

const KIND_LABELS: Record<string, string> = { FILE: "Tệp", TEXT: "Văn bản" };

/** Lưu Blob thành tệp qua thẻ a tạm; thu hồi URL ngay sau đó để không giữ nội dung trong bộ nhớ. */
function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Tài sản của kho Người thực thi đang phụ trách. Người thực thi được xem và tải để chuẩn bị hồ sơ; mỗi lần tải được
 * ghi nhật ký kho. Chỉ hiện danh sách mô tả, nội dung chỉ tải khi bấm.
 */
export function ExecutorAssets({ vaultId }: { vaultId: string }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const query = useQuery({
    queryKey: ["executor-assets", vaultId],
    queryFn: ({ signal }) => deathCaseService.assets(vaultId, signal),
    retry: false,
  });
  const download = async (assetId: string, fileName: string) => {
    if (busyId) return;
    setBusyId(assetId);
    setError("");
    try {
      saveBlob(await deathCaseService.downloadAsset(vaultId, assetId), fileName);
    } catch {
      setError("Chưa tải được tài sản này. Vui lòng thử lại sau.");
    } finally {
      setBusyId(null);
    }
  };
  return (
    <Panel title="Tài sản trong kho">
      {query.isPending && <p className="text-sm text-heritage-muted">Đang tải danh sách…</p>}
      {query.isError && (
        <p role="alert" className="text-sm text-destructive">
          Chưa xem được danh sách tài sản.
        </p>
      )}
      {query.isSuccess && query.data.items.length === 0 && (
        <p className="text-sm text-heritage-muted">Kho chưa có tài sản nào.</p>
      )}
      {query.isSuccess && query.data.items.length > 0 && (
        <ul className="divide-y divide-heritage-border">
          {query.data.items.map((asset) => (
            <li key={asset.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span className="min-w-0">
                <span className="block break-words text-sm font-semibold">{asset.name}</span>
                <span className="block text-xs text-heritage-muted">
                  {KIND_LABELS[asset.kind.toUpperCase()] ?? "Mục"} ·{" "}
                  {formatStorageSize(asset.sizeBytes)}
                </span>
              </span>
              <button
                type="button"
                className={buttonStyles.outline}
                aria-label={`Tải xuống ${asset.name}`}
                disabled={busyId !== null}
                onClick={() =>
                  void download(
                    asset.id,
                    (asset.fileName ?? `${asset.name}.txt`).replace(/[^\p{L}\p{N} ._()-]/gu, "_"),
                  )
                }
              >
                <Download className="size-4" aria-hidden="true" />
                {busyId === asset.id ? "Đang tải…" : "Tải xuống"}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <p className="mt-3 text-xs text-heritage-muted">
        Mỗi lần tải được ghi vào nhật ký kho, ghi rõ do Người thực thi thực hiện.
      </p>
    </Panel>
  );
}
