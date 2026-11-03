import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button, Input, Card, CustomCheckbox } from "@/shared/ui";
import { submitClaimSchema, type SubmitClaimFormValues } from "../model/claim.schema";
import type { SubmitClaimRequest } from "@/entities/claim/model/claim.types";
import { LegalDropzone } from "./LegalDropzone";
import { useSubmitClaim } from "../model/useClaims";

/**
 * @file ClaimSubmitForm.tsx
 * @description Biểu mẫu nộp hồ sơ yêu cầu mở thừa kế dành cho Người Thi Hành Di Chúc (Executor).
 * Tuân thủ quy định SRS 3.11.0 (DEATH-02): Bắt buộc tick cam kết "Tôi chịu trách nhiệm trước pháp luật".
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
    control,
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
      legalAttestationConfirmed: false as unknown as true,
    },
  });

  const [scanUrl, isAttested] = useWatch({
    control,
    name: ["deathCertScanUrl", "legalAttestationConfirmed"],
  });

  const onSubmit = (values: SubmitClaimFormValues) => {
    // =========================================================================
    // [RULE 7 - BẮT BUỘC TỰ CODE LOGIC THỰC THI]
    // =========================================================================
    // TODO: [P2][DEATH-04] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
    // 1. [MỤC TIÊU]: Migrate form nộp chứng tử sang death-case lifecycle.
    // 2. [INPUT & OUTPUT]: Form + documentIds + case/version -> server xác nhận nộp hồ sơ.
    // 3. [CÁC BƯỚC]: Sau DEATH-01..03 schema/model trước service/hooks/UI; thay SubmitClaimRequest legacy; xác nhận declaration; disable pending; callback sau BE thành công.
    // 4. [HÀM / THƯ VIỆN]: RHF/Zod, useClaims được migrate, shared/ui Dialog, queryKeys.
    // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Không URL scan tùy ý; không tự tạo grant/duyệt; quyền Executor/hold/version/409; không optimistic cho nộp hồ sơ pháp lý.
    submitClaimMutation(values as SubmitClaimRequest, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  const handleDropzoneSuccess = (fileUrl: string, fileHash: string) => {
    // =========================================================================
    // [RULE 7 - BẮT BUỘC TỰ CODE LOGIC THỰC THI]
    // =========================================================================
    // TODO: [P2][DEATH-05] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
    // 1. [MỤC TIÊU]: Migrate đồng bộ tệp form sang document reference.
    // 2. [INPUT & OUTPUT]: Document DTO đúng case -> trường RHF đã validate.
    // 3. [CÁC BƯỚC]: Sau EVIDENCE-05 thay deathCertScanUrl/hash legacy bằng field DTO chốt; setValue/clearErrors; reset khi đổi case hoặc upload không hợp lệ.
    // 4. [HÀM / THƯ VIỆN]: React Hook Form setValue/resetField, Zod, entity adapter.
    // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Không trust public URL; file đã xóa/chưa finalize/sai case; response muộn không gắn nhầm hồ sơ; không persist chứng cứ vào browser storage.
    setValue("deathCertScanUrl", fileUrl, { shouldValidate: true });
    setValue("deathCertScanHash", fileHash, { shouldValidate: true });
  };

  if (isSuccess) {
    return (
      <Card className="p-8 text-center bg-heritage-surface border-heritage-gold-border space-y-4">
        <div className="w-16 h-16 rounded-full bg-heritage-primary-light text-heritage-success flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-bold text-heritage-primary">Đã Gửi Hồ Sơ Thành Công</h3>
        <p className="text-xs text-heritage-muted max-w-md mx-auto leading-relaxed">
          Hồ sơ yêu cầu mở thừa kế của bạn đã được tiếp nhận và chuyển đến danh sách thẩm định của
          Công chứng viên. Bạn sẽ nhận được thông báo ngay khi có kết quả duyệt.
        </p>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Box Cảnh Báo Trách Nhiệm Pháp Lý */}
      <div className="p-4 rounded-[16px] bg-heritage-warning-bg border border-[#FDE68A] text-xs text-heritage-warning flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-[#F59E0B]" />
        <div className="space-y-1 leading-relaxed">
          <p className="font-bold">Quy định thẩm quyền nộp hồ sơ (Điều 562 & 611 BLDS 2015):</p>
          <p>
            Chỉ Người thực hiện di chúc hợp pháp được chủ kho chỉ định mới có quyền nộp chứng từ tử
            tuất hoặc bản án mất tích. Mọi hành vi làm giả chứng từ sẽ bị xử lý nghiêm minh theo
            pháp luật.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Loại chứng từ pháp lý */}
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs font-bold text-heritage-text">
            Loại Chứng Từ Pháp Lý <span className="text-red-500">*</span>
          </label>
          <select
            {...register("documentType")}
            className="w-full px-3.5 py-2.5 rounded-[12px] bg-heritage-surface border border-heritage-border text-xs font-medium text-heritage-text focus:outline-none focus:ring-2 focus:ring-heritage-gold"
          >
            <option value="DEATH_CERTIFICATE">Trích lục khai tử / Giấy chứng tử (UBND cấp)</option>
          </select>
          {errors.documentType && (
            <p className="text-[11px] text-red-600">{errors.documentType.message}</p>
          )}
        </div>

        {/* Số hiệu chứng từ */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-heritage-text">
            Số Hiệu Chứng Từ / Bản Án <span className="text-red-500">*</span>
          </label>
          <Input
            {...register("deathCertificateNumber")}
            placeholder="VD: TLKT-2026/089/UBND"
            className="bg-heritage-surface"
          />
          {errors.deathCertificateNumber && (
            <p className="text-[11px] text-red-600">{errors.deathCertificateNumber.message}</p>
          )}
        </div>

        {/* Ngày cấp chứng từ */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-heritage-text">
            Ngày Cấp <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            {...register("deathCertificateIssueDate")}
            className="bg-heritage-surface"
          />
          {errors.deathCertificateIssueDate && (
            <p className="text-[11px] text-red-600">{errors.deathCertificateIssueDate.message}</p>
          )}
        </div>

        {/* Cơ quan / Nơi cấp */}
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs font-bold text-heritage-text">
            Cơ Quan / Nơi Cấp Chứng Từ <span className="text-red-500">*</span>
          </label>
          <Input
            {...register("deathCertificateIssuer")}
            placeholder="VD: UBND Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
            className="bg-heritage-surface"
          />
          {errors.deathCertificateIssuer && (
            <p className="text-[11px] text-red-600">{errors.deathCertificateIssuer.message}</p>
          )}
        </div>
      </div>

      {/* Khung Kéo Thả Tải Lên Tệp Scan */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-heritage-text">
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
        <label className="text-xs font-bold text-heritage-text">
          Ghi Chú Của Người Thi Hành (Tùy chọn)
        </label>
        <textarea
          {...register("executorNotes")}
          rows={3}
          placeholder="Cung cấp thêm thông tin đối soát hoặc hoàn cảnh gia đình nếu có..."
          className="w-full px-3.5 py-2.5 rounded-[12px] bg-heritage-surface border border-heritage-border text-xs font-medium text-heritage-text focus:outline-none focus:ring-2 focus:ring-heritage-gold"
        />
      </div>

      {/* Ô Cam Kết Trách Nhiệm Pháp Lý Bắt Buộc (DEATH-02) */}
      <div className="p-4 rounded-[16px] bg-heritage-surface border border-heritage-gold-border space-y-2">
        <CustomCheckbox
          {...register("legalAttestationConfirmed")}
          id="executor-legal-attestation"
          label={
            <span className="font-bold text-heritage-primary">
              Tôi chịu trách nhiệm trước pháp luật về tính hợp pháp và trung thực của giấy chứng tử
              này.
            </span>
          }
        />
        <p className="text-[11px] text-heritage-muted pl-6 leading-relaxed">
          Cam kết theo quy định SRS 3.11.0 (DEATH-02). Hệ thống sẽ gắn danh tính số và dấu thời gian
          của bạn vào bản nộp hồ sơ.
        </p>
        {errors.legalAttestationConfirmed && (
          <p className="text-[11px] text-red-600 font-semibold pl-6">
            {errors.legalAttestationConfirmed.message}
          </p>
        )}
      </div>

      {/* Nút Submit */}
      <Button
        type="submit"
        disabled={isPending || !scanUrl || !isAttested}
        className="w-full min-h-[48px] rounded-[20px] bg-heritage-sidebar hover:bg-heritage-sidebar/90 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
      >
        <Send className="w-4 h-4 text-heritage-gold" />
        <span>
          {isPending ? "Đang Gửi Hồ Sơ..." : "Nộp Giấy Chứng Tử Cho Người Xác Minh (Verifier)"}
        </span>
      </Button>
    </form>
  );
};
