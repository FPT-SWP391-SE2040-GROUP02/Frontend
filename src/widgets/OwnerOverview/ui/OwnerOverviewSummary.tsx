import { Link } from "react-router-dom";
import { HardDrive, Package, Users, Vault } from "lucide-react";
import type { VaultResponse } from "@/entities/vault/model/vault.types";
import { ROUTES } from "@/shared/config/routes.config";
import { formatStorageMegabytes } from "@/shared/lib/formatStorageSize";
import { QuickCheckIn } from "@/features/dms/ui/QuickCheckIn";
import { useOwnerDeathCase } from "@/features/owner-objection/model/useOwnerDeathCase";
import guilloche from "@/shared/assets/auth-guilloche.svg";
import { ActivityIcon } from "@/shared/ui/LegacyVaultArtwork";
import { overviewDate, presentOverviewPlan, storagePercent } from "../model/overviewPresentation";
import type { OverviewResources } from "../model/useOverviewResources";
import { CheckInRing } from "./CheckInRing";
import { OverviewQueryState } from "./OverviewQueryState";

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
  const deathCase = useOwnerDeathCase(vault.id, true);
  const plan = presentOverviewPlan(vault.planStatus);
  // Điểm danh chỉ có nghĩa sau khi kế hoạch được kích hoạt; còn Nháp thì ẩn cả thẻ.
  const showCheckIn = vault.planStatus !== "DRAFT";
  return (
    <>
      <section
        className={showCheckIn ? "overview-hero" : "overview-hero overview-hero--solo"}
        aria-label="Trạng thái kho và điểm danh"
      >
        <img src={guilloche} alt="" aria-hidden="true" className="overview-hero-pattern" />
        <div className="overview-hero-message">
          <p className="overview-eyebrow">
            <span className="overview-status-dot" /> Trạng thái kế hoạch
          </p>
          <h2>{plan.title}</h2>
          <p>{plan.description}</p>
          <p className="overview-hero-note">
            {deathCase.isPending
              ? "Đang kiểm tra hồ sơ chứng tử…"
              : deathCase.isError
                ? "Chưa kiểm tra được hồ sơ chứng tử. Xem cảnh báo bên trên."
                : deathCase.data
                  ? "Kho có hồ sơ chứng tử được hệ thống ghi nhận."
                  : "Không có hồ sơ chứng tử đang mở."}
          </p>
          <Link to={ROUTES.DASHBOARD.PACKAGES} className="overview-hero-link">
            Xem kế hoạch bàn giao →
          </Link>
        </div>
        {showCheckIn && (
          <div className="overview-check-in">
            <h3>
              <ActivityIcon className="size-4 shrink-0 text-heritage-gold" aria-hidden="true" />{" "}
              Điểm danh định kỳ
            </h3>
            <OverviewQueryState query={data.checkIn}>
              {data.checkIn.data && (
                <>
                  <CheckInRing
                    serverTime={data.checkIn.data.serverTime}
                    nextCheckInDueAt={data.checkIn.data.nextCheckInDueAt}
                    cycleDays={data.checkIn.data.settings.cycleDays}
                    overdue={data.checkIn.data.status === "CHECKIN_OVERDUE"}
                  />
                  <p className="overview-check-in-status">
                    {checkInLabels[data.checkIn.data.status]}
                  </p>
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
                    Chu kỳ {data.checkIn.data.settings.cycleDays} ngày ·{" "}
                    <Link to={ROUTES.DMS.ROOT}>Xem lịch điểm danh</Link>
                  </p>
                </>
              )}
            </OverviewQueryState>
          </div>
        )}
      </section>
      <section aria-label="Thống kê kho" className="overview-metrics">
        <div className="overview-stat">
          <h2>
            <span className="overview-stat-icon" aria-hidden="true">
              <Vault className="size-4" />
            </span>
            Tài sản trong kho
          </h2>
          <OverviewQueryState query={data.assets}>
            <p className="overview-stat-value">{data.assets.data?.totalCount}</p>
            <p className="overview-muted">Tài sản đã lưu trong kho</p>
          </OverviewQueryState>
        </div>
        <div className="overview-stat">
          <h2>
            <span className="overview-stat-icon" aria-hidden="true">
              <HardDrive className="size-4" />
            </span>
            Dung lượng đã dùng
          </h2>
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
          <h2>
            <span className="overview-stat-icon" aria-hidden="true">
              <Users className="size-4" />
            </span>
            Hồ sơ người nhận
          </h2>
          <OverviewQueryState query={data.beneficiaries}>
            <p className="overview-stat-value">{data.beneficiaries.data?.totalCount}</p>
            <p className="overview-muted">
              {vault.usedBeneficiarySlots} / {vault.beneficiarySlots} suất đã chỉ định
            </p>
          </OverviewQueryState>
        </div>
        <div className="overview-stat">
          <h2>
            <span className="overview-stat-icon" aria-hidden="true">
              <Package className="size-4" />
            </span>
            Gói bàn giao
          </h2>
          <p className="overview-stat-value">{vault.activeContainerCount}</p>
          <p className="overview-muted">Gói đang dùng trong kho</p>
        </div>
      </section>
    </>
  );
}
