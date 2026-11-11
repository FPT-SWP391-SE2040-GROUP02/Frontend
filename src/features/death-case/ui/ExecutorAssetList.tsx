import { useId, useState } from "react";
import { Lock, Search } from "lucide-react";
import { formatDate } from "@/shared/lib/dateFormat";
import { buttonStyles, Chip, Panel } from "@/shared/ui/heritageKit";
import type { ExecutorVault } from "../model/deathCase.schema";
import {
  assetBadge,
  assetDownloadState,
  filterPackages,
  packageStatus,
  recipientLabels,
  turnsOfPackage,
  type AssetDownloadState,
} from "../model/executorAssets";
import type { HandoverProgressTurn } from "../model/handoverProgress.schema";
import { useDeathCase } from "../model/useDeathCase";
import { useExecutorPackages } from "../model/useExecutorPackages";
import { useHandoverProgress } from "../model/useHandoverProgress";

const DOWNLOAD_CHIPS: Record<AssetDownloadState, { label: string; tone: "success" | "neutral" }> = {
  downloaded: { label: "Đã tải", tone: "success" },
  "not-downloaded": { label: "Chưa tải", tone: "neutral" },
  "not-handed-over": { label: "Không bàn giao", tone: "neutral" },
};

/** Khung vàng nhạt: hướng dẫn bàn giao Chủ kho để lại cho Người thực thi (giữ xuống dòng). */
function GuideBox({ vault }: { vault: ExecutorVault }) {
  return (
    <section
      aria-labelledby="executor-guide-title"
      className="rounded-2xl border border-[#E0C486] bg-[#FBF3E0] p-5"
    >
      <h2 id="executor-guide-title" className="text-base font-semibold text-heritage-primary">
        Hướng dẫn bàn giao từ Chủ kho
      </h2>
      {vault.executorNote ? (
        <>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{vault.executorNote}</p>
          {vault.executorNoteUpdatedAt && (
            <p className="mt-3 text-xs text-heritage-muted">
              Cập nhật {formatDate(vault.executorNoteUpdatedAt)}
            </p>
          )}
        </>
      ) : (
        <p className="mt-3 text-sm text-heritage-muted">Chủ kho chưa để lại hướng dẫn.</p>
      )}
    </section>
  );
}

/**
 * Tài sản và hướng dẫn của kho, gom theo gói bàn giao. Người thực thi chỉ thấy tên, loại, người nhận và
 * trạng thái tải, không có nút xem hay tải: nội dung chỉ người nhận mở được sau khi nhập mã mở gói.
 */
export function ExecutorAssetList({ vault }: { vault: ExecutorVault }) {
  const searchId = useId();
  const [search, setSearch] = useState("");
  const packages = useExecutorPackages(vault.vaultId);
  const record = useDeathCase(vault.openDeathCaseId).data;
  const approved = record?.status === "APPROVED_FOR_HANDOVER";
  const progress = useHandoverProgress(
    vault.openDeathCaseId ?? "",
    Boolean(vault.openDeathCaseId) && approved,
  );

  if (packages.isPending) return <p role="status">Đang tải danh sách tài sản…</p>;
  if (packages.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p>Không tải được danh sách tài sản.</p>
        <button
          type="button"
          className={buttonStyles.outline}
          onClick={() => void packages.refetch()}
        >
          Thử lại
        </button>
      </div>
    );
  }
  let turns: HandoverProgressTurn[] = [];
  if (progress.data && progress.data.handoverStarted) turns = progress.data.turns;
  const shown = filterPackages(packages.data, search);
  let assetCount = 0;
  for (const item of shown) {
    assetCount += item.assets.length;
  }

  return (
    <div className="space-y-6">
      <GuideBox vault={vault} />
      {packages.data.length === 0 && (
        <Panel title="Chưa có gói bàn giao">
          <p role="status" className="text-sm text-heritage-muted">
            Kho của {vault.ownerFullName} chưa có gói nào sẵn sàng bàn giao.
          </p>
        </Panel>
      )}
      {packages.data.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-heritage-muted"
              aria-hidden="true"
            />
            <label htmlFor={searchId} className="sr-only">
              Tìm tên tài sản hoặc người nhận
            </label>
            <input
              id={searchId}
              type="search"
              value={search}
              placeholder="Tìm tên tài sản hoặc người nhận"
              className="min-h-11 w-full rounded-xl border border-heritage-border bg-white pl-9 pr-3 text-sm"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <p role="status" className="text-sm text-heritage-muted">
            {assetCount} tài sản trong {shown.length} gói
          </p>
        </div>
      )}
      {packages.data.length > 0 && shown.length === 0 && (
        <p role="status" className="text-sm text-heritage-muted">
          Không có tài sản hoặc người nhận nào khớp với “{search.trim()}”.
        </p>
      )}
      {shown.map((item) => {
        const packageTurns = turnsOfPackage(item, turns);
        const status = packageStatus(packageTurns);
        const recipients = recipientLabels(item);
        return (
          <Panel
            key={item.containerId}
            title={item.containerName}
            action={<Chip tone={status.tone}>{status.label}</Chip>}
          >
            <p className="mb-4 text-sm text-heritage-muted">
              Người nhận: {recipients.length === 0 ? "chưa có người nhận" : recipients.join(", ")}
            </p>
            <ul className="divide-y divide-heritage-border">
              {item.assets.map((asset) => {
                const state = assetDownloadState(asset.id, packageTurns);
                const chip = DOWNLOAD_CHIPS[state];
                return (
                  <li key={asset.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span
                      aria-hidden="true"
                      className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-heritage-gold-border bg-heritage-gold-light text-[11px] font-bold text-heritage-gold"
                    >
                      {assetBadge(asset.name, asset.kind)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-medium">{asset.name}</p>
                      <p className="text-xs text-heritage-muted">
                        {asset.kind === "TEXT" ? "Nội dung chữ" : "Tệp"}
                      </p>
                    </div>
                    <Chip tone={chip.tone}>{chip.label}</Chip>
                    <Lock
                      className="size-4 shrink-0 text-heritage-muted"
                      aria-label="Nội dung được khóa, bạn không mở được"
                      role="img"
                    />
                  </li>
                );
              })}
            </ul>
          </Panel>
        );
      })}
      <p className="flex items-start gap-2 text-xs leading-5 text-heritage-muted">
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        Người thực thi chỉ thấy tên tài sản, loại và trạng thái tải. Nội dung chỉ người nhận mở được
        sau khi nhập mã mở gói.
      </p>
    </div>
  );
}
