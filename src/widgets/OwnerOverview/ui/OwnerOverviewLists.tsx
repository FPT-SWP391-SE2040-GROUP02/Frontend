import { useState } from "react";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { LockIcon, RecipientsIcon } from "@/shared/ui/LegacyVaultArtwork";
import { ROUTES } from "@/shared/config/routes.config";
import type { OverviewResources } from "../model/useOverviewResources";
import { executorLabels, overviewDate } from "../model/overviewPresentation";
import { ChoiceGroup } from "@/shared/ui/ChoiceGroup";
import { OverviewQueryState } from "./OverviewQueryState";

export function OwnerOverviewLists({ data }: { data: OverviewResources }) {
  const [group, setGroup] = useState<"beneficiaries" | "executors">("beneficiaries");
  const setup = data.setup.data;
  const executors = setup?.executors.filter((item) => item.status !== "REVOKED") ?? [];
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
            <ul className="overview-people">
              {data.assets.data.items.map((asset) => (
                <li key={asset.id}>
                  <span className="overview-avatar" aria-hidden="true">
                    <LockIcon width={16} height={16} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>{asset.name}</strong>
                    <p className="overview-muted">
                      {asset.kind === "FILE" ? "Tệp tài liệu" : "Nội dung văn bản"} ·{" "}
                      {overviewDate(asset.updatedAt ?? asset.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
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
          <h2 id="overview-beneficiaries-title">
            {group === "beneficiaries" ? "Người nhận" : "Người thực hiện"}
          </h2>
          {group === "beneficiaries" && data.beneficiaries.data && (
            <span>{data.beneficiaries.data.totalCount} hồ sơ</span>
          )}
        </div>
        <ChoiceGroup
          variant="segmented"
          ariaLabel="Chọn nhóm người"
          value={group}
          onChange={setGroup}
          options={[
            { value: "beneficiaries", label: "Người nhận" },
            { value: "executors", label: "Người thực hiện" },
          ]}
        />
        {group === "beneficiaries" && (
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
                      <p className="overview-muted">
                        {person.containerIds.length} gói được chỉ định
                      </p>
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
        )}
        {group === "executors" && (
          <OverviewQueryState query={data.setup}>
            {executors.length ? (
              <ul className="overview-people">
                {executors.map((person) => (
                  <li key={person.id}>
                    <span className="overview-avatar" aria-hidden="true">
                      {person.inviteeEmail.trim().charAt(0).toLocaleUpperCase("vi-VN")}
                    </span>
                    <div>
                      <strong className="overview-person-email">{person.inviteeEmail}</strong>
                      <p className="overview-muted">
                        {person.status === "ACCEPTED" &&
                        person.acceptedScopeVersion !== setup?.executorScopeVersion
                          ? "Cần chấp nhận phạm vi nhiệm vụ mới"
                          : executorLabels[person.status]}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="overview-empty">
                <RecipientsIcon width={28} height={28} aria-hidden="true" />
                <p>Chưa chỉ định người thực hiện.</p>
              </div>
            )}
          </OverviewQueryState>
        )}
        <Link className="overview-text-link" to={ROUTES.DASHBOARD.BENEFICIARIES}>
          {group === "beneficiaries" ? "Quản lý người nhận →" : "Quản lý trong kế hoạch →"}
        </Link>
      </section>
    </div>
  );
}
