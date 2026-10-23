import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { LockIcon, RecipientsIcon } from "@/shared/ui/LegacyVaultArtwork";
import { ROUTES } from "@/shared/config/routes.config";
import type { OverviewResources } from "../model/useOverviewResources";
import { overviewDate } from "../model/overviewPresentation";
import { OverviewQueryState } from "./OverviewQueryState";

export function OwnerOverviewLists({ data }: { data: OverviewResources }) {
  return (
    <div className="overview-content-columns">
      <section className="overview-card" aria-labelledby="overview-assets-title">
        <div className="overview-card-heading">
          <h2 id="overview-assets-title">Tài sản mới thêm</h2>
          {data.assets.data && (
            <span>
              {data.assets.data.items.length} / {data.assets.data.totalCount} tài sản
            </span>
          )}
        </div>
        <OverviewQueryState query={data.assets}>
          {data.assets.data?.items.length ? (
            <div className="overview-table-scroll">
              <table className="overview-asset-table">
                <caption className="sr-only">Năm tài sản được tạo gần nhất</caption>
                <thead>
                  <tr>
                    <th scope="col">Tên tài sản</th>
                    <th scope="col">Loại</th>
                    <th scope="col">Cập nhật</th>
                  </tr>
                </thead>
                <tbody>
                  {data.assets.data.items.map((asset) => (
                    <tr key={asset.id}>
                      <td>
                        <span className="overview-asset-name">
                          <LockIcon width={14} height={14} aria-hidden="true" />
                          {asset.name}
                        </span>
                      </td>
                      <td>{asset.kind === "FILE" ? "Tệp tài liệu" : "Nội dung văn bản"}</td>
                      <td>{overviewDate(asset.updatedAt ?? asset.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overview-empty">
              <FileText size={28} aria-hidden="true" />
              <p>Kho chưa có tài sản.</p>
              <p className="overview-muted">Bắt đầu bằng một tệp hoặc nội dung bạn muốn lưu giữ.</p>
            </div>
          )}
        </OverviewQueryState>
        <Link className="overview-text-link" to={ROUTES.DASHBOARD.ASSETS}>
          Xem toàn bộ kho →
        </Link>
      </section>
      <section className="overview-card" aria-labelledby="overview-beneficiaries-title">
        <div className="overview-card-heading">
          <h2 id="overview-beneficiaries-title">Người nhận</h2>
          {data.beneficiaries.data && <span>{data.beneficiaries.data.totalCount} hồ sơ</span>}
        </div>
        <OverviewQueryState query={data.beneficiaries}>
          {data.beneficiaries.data?.items.length ? (
            <ul className="overview-people">
              {data.beneficiaries.data.items.map((person) => (
                <li key={person.id}>
                  <span className="overview-avatar" aria-hidden="true">
                    {person.fullName.trim().charAt(0)}
                  </span>
                  <div>
                    <strong>{person.fullName}</strong>
                    <p className="overview-muted">{person.containerIds.length} gói được chỉ định</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="overview-empty">
              <RecipientsIcon width={28} height={28} aria-hidden="true" />
              <p>Chưa có hồ sơ người nhận.</p>
            </div>
          )}
        </OverviewQueryState>
        <Link className="overview-text-link" to={ROUTES.DASHBOARD.BENEFICIARIES}>
          Quản lý người nhận →
        </Link>
      </section>
    </div>
  );
}
