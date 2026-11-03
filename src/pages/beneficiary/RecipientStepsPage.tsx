import { Navigate } from "react-router-dom";
import { RecipientWizard } from "@/widgets/RecipientWizard/ui/RecipientWizard";
import { ROUTES } from "@/shared/config/routes.config";
import { WIZARD_ENABLED } from "@/shared/config/wizard.config";

/** Trang lắp ghép wizard Người nhận; tắt công tắc thì quay về cổng cũ. */
export function RecipientStepsPage() {
  if (!WIZARD_ENABLED.recipient) return <Navigate to={ROUTES.BENEFICIARY.CLAIM} replace />;
  return <RecipientWizard />;
}
