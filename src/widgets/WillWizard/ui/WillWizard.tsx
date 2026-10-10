import React from "react";
import { useWillWizardForm } from "@/features/wills/model/useWillWizardForm";
import { APP_MESSAGES } from "@/shared/constants";
import { Link } from "react-router-dom";
import { Shield, ChevronRight, ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/shared/ui";
import { ROUTES } from "@/shared/config/routes.config";
import { WillStepper, Step3ExecutorActivation, type StepItem } from "@/features/wills";
import { Step1SelectAssets } from "./Step1SelectAssets";
import { Step2DirectDesignationBundling } from "./Step2DirectDesignationBundling";
import { useAssets } from "@/features/assets";

/**
 * @file WillWizardPage.tsx
 * @description Màn hình Lập Kế Hoạch Di Sản Số Chuẩn SRS 3.11.0 (Luồng 1B):
 * 1. Chọn tài sản số từ kho nguồn.
 * 2. Gán người nhận theo tài sản & Hệ thống tự gom kho bàn giao (Không phần trăm).
 * 3. Chỉ định Người thực thi (Executor) & Kích hoạt kế hoạch (SETUP-01).
 */

const WIZARD_STEPS: StepItem[] = [
  { number: 1, title: "Chọn Tài Sản", subtitle: "Ý chí & Tài sản số" },
  { number: 2, title: "Gán Người Nhận", subtitle: "Tự gom kho bàn giao" },
  { number: 3, title: "Người Thực Thi", subtitle: "Kích hoạt (SETUP-01)" },
];

/** @description Ghép các bước Wills và danh sách Assets; nghiệp vụ form thuộc feature Wills. */
export const WillWizard: React.FC = () => {
  const { data: assetsData } = useAssets();
  const {
    formValues,
    setFormValues,
    currentStep,
    stepError,
    validDesignatedAssetsCount,
    handleToggleAsset,
    handleAddBeneficiary,
    handleRemoveBeneficiary,
    handleUpdateBeneficiary,
    handleToggleRecipient,
    handleUpdateExecutor,
    handleNextStep,
    handleActivatePlan,
    handlePrevStep,
  } = useWillWizardForm();
  const selectedAssetsList = (assetsData?.items ?? []).filter((asset) =>
    formValues.selectedAssetIds.includes(asset.id),
  );
  const isPending = false;

  return (
    <div className="min-h-screen bg-[#EFECE6] text-[#14241C] flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#FAF9F5]/95 backdrop-blur-md border-b border-[#DCD9D0] px-4 sm:px-8 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-2.5 rounded-[14px] p-1.5 focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
            aria-label="LegacyVault Trang Chủ"
          >
            <div className="w-10 h-10 rounded-[14px] bg-[#0B291E] flex items-center justify-center text-[#B88E4C] shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-[#0B291E] tracking-tight">
              Legacy<span className="text-[#B88E4C]">Vault</span>
            </span>
          </Link>

          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="hidden md:flex items-center gap-2 text-xs bg-[#EFECE6] px-3.5 py-2 rounded-full border border-[#DCD9D0]"
          >
            <Link to={ROUTES.HOME} className="text-[#66786E] hover:text-[#0B291E]">
              Trang Chủ
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#A8A295]" />
            <Link to={ROUTES.WILLS.ROOT} className="text-[#66786E] hover:text-[#0B291E]">
              Kế Hoạch Di Sản
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#A8A295]" />
            <span className="font-bold text-[#0B291E]">Thiết Lập Kế Hoạch</span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={ROUTES.WILLS.ROOT}
            className="min-h-[44px] text-xs font-semibold text-[#66786E] hover:text-[#14241C] px-4 py-2 rounded-[16px] hover:bg-[#EFECE6] flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Thoát Wizard</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        <p role="status">{APP_MESSAGES.UI.PREVIEW}</p>
        {/* Stepper Navigation */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5EDE8] border border-[#A2C4AF] text-[#0B291E] text-xs font-semibold">
            <Lock className="w-3.5 h-3.5 text-[#0B291E]" />
            <span>Thiết lập kế hoạch di sản số chuẩn hóa theo SRS 3.11.0 (Luồng 1B)</span>
          </div>
          <WillStepper currentStep={currentStep} steps={WIZARD_STEPS} />
        </div>

        {/* Step Content Render */}
        <div className="bg-[#FAF9F5] border border-[#DCD9D0] rounded-[24px] p-6 sm:p-8 shadow-[0_4px_24px_rgba(11,41,30,0.05)]">
          {currentStep === 1 && (
            <Step1SelectAssets
              title={formValues.title}
              onTitleChange={(title) => setFormValues((p) => ({ ...p, title }))}
              declarationNotes={formValues.declarationNotes}
              onNotesChange={(declarationNotes) =>
                setFormValues((p) => ({ ...p, declarationNotes }))
              }
              selectedAssetIds={formValues.selectedAssetIds}
              onToggleAsset={handleToggleAsset}
              onSelectAllAssets={(allIds) =>
                setFormValues((p) => ({ ...p, selectedAssetIds: allIds }))
              }
              errorMessage={stepError}
            />
          )}

          {currentStep === 2 && (
            <Step2DirectDesignationBundling
              selectedAssets={selectedAssetsList}
              beneficiaries={formValues.beneficiaries}
              designations={formValues.designations}
              onAddBeneficiary={handleAddBeneficiary}
              onRemoveBeneficiary={handleRemoveBeneficiary}
              onUpdateBeneficiary={handleUpdateBeneficiary}
              onToggleRecipient={handleToggleRecipient}
              errorMessage={stepError}
            />
          )}

          {currentStep === 3 && (
            <Step3ExecutorActivation
              executor={formValues.executor}
              onUpdateExecutor={handleUpdateExecutor}
              policyConfirmed={formValues.policyConfirmed}
              onPolicyConfirmChange={(confirmed) =>
                setFormValues((p) => ({ ...p, policyConfirmed: confirmed }))
              }
              validAssetsCount={validDesignatedAssetsCount}
              validBundlesCount={validDesignatedAssetsCount > 0 ? 1 : 0}
              isPending={isPending}
              onActivate={handleActivatePlan}
              errorMessage={stepError}
            />
          )}

          {/* Stepper Navigation Footer (>= 44px Touch Targets) */}
          <div className="pt-6 mt-8 border-t border-[#E8E5DD] flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              disabled={currentStep === 1 || isPending}
              className={`min-h-[44px] rounded-[16px] border-[#DCD9D0] text-xs font-semibold px-5 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#B88E4C] ${
                currentStep === 1 ? "invisible" : ""
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay Lại</span>
            </Button>

            {currentStep < 3 && (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={isPending}
                className="min-h-[48px] rounded-[18px] bg-[#0B291E] hover:bg-[#133E2F] text-white text-xs font-bold px-7 shadow-md flex items-center gap-2 transition-all hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
              >
                <span>Tiếp Tục Bước Tiếp Theo</span>
                <ArrowRight className="w-4 h-4 text-[#B88E4C]" />
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#FAF9F5] border-t border-[#DCD9D0] py-6 px-4 text-center text-xs text-[#66786E] mt-auto">
        <p>© 2026 LegacyVault Protocol. Quy Trình Di Chúc Số Đạt Chuẩn FPT SWP391.</p>
      </footer>
    </div>
  );
};
