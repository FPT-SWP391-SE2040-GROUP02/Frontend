import { z } from "zod";

/**
 * @file handover.schema.ts
 * @description Các Zod Schemas kiểm thực dữ liệu cho Phân hệ Bàn giao Di sản Số & Xác thực eKYC.
 * Tuân thủ Rule 4 (Bước 1 Model), Rule 7 (Validation Rules), Rule 8 (JSDoc 100%).
 */

/**
 * Schema kiểm thực kết quả nhận diện khuôn mặt sinh trắc học và kiểm tra người thật 3D (eKYC)
 */
export const ekycBiometricSchema = z.object({
  sessionId: z.string().min(1, "Mã phiên xác thực sinh trắc học không được để trống"),
  faceMatchScore: z
    .number({ required_error: "Vui lòng cung cấp điểm số khớp khuôn mặt" })
    .min(85, "Độ khớp sinh trắc học phải đạt tối thiểu 85.0% theo tiêu chuẩn an ninh bàn giao"),
  livenessConfidence: z
    .number({ required_error: "Vui lòng cung cấp độ tin cậy kiểm tra người thật" })
    .min(90, "Độ tin cậy phát hiện người thật 3D (Liveness) phải đạt tối thiểu 90.0% để ngăn ngừa Deepfake"),
  biometricPassed: z.literal(true, {
    errorMap: () => ({ message: "Bắt buộc vượt qua kiểm tra sinh trắc học trước khi mở khóa di sản" }),
  }),
});

export type EkycBiometricFormValues = z.infer<typeof ekycBiometricSchema>;

/**
 * Schema kiểm thực 2 mảnh khóa Shamir trước khi đưa vào hàm giải mã tại RAM máy khách
 */
export const shamirRecombineSchema = z.object({
  share1: z
    .string()
    .min(10, "Mảnh khóa 1 (Kho di sản) không đúng định dạng")
    .regex(/^\d+-[0-9a-fA-F]+$/, "Mảnh khóa 1 phải có định dạng chuẩn index-hex (VD: 1-a1b2c3...)"),
  share2: z
    .string()
    .min(10, "Mảnh khóa 2 (Công chứng viên) không đúng định dạng")
    .regex(/^\d+-[0-9a-fA-F]+$/, "Mảnh khóa 2 phải có định dạng chuẩn index-hex (VD: 2-d4e5f6...)"),
});

export type ShamirRecombineFormValues = z.infer<typeof shamirRecombineSchema>;

/**
 * Schema kiểm thực từ chối nhận di sản thừa kế theo Điều 620 Bộ luật Dân sự 2015
 */
export const refuseInheritanceSchema = z.object({
  claimId: z.string().min(1, "Mã hồ sơ không hợp lệ"),
  reason: z
    .string()
    .min(30, "Lý do từ chối nhận di sản phải từ 30 ký tự trở lên để đảm bảo tính pháp lý rõ ràng")
    .max(1000, "Lý do không được vượt quá 1000 ký tự"),
  confirmLegalWaiver: z.literal(true, {
    errorMap: () => ({
      message: "Bạn bắt buộc phải đánh dấu xác nhận cam kết tự nguyện từ chối quyền hưởng di sản",
    }),
  }),
  notarizedDocScanUrl: z
    .string()
    .url("Đường dẫn văn bản công chứng từ chối thừa kế không hợp lệ")
    .optional()
    .or(z.literal("")),
});

export type RefuseInheritanceFormValues = z.infer<typeof refuseInheritanceSchema>;
