import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import { WIZARD_ENABLED } from "@/shared/config/wizard.config";
import { buttonStyles, Panel } from "@/shared/ui/heritageKit";
import { Stepper } from "@/shared/ui/Stepper";
import {
  countRemainingOwnerSteps,
  resolveOwnerSteps,
} from "@/widgets/OwnerWizard/model/resolveOwnerSteps";
import type { OverviewResources } from "../model/useOverviewResources";

/**
 * Thẻ lớn đầu Tổng quan: còn bao nhiêu bước để kích hoạt kế hoạch, kèm danh sách bước và trạng thái từng bước.
 * Chỉ hiện khi kế hoạch còn nháp và đã đọc được tiến độ từ máy chủ; không đoán khi query lỗi.
 */
export function OwnerSetupCard({ data }: { data: OverviewResources }) {
  if (!WIZARD_ENABLED.owner) return null;
  const setup = data.setup.data;
  if (!setup || setup.planStatus !== "DRAFT") return null;
  let assetsCount: number | null = null;
  if (data.assets.data) assetsCount = data.assets.data.totalCount;
  let beneficiariesCount: number | null = null;
  if (data.beneficiaries.data) beneficiariesCount = data.beneficiaries.data.totalCount;
  const resolution = resolveOwnerSteps({ assetsCount, beneficiariesCount, setup });
  const remaining = countRemainingOwnerSteps(resolution);
  if (remaining === 0) return null;
  const steps = resolution.steps
    .filter((step) => step.id !== "done")
    .map((step) => ({ id: step.id, label: step.title, state: step.state }));
  return (
    <Panel
      title={`Còn ${remaining} bước để kích hoạt kế hoạch`}
      labelledBy="owner-setup-title"
      action={
        <div className="flex flex-wrap items-center gap-3">
          <Link to={ROUTES.DASHBOARD.PACKAGES} className="overview-text-link">
            Xem trạng thái các gói bàn giao →
          </Link>
          <Link to={ROUTES.SETUP} className={buttonStyles.dark}>
            Tiếp tục thiết lập
          </Link>
        </div>
      }
      className="border-heritage-gold-border bg-heritage-gold-light"
    >
      <p className="mb-4 text-sm leading-6 text-heritage-muted">
        Mỗi lần làm một việc, lúc nào cũng dừng và quay lại được.
      </p>
      <Stepper
        steps={steps}
        ariaLabel="Các bước thiết lập kế hoạch"
        orientation="vertical"
        activeId={resolution.currentId ?? undefined}
        className="md:grid md:grid-cols-2"
      />
    </Panel>
  );
}
