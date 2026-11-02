import { Navigate } from "react-router-dom";
import { VerifierWizard } from "@/widgets/VerifierWizard/ui/VerifierWizard";
import { ROUTES } from "@/shared/config/routes.config";
import { WIZARD_ENABLED } from "@/shared/config/wizard.config";

/** Trang lắp ghép wizard Người xét duyệt; tắt công tắc thì quay về Tổng quan cũ. */
export function VerifierStepsPage() {
  if (!WIZARD_ENABLED.verifier) return <Navigate to={ROUTES.NOTARY.WORKSPACE} replace />;
  return <VerifierWizard />;
}
