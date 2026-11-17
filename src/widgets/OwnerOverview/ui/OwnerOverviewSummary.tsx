import { Link } from "react-router-dom";
import type { VaultResponse } from "@/entities/vault/model/vault.types";
import { ROUTES } from "@/shared/config/routes.config";
import { formatStorageMegabytes } from "@/shared/lib/formatStorageSize";
import { QuickCheckIn } from "@/features/dms/ui/QuickCheckIn";
import { ActivityIcon } from "@/shared/ui/LegacyVaultArtwork";
import { overviewDate, presentOverviewPlan, storagePercent } from "../model/overviewPresentation";
import type { OverviewResources } from "../model/useOverviewResources";
import { OverviewQueryState } from "./OverviewQueryState";

/** Một nhịp tim gọn như màn hình theo dõi: đường phẳng, nốt nhỏ, mũi nhọn lên, vòng sâu xuống, sóng T. */
const ECG_LIVE =
  "M0 12L6 11.8L14 12.2L22 12L30 12L36 12.1L40 12L43 12L45 13.6L47 12L50 12L54 1.5L60 22L65 12.4L69 7.5L72 7.2L74 8.2L76 7.6L79 8.4L82 12L90 12.1L100 11.9L120 12";
/** Khi kế hoạch chưa chạy: đường gần phẳng. */
const ECG_IDLE = "M0 12L15 11.8L30 12.2L45 11.9L60 12.1L75 11.8L90 12.2L105 12L120 12";

const checkInLabels: Record<string, string> = {
  NOT_STARTED: "Chưa bắt đầu kỳ điểm danh",
  ACTIVE: "Đang trong kỳ điểm danh",
  CHECKIN_OVERDUE: "Đã quá hạn điểm danh",
  AWAITING_CHECK: "Đang chờ kiểm tra",
  PAUSED: "Điểm danh đang tạm dừng",
};

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
      <section className="overview-hero" aria-label="Trạng thái kho và điểm danh">
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
        <div
          className={
            vault.planStatus === "ACTIVE" ? "overview-check-in is-live" : "overview-check-in"
          }
        >
          <h3>
            <ActivityIcon className="size-4 shrink-0 text-heritage-gold" aria-hidden="true" /> Điểm
            danh định kỳ
          </h3>
          <div className="overview-monitor" aria-hidden="true">
            <svg className="overview-heartbeat" viewBox="0 0 120 24">
              <path
                className="overview-heartbeat-glow"
                d={vault.planStatus === "ACTIVE" ? ECG_LIVE : ECG_IDLE}
                pathLength="100"
              />
              <path
                className="overview-heartbeat-halo"
                d={vault.planStatus === "ACTIVE" ? ECG_LIVE : ECG_IDLE}
                pathLength="100"
              />
              <path
                className="overview-heartbeat-line"
                d={vault.planStatus === "ACTIVE" ? ECG_LIVE : ECG_IDLE}
                pathLength="100"
              />
              {vault.planStatus === "ACTIVE" && (
                <circle
                  className="overview-heartbeat-dot"
                  r="1.6"
                  style={{ offsetPath: `path("${ECG_LIVE}")` }}
                />
              )}
            </svg>
          </div>
          <OverviewQueryState query={data.checkIn}>
            {data.checkIn.data && (
              <>
                <p>{checkInLabels[data.checkIn.data.status]}</p>
                <dl>
                  <div>
                    <dt>Lần gần nhất</dt>
                    <dd>{overviewDate(data.checkIn.data.lastCheckInAt)}</dd>
                  </div>
                  <div>
                    <dt>Hạn tiếp theo</dt>
                    <dd>{overviewDate(data.checkIn.data.nextCheckInDueAt)}</dd>
                  </div>
                </dl>
                <QuickCheckIn
                  vaultId={vault.id}
                  status={data.checkIn.data}
                  onCheckedIn={() => void data.audit.refetch()}
                />
                <p className="overview-check-in-note">
                  Chu kỳ {data.checkIn.data.settings.cycleDays} ngày
                </p>
              </>
            )}
          </OverviewQueryState>
        </div>
      </section>
      <section aria-label="Thống kê kho" className="overview-metrics">
        <div className="overview-stat">
          <h2>Tài sản trong kho</h2>
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
            <p className="overview-muted">
              {vault.usedBeneficiarySlots} / {vault.beneficiarySlots} suất đã chỉ định
            </p>
          </OverviewQueryState>
        </div>
        <div className="overview-stat">
          <h2>Gói bàn giao</h2>
          <p className="overview-stat-value">{vault.activeContainerCount}</p>
        </div>
      </section>
    </>
  );
}
