import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Circle } from "lucide-react";
import { ConfirmedIcon, TrustedIcon } from "@/shared/ui/LegacyVaultArtwork";
import type { OverviewResources } from "../model/useOverviewResources";
import { OverviewQueryState } from "./OverviewQueryState";
import { ROUTES } from "@/shared/config/routes.config";

export function OwnerOverviewPlan({ data, aside }: { data: OverviewResources; aside?: ReactNode }) {
  const setup = data.setup.data;
  const steps = setup
    ? [
        {
          label: "Thêm tài sản đầu tiên",
          done: data.assets.isSuccess ? data.assets.data.totalCount > 0 : null,
          to: ROUTES.DASHBOARD.ASSETS,
        },
        {
          label: "Xác minh danh tính Chủ kho",
          done: !setup.missingRequirements.includes("OWNER_EKYC_REQUIRED"),
          to: ROUTES.DASHBOARD.IDENTITY,
        },
        {
          // Gán tài sản cho người nhận và Người thực thi chính chấp nhận đều làm ở trang Bàn giao nên gộp một bước.
          label: "Chuẩn bị kế hoạch bàn giao",
          done:
            !setup.missingRequirements.includes("ASSIGNMENT_REQUIRED") &&
            !setup.missingRequirements.includes("PRIMARY_EXECUTOR_REQUIRED"),
          to: ROUTES.WILLS.ROOT,
        },
      ]
    : [];
  const completed = steps.filter((item) => item.done === true).length;
  const verified = Boolean(setup && !setup.missingRequirements.includes("OWNER_EKYC_REQUIRED"));
  return (
    <>
      <div className="overview-two-columns">
        <section className="overview-card" aria-labelledby="overview-setup-title">
          <div className="overview-card-heading">
            <h2 id="overview-setup-title">Hoàn thiện kế hoạch</h2>
            {setup && (
              <span>
                {completed} / {steps.length} bước
              </span>
            )}
          </div>
          <OverviewQueryState query={data.setup}>
            {setup && (
              <>
                <div
                  className="overview-progress"
                  role="progressbar"
                  aria-label="Hoàn thiện kế hoạch"
                  aria-valuenow={completed}
                  aria-valuemin={0}
                  aria-valuemax={steps.length}
                >
                  <span style={{ width: `${(completed / steps.length) * 100}%` }} />
                </div>
                <ul className="overview-checklist">
                  {steps.map((step) => (
                    <li key={step.label}>
                      <span className={step.done ? "overview-check is-complete" : "overview-check"}>
                        {step.done ? (
                          <ConfirmedIcon className="size-3.5" aria-hidden="true" />
                        ) : (
                          <Circle size={14} aria-hidden="true" />
                        )}
                      </span>
                      <span>
                        {step.label}
                        {step.done === null && (
                          <small className="block overview-muted">Chưa kiểm tra được</small>
                        )}
                      </span>
                      {step.done !== true && <Link to={step.to}>Làm ngay</Link>}
                    </li>
                  ))}
                </ul>
                <p className="overview-muted">
                  {setup.canActivate ? "Đủ điều kiện kích hoạt." : "Chưa đủ điều kiện kích hoạt."}
                </p>
                <Link className="overview-text-link" to={ROUTES.WILLS.ROOT}>
                  Thiết lập kế hoạch →
                </Link>
              </>
            )}
          </OverviewQueryState>
        </section>
      </div>
      <div className="overview-panel-row">
        {aside}
        <section className="overview-identity" aria-label="Xác minh danh tính Chủ kho">
          <TrustedIcon className="size-6 text-heritage-gold shrink-0" aria-hidden="true" />
          <div>
            <h2>Xác minh danh tính</h2>
            <OverviewQueryState query={data.setup}>
              <p>{verified ? "Đã xác minh." : "Chưa xác minh."}</p>
            </OverviewQueryState>
          </div>
          <Link className="overview-outline-action" to={ROUTES.DASHBOARD.IDENTITY}>
            {verified ? "Xem xác minh" : "Xác minh ngay"}
          </Link>
        </section>
      </div>
    </>
  );
}
