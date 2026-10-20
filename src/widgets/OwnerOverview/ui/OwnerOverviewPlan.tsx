import { Link } from "react-router-dom";
import { Check, Circle, ShieldCheck } from "lucide-react";
import type { OverviewResources } from "../model/useOverviewResources";
import { OverviewQueryState } from "./OverviewQueryState";
import { ROUTES } from "@/shared/config/routes.config";

const handoverSteps = [
  "Báo tin",
  "Xét duyệt hồ sơ",
  "Xác minh người nhận",
  "Thời gian phản đối",
  "Tải nội dung",
];

export function OwnerOverviewPlan({ data }: { data: OverviewResources }) {
  const setup = data.setup.data;
  const steps = setup
    ? [
        { label: "Tạo kho di sản", done: true, to: ROUTES.DASHBOARD.ASSETS },
        {
          label: "Thêm tài sản đầu tiên",
          done: data.assets.isSuccess ? data.assets.data.totalCount > 0 : null,
          to: ROUTES.DASHBOARD.ASSETS,
        },
        {
          label: "Chuẩn bị gói bàn giao sẵn sàng",
          done: setup.containers.some((item) => item.status === "READY"),
          to: ROUTES.WILLS.ROOT,
        },
        {
          label: "Xác minh danh tính Chủ kho",
          done: !setup.missingRequirements.includes("OWNER_EKYC_REQUIRED"),
          to: ROUTES.DASHBOARD.IDENTITY,
        },
        {
          label: "Người thực hiện chính chấp nhận nhiệm vụ",
          done: !setup.missingRequirements.includes("PRIMARY_EXECUTOR_REQUIRED"),
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
                          <Check size={14} aria-hidden="true" />
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
                  {setup.canActivate
                    ? "Máy chủ xác nhận đủ điều kiện hiện tại. Đọc và xác nhận chính sách tại trang kế hoạch để kích hoạt."
                    : "Kiểm tra điều kiện đầy đủ tại trang kế hoạch trước khi kích hoạt."}
                </p>
                <Link className="overview-text-link" to={ROUTES.WILLS.ROOT}>
                  Xem điều kiện và thiết lập kế hoạch →
                </Link>
              </>
            )}
          </OverviewQueryState>
        </section>
        <section className="overview-card" aria-labelledby="overview-handover-title">
          <h2 id="overview-handover-title">Quy trình bàn giao</h2>
          <p className="overview-muted">
            Các bước tham khảo của quy trình. Trạng thái thực tế của kho hiển thị ở đầu trang và
            trong thông báo hồ sơ.
          </p>
          <ol className="overview-handover-steps">
            {handoverSteps.map((step, index) => (
              <li key={step}>
                <span aria-hidden="true">{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
          <p className="overview-muted">
            Thời hạn và quyền thao tác áp dụng theo hồ sơ được hệ thống xác nhận.
          </p>
        </section>
      </div>
      <section className="overview-identity" aria-label="Xác minh danh tính Chủ kho">
        <ShieldCheck size={24} aria-hidden="true" />
        <div>
          <h2>Xác minh danh tính</h2>
          <OverviewQueryState query={data.setup}>
            <p>
              {verified
                ? "Chủ kho đã đáp ứng điều kiện xác minh danh tính."
                : "Hoàn tất xác minh danh tính để chuẩn bị kích hoạt kế hoạch bàn giao."}
            </p>
          </OverviewQueryState>
        </div>
        <Link className="overview-outline-action" to={ROUTES.DASHBOARD.IDENTITY}>
          {verified ? "Xem xác minh" : "Xác minh ngay"}
        </Link>
      </section>
    </>
  );
}
