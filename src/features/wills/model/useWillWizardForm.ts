import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { APP_MESSAGES } from "@/shared/constants";
import {
  willWizardSchema,
  type WillWizardFormValues,
  type BeneficiaryItem,
  type AssetDesignationMap,
  type ExecutorInfo,
} from "./willWizard.schema";

/** @description Form state và điều hướng các bước preview; kích hoạt thật chờ contract BE. */
export function useWillWizardForm() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [stepError, setStepError] = useState<string | null>(null);

  const { control, getValues, setValue } = useForm<WillWizardFormValues>({
    resolver: zodResolver(willWizardSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      title: "",
      declarationNotes: "",
      selectedAssetIds: [],
      beneficiaries: [],
      designations: {},
      executor: {
        name: "",
        email: "",
        phone: "",
        backupName: "",
        backupEmail: "",
      },
      policyConfirmed: false,
    },
  });
  const [
    title,
    declarationNotes,
    selectedAssetIds,
    beneficiaries,
    designations,
    executor,
    policyConfirmed,
  ] = useWatch({
    control,
    name: [
      "title",
      "declarationNotes",
      "selectedAssetIds",
      "beneficiaries",
      "designations",
      "executor",
      "policyConfirmed",
    ],
  });
  const formValues: WillWizardFormValues = {
    title,
    declarationNotes,
    selectedAssetIds,
    beneficiaries,
    designations,
    executor,
    policyConfirmed,
  };
  /** @description Cập nhật form RHF từ callback các bước hiện có; không lưu bản sao trong useState. */
  const setFormValues = (
    update: (previous: WillWizardFormValues) => WillWizardFormValues,
  ): void => {
    const next = update(getValues());
    setValue("title", next.title);
    setValue("declarationNotes", next.declarationNotes);
    setValue("selectedAssetIds", next.selectedAssetIds);
    setValue("beneficiaries", next.beneficiaries);
    setValue("designations", next.designations);
    setValue("executor", next.executor);
    setValue("policyConfirmed", next.policyConfirmed);
  };

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
      beneficiaries: [
        ...prev.beneficiaries,
        {
          id: `ben_${Date.now()}`,
          name: "",
          contact: "",
          relationship: "",
        },
      ],
    }));
    setStepError(null);
  };

  const handleRemoveBeneficiary = (id: string) => {
    setFormValues((prev) => {
      const updatedBeneficiaries = prev.beneficiaries.filter((b) => b.id !== id);
      const updatedDesignations: AssetDesignationMap = {};

      Object.entries(prev.designations).forEach(([assetId, recIds]) => {
        updatedDesignations[assetId] = recIds.filter((recId) => recId !== id);
      });

      return {
        ...prev,
        beneficiaries: updatedBeneficiaries,
        designations: updatedDesignations,
      };
    });
    setStepError(null);
  };

  const handleUpdateBeneficiary = (id: string, field: keyof BeneficiaryItem, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      beneficiaries: prev.beneficiaries.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
    }));
    setStepError(null);
  };

  const handleToggleRecipient = (assetId: string, beneficiaryId: string) => {
    setFormValues((prev) => {
      const currentRecipients = prev.designations[assetId] || [];
      const updatedRecipients = currentRecipients.includes(beneficiaryId)
        ? currentRecipients.filter((id) => id !== beneficiaryId)
        : [...currentRecipients, beneficiaryId];

      return {
        ...prev,
        designations: {
          ...prev.designations,
          [assetId]: updatedRecipients,
        },
      };
    });
    setStepError(null);
  };

  // --- Handlers Bước 3 ---
  const handleUpdateExecutor = (field: keyof ExecutorInfo, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      executor: {
        ...prev.executor,
        [field]: value,
      },
    }));
    setStepError(null);
  };

  // Đếm số tài sản đã gán người nhận
  const validDesignatedAssetsCount = formValues.selectedAssetIds.filter(
    (id) => (formValues.designations[id] || []).length > 0,
  ).length;

  // --- Validation chuyển bước ---
  const handleNextStep = () => {
    setStepError(null);

    if (currentStep === 1) {
      if (!formValues.title.trim()) {
        setStepError("Vui lòng nhập tên định danh kế hoạch di sản");
        return;
      }
      if (formValues.selectedAssetIds.length === 0) {
        setStepError("Vui lòng chọn ít nhất một tài sản số để đưa vào kế hoạch di sản");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (formValues.beneficiaries.length === 0) {
        setStepError("Vui lòng tạo ít nhất một người thụ hưởng");
        return;
      }
      const hasEmptyName = formValues.beneficiaries.some((b) => !b.name.trim());
      if (hasEmptyName) {
        setStepError("Vui lòng điền đầy đủ họ tên cho tất cả người thụ hưởng");
        return;
      }
      if (validDesignatedAssetsCount === 0) {
        setStepError("Vui lòng gán người nhận cho ít nhất một tài sản trong danh sách");
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleActivatePlan = () => {
    setStepError(null);

    if (!formValues.executor.name.trim()) {
      setStepError("Vui lòng nhập họ và tên Người thực thi (Executor)");
      return;
    }
    if (!formValues.executor.email.trim()) {
      setStepError("Vui lòng nhập email của Người thực thi");
      return;
    }
    if (!formValues.policyConfirmed) {
      setStepError("Bạn bắt buộc phải xác nhận đồng ý với chính sách bàn giao tài sản");
      return;
    }

    // TODO: [P0][WILL-01] DEVELOPER BLUEPRINT
    // 1. [MỤC TIÊU]: Kích hoạt sau khi BE chốt estate-plan DTO và điều kiện.
    // 2. [INPUT & OUTPUT]: Form + designation/version -> kế hoạch được BE xác nhận.
    // 3. [CÁC BƯỚC]: Chốt contract; schema/service/hooks; gửi đúng người nhận; invalidate sau thành công.
    // 4. [HÀM / THƯ VIỆN]: RHF/Zod, shared transport, TanStack Query.
    // 5. [ĐIỀU KIỆN BIÊN]: Không percentage/video/hash/chữ ký giả; không optimistic activation.
    setStepError(APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE);
  };

  const handlePrevStep = () => {
    setStepError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return {
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
  };
}
