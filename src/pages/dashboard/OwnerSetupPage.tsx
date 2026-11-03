import { Navigate } from "react-router-dom";
import { OwnerWizard } from "@/widgets/OwnerWizard/ui/OwnerWizard";
import { OwnerCatalog } from "@/pages/billing/OwnerPlanCatalog";
import { ROUTES } from "@/shared/config/routes.config";
import { WIZARD_ENABLED } from "@/shared/config/wizard.config";

/** Trang lắp ghép wizard Chủ kho; tắt công tắc thì quay về Tổng quan cũ. */
export function OwnerSetupPage() {
  if (!WIZARD_ENABLED.owner) return <Navigate to={ROUTES.DASHBOARD.ROOT} replace />;
  return <OwnerWizard serviceTierSlot={<OwnerCatalog />} />;
}
