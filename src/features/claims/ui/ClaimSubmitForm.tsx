import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Send, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button, Input, Card } from "@/shared/ui";
import { submitClaimSchema, type SubmitClaimFormValues } from "../model/claim.schema";
import { LegalDropzone } from "./LegalDropzone";
import { useSubmitClaim } from "../model/useClaims";

/**
 * @file ClaimSubmitForm.tsx
 * @description Biểu mẫu nộp hồ sơ yêu cầu mở thừa kế dành cho Người Thi Hành Di Chúc.
 * Áp dụng React Hook Form + Zod Schema (Form State chuẩn mực, không dùng useState cho các ô input).
 */

export interface ClaimSubmitFormProps {
  vaultId?: string;
  onSuccess?: () => void;
}

export const ClaimSubmitForm: React.FC<ClaimSubmitFormProps> = ({
  vaultId = "vlt_01",
  onSuccess,
}) => {
  const { mutate: submitClaimMutation, isPending, isSuccess } = useSubmitClaim();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SubmitClaimFormValues>({
    resolver: zodResolver(submitClaimSchema),
    defaultValues: {
      vaultId,
      documentType: "DEATH_CERTIFICATE",
      deathCertificateNumber: "",
      deathCertificateIssueDate: "",
      deathCertificateIssuer: "",
      deathCertScanUrl: "",
      deathCertScanHash: "",
      executorNotes: "",
    },
  });

  const scanUrl = watch("deathCertScanUrl");

  const onSubmit = (values: SubmitClaimFormValues) => {
    // =========================================================================
    // [RULE 7 - BẮT BUỘC TỰ CODE LOGIC THỰC THI]
    // =========================================================================
    // TODO: [Developer Step - Xử lý nộp hồ sơ yêu cầu mở thừa kế]
    // 1. Kiểm tra tính hợp lệ của values (đã qua Zod Resolver validate)
    // 2. Kích hoạt submitClaimMutation với dữ liệu values
    // 3. Trong callback onSuccess của mutation, gọi hàm callback props onSuccess?.()
    submitClaimMutation(values, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  const handleDropzoneSuccess = (fileUrl: string, fileHash: string) => {
    // =========================================================================
    // [RULE 7 - BẮT BUỘC TỰ CODE LOGIC THỰC THI]
    // =========================================================================
    // TODO: [Developer Step - Đồng bộ tệp tải lên vào Form State]
    // 1. Dùng setValue("deathCertScanUrl", fileUrl, { shouldValidate: true })
    // 2. Dùng setValue("deathCertScanHash", fileHash, { shouldValidate: true })
    setValue("deathCertScanUrl", fileUrl, { shouldValidate: true });
    setValue("deathCertScanHash", fileHash, { shouldValidate: true });
  };

  if (isSuccess) {
    return (
      <Card className="p-8 text-center bg-[#FAF9F5] border-[#E8DCC6] space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#E5EDE8] text-[#059669] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-bold text-[#0B291E]">Đã Gửi Hồ Sơ Thành Công</h3>
        <p className="text-xs text-[#66786E] max-w-md mx-auto leading-relaxed">
          Hồ sơ yêu cầu mở thừa kế của bạn đã được tiếp nhận và chuyển đến danh sách thẩm định của Công chứng viên. Bạn sẽ nhận được thông báo ngay khi có kết quả duyệt.
        </p>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Box Cảnh Báo Trách Nhiệm Pháp Lý */}
      <div className="p-4 rounded-[16px] bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#B45309] flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-[#F59E0B]" />
        <div className="space-y-1 leading-relaxed">
          <p className="font-bold">Quy định thẩm quyền nộp hồ sơ (Điều 562 & 611 BLDS 2015):</p>
          <p>
            Chỉ Người thi hành di chúc hợp pháp được chủ kho chỉ định mới có quyền nộp chứng từ tử tuất hoặc bản án mất tích. Mọi hành vi làm giả chứng từ sẽ bị xử lý nghiêm minh theo pháp luật.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Loại chứng từ pháp lý */}
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs font-bold text-[#14241C]">
            Loại Chứng Từ Pháp Lý <span className="text-red-500">*</span>
          </label>
          <select
            {...register("documentType")}
            className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-[#DCD9D0] text-xs font-medium text-[#14241C] focus:outline-none focus:ring-2 focus:ring-[#B88E4C]"
          >
            <option value="DEATH_CERTIFICATE">Trích lục khai tử (UBND cấp)</option>
            <option value="COURT_MISSING_DECREE">Quyết định Tòa án tuyên bố mất tích (Điều 68 BLDS)</option>
            <option value="COURT_DEATH_DECREE">Quyết định Tòa án tuyên bố đã chết (Điều 71 BLDS)</option>
          </select>
          {errors.documentType && (
            <p className="text-[11px] text-red-600">{errors.documentType.message}</p>
          )}
        </div>

        {/* Số hiệu chứng từ */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#14241C]">
            Số Hiệu Chứng Từ / Bản Án <span className="text-red-500">*</span>
          </label>
          <Input
            {...register("deathCertificateNumber")}
            placeholder="VD: TLKT-2026/089/UBND"
            className="bg-[#FAF9F5]"
          />
          {errors.deathCertificateNumber && (
            <p className="text-[11px] text-red-600">{errors.deathCertificateNumber.message}</p>
          )}
        </div>

        {/* Ngày cấp chứng từ */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#14241C]">
            Ngày Cấp <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            {...register("deathCertificateIssueDate")}
            className="bg-[#FAF9F5]"
          />
          {errors.deathCertificateIssueDate && (
            <p className="text-[11px] text-red-600">{errors.deathCertificateIssueDate.message}</p>
          )}
        </div>

        {/* Cơ quan / Nơi cấp */}
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs font-bold text-[#14241C]">
            Cơ Quan / Nơi Cấp Chứng Từ <span className="text-red-500">*</span>
          </label>
          <Input
            {...register("deathCertificateIssuer")}
            placeholder="VD: UBND Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
            className="bg-[#FAF9F5]"
          />
          {errors.deathCertificateIssuer && (
            <p className="text-[11px] text-red-600">{errors.deathCertificateIssuer.message}</p>
          )}
        </div>
      </div>

      {/* Khung Kéo Thả Tải Lên Tệp Scan */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#14241C]">
          Tệp Scan Bản Gốc (Đã niêm phong băm SHA-256) <span className="text-red-500">*</span>
        </label>
        <LegalDropzone onUploadSuccess={handleDropzoneSuccess} disabled={isPending} />
        {errors.deathCertScanUrl && (
          <p className="text-[11px] text-red-600 font-semibold mt-1">
            {errors.deathCertScanUrl.message}
          </p>
        )}
      </div>

      {/* Ghi chú giải trình bổ sung */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#14241C]">Ghi Chú Của Người Thi Hành (Tùy chọn)</label>
        <textarea
          {...register("executorNotes")}
          rows={3}
          placeholder="Cung cấp thêm thông tin đối soát hoặc hoàn cảnh gia đình nếu có..."
          className="w-full px-3.5 py-2.5 rounded-[12px] bg-[#FAF9F5] border border-[#DCD9D0] text-xs font-medium text-[#14241C] focus:outline-none focus:ring-2 focus:ring-[#B88E4C]"
        />
      </div>

      {/* Nút Submit */}
      <Button
        type="submit"
        disabled={isPending || !scanUrl}
        className="w-full min-h-[48px] rounded-[20px] bg-[#0B291E] hover:bg-[#133E2F] text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
      >
        <Send className="w-4 h-4 text-[#B88E4C]" />
        <span>{isPending ? "Đang Gửi Hồ Sơ..." : "Nộp Hồ Sơ Mở Thừa Kế Cho Công Chứng Viên"}</span>
      </Button>
    </form>
  );
};
