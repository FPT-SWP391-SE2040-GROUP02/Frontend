import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import { WIZARD_ENABLED } from "@/shared/config/wizard.config";
import { buttonStyles, Notice } from "@/shared/ui/heritageKit";
import {
  countRemainingOwnerSteps,
  resolveOwnerSteps,
} from "@/widgets/OwnerWizard/model/resolveOwnerSteps";
import type { OverviewResources } from "../model/useOverviewResources";

/**
 * Thẻ lớn đầu Tổng quan: còn bao nhiêu bước để kích hoạt kế hoạch.
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
  return (
    <Notice
      tone="warning"
      title={`Còn ${remaining} bước để kích hoạt kế hoạch`}
      action={
        <Link to={ROUTES.SETUP} className={buttonStyles.dark}>
          Tiếp tục thiết lập
        </Link>
      }
    >
      Mỗi lần làm một việc, lúc nào cũng dừng và quay lại được.
    </Notice>
  );
}
