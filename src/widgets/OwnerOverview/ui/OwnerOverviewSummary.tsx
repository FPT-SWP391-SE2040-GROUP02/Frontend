import { Link } from "react-router-dom";
import type { VaultResponse } from "@/entities/vault/model/vault.types";
import { ROUTES } from "@/shared/config/routes.config";
import { formatStorageMegabytes } from "@/shared/lib/formatStorageSize";
import { ActivityIcon } from "@/shared/ui/LegacyVaultArtwork";
import { presentOverviewPlan, storagePercent } from "../model/overviewPresentation";
import type { OverviewResources } from "../model/useOverviewResources";
import { OverviewQueryState } from "./OverviewQueryState";

export function OwnerOverviewSummary({
  vault,
  data,
}: {
  vault: VaultResponse;
  data: OverviewResources;
}) {
  const plan = presentOverviewPlan(vault.planStatus);
  return (
    <>
      <section className="overview-hero" aria-label="Trạng thái tài sản và bàn giao">
        <div className="overview-hero-message">
          <p className="overview-eyebrow">
            <span className="overview-status-dot" /> Trạng thái kế hoạch
          </p>
          <h2>{plan.title}</h2>
          {vault.planStatus !== "DRAFT" && vault.planStatus !== "ACTIVE" && (
            <p>{plan.description}</p>
          )}
          <Link to={ROUTES.WILLS.ROOT} className="overview-hero-link">
            Xem kế hoạch bàn giao →
          </Link>
        </div>
        <div className="overview-check-in">
          <h3>
            <ActivityIcon className="size-4 shrink-0 text-heritage-gold" aria-hidden="true" /> Khi
            cần bàn giao
          </h3>
          <p>
            Khi có việc xảy ra, người nhận gửi yêu cầu kèm giấy tờ. Luật sư xét giấy tờ và lập
            phương án chia, kiểm danh tính người nhận, rồi ba bên ký biên bản bàn giao. Hệ thống chỉ
            giao tài sản theo biên bản đó.
          </p>
        </div>
      </section>
      <section aria-label="Thống kê tài sản" className="overview-metrics">
        <div className="overview-stat">
          <h2>Tài sản đang lưu</h2>
          <OverviewQueryState query={data.assets}>
            <p className="overview-stat-value">{data.assets.data?.totalCount}</p>
          </OverviewQueryState>
        </div>
        <div className="overview-stat">
          <h2>Dung lượng đã dùng</h2>
          <p className="overview-storage-value">
            <strong>{formatStorageMegabytes(vault.storageUsedBytes)}</strong>
            <span> / {formatStorageMegabytes(vault.storageQuotaBytes)}</span>
          </p>
          <div
            className="overview-progress"
            role="progressbar"
            aria-label="Dung lượng đã dùng"
            aria-valuenow={Math.round(
              storagePercent(vault.storageUsedBytes, vault.storageQuotaBytes),
            )}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span
              style={{
                width: `${storagePercent(vault.storageUsedBytes, vault.storageQuotaBytes)}%`,
              }}
            />
          </div>
        </div>
        <div className="overview-stat">
          <h2>Hồ sơ người nhận</h2>
          <OverviewQueryState query={data.beneficiaries}>
            <p className="overview-stat-value">{data.beneficiaries.data?.totalCount}</p>
          </OverviewQueryState>
        </div>
        <div className="overview-stat">
          <h2>Tài sản đã gán</h2>
          <p className="overview-stat-value">{vault.assignedAssetCount}</p>
        </div>
      </section>
    </>
  );
}
