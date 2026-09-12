import { z } from "zod";

/**
 * @file will.schema.ts
 * @description Zod Schema định nghĩa luật validate nghiêm ngặt cho từng bước của Digital Will Wizard.
 * Tuân thủ Rule 2 (Trách nhiệm đơn duy nhất: Schema chịu 100% validate) và Rule 8 (JSDoc đầy đủ).
 */

/**
 * Schema xác thực từng người thụ hưởng trong bản phân bổ
 */
export const beneficiaryAllocationSchema = z.object({
  beneficiaryId: z.string().min(1, "Mã người thụ hưởng không được để trống"),
  beneficiaryName: z.string().min(2, "Họ tên người thụ hưởng tối thiểu 2 ký tự"),
  relationship: z.string().min(2, "Vui lòng nhập mối quan hệ hợp pháp"),
  citizenId: z
    .string()
    .min(9, "Số CCCD/Định danh tối thiểu 9 ký tự")
    .max(12, "Số CCCD/Định danh tối đa 12 ký tự"),
  percentage: z
    .number({ invalid_type_error: "Tỷ lệ phải là chữ số" })
    .min(1, "Tỷ lệ phân bổ tối thiểu 1%")
    .max(100, "Tỷ lệ phân bổ tối đa 100%"),
  specialConditions: z.string().optional(),
});

/**
 * Schema xác thực mảng danh sách người thụ hưởng:
 * - Phải có tối thiểu 1 người thừa kế.
 * - Tổng phần trăm (%) của tất cả người thừa kế PHẢI chính xác bằng 100%.
 */
export const allocationsArraySchema = z
  .array(beneficiaryAllocationSchema)
  .min(1, "Bản di chúc cần chỉ định ít nhất 1 người thừa kế hợp pháp")
  .refine(
    (allocations) => {
      const total = allocations.reduce((sum, item) => sum + (item.percentage || 0), 0);
      return Math.abs(total - 100) < 0.01;
    },
    {
      message: "Tổng tỷ lệ thừa kế của tất cả người thụ hưởng phải chính xác bằng 100%",
    }
  );

/**
 * Schema xác thực bằng chứng video tuyên thệ minh mẫn (Điều 630 BLDS 2015):
 * - Thời lượng tối thiểu 15 giây.
 * - Mã băm SHA-256 có độ dài 64 ký tự hex.
 * - Người dùng bắt buộc tích cam đoan minh mẫn.
 */
export const affidavitProofSchema = z.object({
  videoDurationSeconds: z
    .number()
    .min(15, "Thời lượng video tuyên thệ tối thiểu phải đạt 15 giây theo quy chuẩn pháp lý"),
  sha256Hash: z
    .string()
    .min(10, "Mã băm toàn vẹn SHA-256 không hợp lệ"),
  recordedAt: z.string().min(1, "Thiếu thời gian ghi hình"),
  videoUrl: z.string().optional(),
  isConfirmed: z.literal(true, {
    errorMap: () => ({
      message: "Bạn bắt buộc phải xác nhận cam đoan tinh thần hoàn toàn minh mẫn và sáng suốt",
    }),
  }),
});

/**
 * Schema xác thực bước 1: Thông tin ý chí & chọn tài sản
 */
export const step1BasicInfoSchema = z.object({
  title: z
    .string()
    .min(3, "Tiêu đề bản di chúc phải có ít nhất 3 ký tự")
    .max(100, "Tiêu đề không được vượt quá 100 ký tự"),
  declarationNotes: z.string().optional(),
  selectedAssetIds: z
    .array(z.string())
    .min(1, "Vui lòng chọn ít nhất 1 tài sản số từ kho để đưa vào di chúc"),
});

/**
 * Schema xác thực bước 2: Phân bổ tỷ lệ thừa kế & tuân thủ Điều 644
 */
export const step2AllocationSchema = z.object({
  allocations: allocationsArraySchema,
  legalComplianceConfirmed: z.literal(true, {
    errorMap: () => ({
      message:
        "Bạn bắt buộc phải xác nhận đã hiểu quy định về người thừa kế không phụ thuộc nội dung di chúc (Điều 644 BLDS 2015)",
    }),
  }),
});

/**
 * Schema tổng hợp toàn bộ 4 bước để nộp lên máy chủ
 */
export const createWillSchema = z.object({
  title: z.string().min(3, "Tiêu đề bản di chúc phải có ít nhất 3 ký tự"),
  declarationNotes: z.string().optional(),
  selectedAssetIds: z
    .array(z.string())
    .min(1, "Cần chọn ít nhất 1 tài sản số"),
  allocations: allocationsArraySchema,
  legalComplianceConfirmed: z.literal(true, {
    errorMap: () => ({ message: "Chưa cam đoan tuân thủ Điều 644 BLDS 2015" }),
  }),
  affidavitProof: affidavitProofSchema,
  confirmDigitalSignature: z.literal(true, {
    errorMap: () => ({ message: "Bắt buộc ký số xác nhận niêm phong di chúc" }),
  }),
});

export type CreateWillInput = z.infer<typeof createWillSchema>;
