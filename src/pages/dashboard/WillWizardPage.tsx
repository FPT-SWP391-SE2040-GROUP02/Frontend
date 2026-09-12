import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Shield, 
  ChevronRight, 
  ArrowLeft, 
  ArrowRight, 
  FileText, 
  Check, 
  Lock 
} from "lucide-react";
import { Button } from "@/shared/ui";
import { ROUTES } from "@/shared/config/routes.config";
import {
  WillStepper,
  Step1SelectAssets,
  Step2AllocateBeneficiaries,
  Step3VideoAffidavit,
  Step4CryptographicSeal,
  useCreateWill,
  step1BasicInfoSchema,
  step2AllocationSchema,
  affidavitProofSchema,
  createWillSchema,
  type CreateWillFormValues,
  type BeneficiaryAllocation,
  type StepItem,
} from "@/features/wills";

/**
 * @file WillWizardPage.tsx
 * @description Màn hình Lập Di Chúc Số 4 Bước (Digital Will Wizard).
 * Hiện thực hóa quy trình Stepper theo Hick's Law và Master UI Kit Heritage Forest & Champagne Gold.
 */

const WIZARD_STEPS: StepItem[] = [
  { number: 1, title: "Chọn Di Sản", subtitle: "Ý chí & Tài sản số" },
  { number: 2, title: "Phân Bổ Thừa Kế", subtitle: "Tỷ lệ % (Điều 644)" },
  { number: 3, title: "Video Minh Mẫn", subtitle: "15s (Điều 630)" },
  { number: 4, title: "Ký Niêm Phong", subtitle: "ECDSA P-256" },
];

export const WillWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const { mutate: createWill, isPending } = useCreateWill();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [stepError, setStepError] = useState<string | null>(null);

  // Form State 4 bước
  const [formValues, setFormValues] = useState<CreateWillFormValues>({
    title: "",
    declarationNotes: "",
    selectedAssetIds: [],
    allocations: [
      {
        beneficiaryId: "ben_01",
        beneficiaryName: "",
        relationship: "",
        citizenId: "",
        percentage: 100,
      },
    ],
    legalComplianceConfirmed: false,
    affidavitProof: {
      videoDurationSeconds: 0,
      sha256Hash: "",
      recordedAt: "",
      isConfirmed: false,
    },
    confirmDigitalSignature: false,
  });

  // --- Handlers Bước 1 ---
  const handleToggleAsset = (assetId: string) => {
    setFormValues((prev) => ({
      ...prev,
      selectedAssetIds: prev.selectedAssetIds.includes(assetId)
        ? prev.selectedAssetIds.filter((id) => id !== assetId)
        : [...prev.selectedAssetIds, assetId],
    }));
    setStepError(null);
  };

  // --- Handlers Bước 2 ---
  const handleAddBeneficiary = () => {
    setFormValues((prev) => ({
      ...prev,
      allocations: [
        ...prev.allocations,
        {
          beneficiaryId: `ben_${Date.now()}`,
          beneficiaryName: "",
          relationship: "",
          citizenId: "",
          percentage: 0,
        },
      ],
    }));
    setStepError(null);
  };

  const handleRemoveBeneficiary = (index: number) => {
    setFormValues((prev) => ({
      ...prev,
      allocations: prev.allocations.filter((_, i) => i !== index),
    }));
    setStepError(null);
  };

  const handleUpdateBeneficiary = (
    index: number,
    field: keyof BeneficiaryAllocation,
    value: unknown
  ) => {
    setFormValues((prev) => {
      const updated = [...prev.allocations];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return { ...prev, allocations: updated };
    });
    setStepError(null);
  };

  // --- Validation chuyển bước ---
  const handleNextStep = () => {
    setStepError(null);

    if (currentStep === 1) {
      const validation = step1BasicInfoSchema.safeParse({
        title: formValues.title,
        declarationNotes: formValues.declarationNotes,
        selectedAssetIds: formValues.selectedAssetIds,
      });
      if (!validation.success) {
        setStepError(validation.error.issues[0].message);
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const validation = step2AllocationSchema.safeParse({
        allocations: formValues.allocations,
        legalComplianceConfirmed: formValues.legalComplianceConfirmed,
      });
      if (!validation.success) {
        setStepError(validation.error.issues[0].message);
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      const validation = affidavitProofSchema.safeParse(formValues.affidavitProof);
      if (!validation.success) {
        setStepError(validation.error.issues[0].message);
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      const validation = createWillSchema.safeParse(formValues);
      if (!validation.success) {
        setStepError(validation.error.issues[0].message);
        return;
      }

      // Submit form nộp lên máy chủ
      createWill(formValues, {
        onSuccess: () => {
          navigate(ROUTES.WILLS.ROOT);
        },
        onError: (err) => {
          setStepError(err.message || "Đã xảy ra lỗi khi niêm phong di chúc");
        },
      });
    }
  };

  const handlePrevStep = () => {
    setStepError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

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
              Di Chúc Số
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#A8A295]" />
            <span className="font-bold text-[#0B291E]">Lập Bản Mới</span>
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
        {/* Stepper Navigation */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5EDE8] border border-[#A2C4AF] text-[#0B291E] text-xs font-semibold">
            <Lock className="w-3.5 h-3.5 text-[#0B291E]" />
            <span>Quy trình lập di chúc điện tử hợp chuẩn Điều 630 & 644 BLDS 2015</span>
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
            <Step2AllocateBeneficiaries
              allocations={formValues.allocations}
              onAddBeneficiary={handleAddBeneficiary}
              onRemoveBeneficiary={handleRemoveBeneficiary}
              onUpdateBeneficiary={handleUpdateBeneficiary}
              legalComplianceConfirmed={formValues.legalComplianceConfirmed}
              onLegalComplianceChange={(legalComplianceConfirmed) =>
                setFormValues((p) => ({ ...p, legalComplianceConfirmed }))
              }
              errorMessage={stepError}
            />
          )}

          {currentStep === 3 && (
            <Step3VideoAffidavit
              affidavit={formValues.affidavitProof}
              onAffidavitChange={(affidavitProof) =>
                setFormValues((p) => ({ ...p, affidavitProof }))
              }
              errorMessage={stepError}
            />
          )}

          {currentStep === 4 && (
            <Step4CryptographicSeal
              formValues={formValues}
              onConfirmSignatureChange={(confirmDigitalSignature) =>
                setFormValues((p) => ({ ...p, confirmDigitalSignature }))
              }
              isSubmitting={isPending}
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

            <Button
              type="button"
              onClick={handleNextStep}
              disabled={isPending}
              className="min-h-[48px] rounded-[18px] bg-[#0B291E] hover:bg-[#133E2F] text-white text-xs font-bold px-7 shadow-md flex items-center gap-2 transition-all hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-[#B88E4C]"
            >
              <span>
                {currentStep === 4
                  ? isPending
                    ? "Đang Ký Số & Niêm Phong..."
                    : "Ký Số & Niêm Phong Di Chúc"
                  : "Tiếp Tục Bước Tiếp Theo"}
              </span>
              {currentStep === 4 ? (
                <Check className="w-4 h-4 text-[#B88E4C]" />
              ) : (
                <ArrowRight className="w-4 h-4 text-[#B88E4C]" />
              )}
            </Button>
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
