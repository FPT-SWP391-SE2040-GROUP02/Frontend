import { Link } from "react-router-dom";
import type { VaultResponse } from "@/entities/vault/model/vault.types";
import { VaultServiceInfo } from "@/entities/vault/ui/VaultServiceInfo";
import { ROUTES } from "@/shared/config/routes.config";
import { StarIcon } from "@/shared/ui/LegacyVaultArtwork";
import type { OverviewResources } from "../model/useOverviewResources";
import { overviewDate } from "../model/overviewPresentation";
import { OverviewQueryState } from "./OverviewQueryState";

const executorLabels: Record<string, string> = {
  INVITED: "Chờ phản hồi lời mời",
  ACCEPTED: "Đã chấp nhận nhiệm vụ",
  DECLINED: "Đã từ chối",
  EXPIRED: "Lời mời hết hạn",
  REVOKED: "Đã thu hồi",
  SUSPENDED: "Cần chấp nhận lại",
};
const activityLabels: Record<string, string> = {
  VAULT_CREATED: "Tạo kho di sản",
  VAULT_UPDATED: "Cập nhật kho",
  ASSET_CREATED: "Thêm tài sản",
  ASSET_UPDATED: "Cập nhật tài sản",
  ASSET_VERSION_CREATED: "Thêm phiên bản tài sản",
  ASSET_DELETED: "Xóa tài sản",
  ASSET_CONTENT_DOWNLOADED: "Tải nội dung tài sản",
  ASSET_ASSIGNED: "Gán tài sản cho người nhận",
  ASSET_UNASSIGNED: "Gỡ gán tài sản khỏi người nhận",
  CONTAINER_CREATED: "Tạo gói bàn giao (tính năng cũ)",
  CONTAINER_UPDATED: "Cập nhật gói bàn giao (tính năng cũ)",
  CONTAINER_ARCHIVED: "Xóa gói bàn giao (tính năng cũ)",
  CONTAINER_REMOVED: "Xóa gói bàn giao (tính năng cũ)",
  CONTAINER_ASSET_ADDED: "Thêm tài sản vào gói (tính năng cũ)",
  CONTAINER_ASSET_REMOVED: "Gỡ tài sản khỏi gói (tính năng cũ)",
  CONTAINER_BENEFICIARY_ADDED: "Chỉ định người nhận (tính năng cũ)",
  CONTAINER_BENEFICIARY_REMOVED: "Gỡ chỉ định người nhận (tính năng cũ)",
  BENEFICIARY_CREATED: "Thêm hồ sơ người nhận",
  BENEFICIARY_UPDATED: "Cập nhật hồ sơ người nhận",
  BENEFICIARY_DELETED: "Xóa hồ sơ người nhận",
  CHECKED_IN: "Điểm danh",
  CHECK_IN_SETTINGS_UPDATED: "Cập nhật lịch điểm danh",
  PLAN_DEACTIVATED: "Dừng kích hoạt kế hoạch",
  DEATH_CASE_OPENED: "Mở hồ sơ chứng tử",
  DEATH_CASE_DRAFT_CANCELLED: "Hủy hồ sơ chứng tử nháp",
  DEATH_CASE_SUBMITTED: "Gửi hồ sơ chứng tử",
  DEATH_CASE_APPROVED: "Duyệt hồ sơ chứng tử",
  DEATH_CASE_REJECTED: "Từ chối hồ sơ chứng tử",
  HOLD_PLACED: "Tạm giữ kho",
  HOLD_RELEASED: "Gỡ tạm giữ kho",
  PAYMENT_ORDER_CREATED: "Tạo đơn thanh toán",
  PAYMENT_ORDER_CANCELLED: "Hủy đơn thanh toán",
  PAYMENT_PAID: "Thanh toán thành công",
  SERVICE_GRACE_STARTED: "Hết hạn dịch vụ, chuyển sang chỉ đọc",
};

/** Người thực thi nằm cùng nhóm chuẩn bị kế hoạch nên là một thành phần riêng để đặt cạnh khối xác minh. */
export function OwnerOverviewExecutors({ data }: { data: OverviewResources }) {
  const setup = data.setup.data;
  const executors = setup?.executors.filter((item) => item.status !== "REVOKED") ?? [];
  return (
    <section className="overview-card" aria-labelledby="overview-executors-title">
      <h2 id="overview-executors-title">Người thực thi</h2>
      <OverviewQueryState query={data.setup}>
        <div className="overview-executors">
          {executors.length ? (
            executors.map((person) => (
              <div key={person.id}>
                <h3>Người thực thi</h3>
                <p className="overview-person-email">{person.inviteeEmail}</p>
                <p className="overview-muted">
                  {person.status === "ACCEPTED" &&
                  person.acceptedScopeVersion !== setup?.executorScopeVersion
                    ? "Cần chấp nhận phạm vi nhiệm vụ mới"
                    : executorLabels[person.status]}
                </p>
              </div>
            ))
          ) : (
            <p className="overview-muted">Chưa chỉ định người thực thi.</p>
          )}
        </div>
      </OverviewQueryState>
      <Link className="overview-text-link" to={ROUTES.WILLS.ROOT}>
        Quản lý trong kế hoạch →
      </Link>
    </section>
  );
}

export function OwnerOverviewDetails({
  vault,
  data,
}: {
  vault: VaultResponse;
  data: OverviewResources;
}) {
  return (
    <div className="overview-bottom-columns">
      <section className="overview-card" aria-labelledby="overview-audit-title">
        <h2 id="overview-audit-title">Hoạt động gần đây</h2>
        <OverviewQueryState query={data.audit}>
          {data.audit.data?.items.length ? (
            <ul className="overview-activity">
              {data.audit.data.items.map((entry) => (
                <li key={entry.id}>
                  <StarIcon
                    className="size-3.5 shrink-0 text-heritage-gold mt-1"
                    aria-hidden="true"
                  />
                  <div>
                    <p>{activityLabels[entry.action] ?? "Hoạt động của kho"}</p>
                    <p className="overview-muted">
                      {overviewDate(entry.at)}
                      {entry.outcome === "FAILED"
                        ? " · Thất bại"
                        : entry.outcome === "DENIED"
                          ? " · Bị từ chối"
                          : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="overview-muted">Chưa có hoạt động được ghi nhận.</p>
          )}
        </OverviewQueryState>
        <Link className="overview-text-link" to={ROUTES.DASHBOARD.AUDIT_LOG}>
          Xem nhật ký →
        </Link>
      </section>
      <section className="overview-card" aria-labelledby="overview-service-title">
        <h2 id="overview-service-title">Gói dịch vụ</h2>
        <VaultServiceInfo service={vault} />
        <Link className="overview-outline-action" to={ROUTES.BILLING.PLANS}>
          Xem các gói dịch vụ
        </Link>
      </section>
    </div>
  );
}
