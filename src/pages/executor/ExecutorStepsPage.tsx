import { Navigate } from "react-router-dom";
import { ExecutorWizard } from "@/widgets/ExecutorWizard/ui/ExecutorWizard";
import { ROUTES } from "@/shared/config/routes.config";
import { WIZARD_ENABLED } from "@/shared/config/wizard.config";

/** Trang lắp ghép wizard Người thực hiện; tắt công tắc thì quay về Tổng quan cũ. */
export function ExecutorStepsPage() {
  if (!WIZARD_ENABLED.executor) return <Navigate to={ROUTES.EXECUTOR.ROOT} replace />;
  return <ExecutorWizard />;
}
