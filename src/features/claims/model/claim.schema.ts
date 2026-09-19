import { z } from "zod";

/**
 * @file claim.schema.ts
 * @description Zod Schema kiểm tra tính hợp lệ của hồ sơ yêu cầu mở thừa kế nộp bởi Người Thi Hành (Executor).
 * Tuân thủ quy định pháp luật hộ tịch và Điều 68/71 Bộ luật Dân sự 2015.
 */
export const submitClaimSchema = z.object({
  vaultId: z.string().min(1, "Vui lòng chọn két di sản cần mở thừa kế"),
  documentType: z.enum(["DEATH_CERTIFICATE", "COURT_MISSING_DECREE", "COURT_DEATH_DECREE"], {
    errorMap: () => ({ message: "Vui lòng chọn loại chứng từ pháp lý hợp lệ" }),
  }),
  deathCertificateNumber: z
    .string()
    .min(3, "Số hiệu trích lục / số bản án phải có ít nhất 3 ký tự")
    .max(50, "Số hiệu không được vượt quá 50 ký tự"),
  deathCertificateIssueDate: z
    .string()
    .min(1, "Vui lòng chọn ngày cấp chứng từ"),
  deathCertificateIssuer: z
    .string()
    .min(5, "Nơi cấp chứng từ phải có ít nhất 5 ký tự (VD: UBND Phường Bến Nghé)")
    .max(150, "Nơi cấp không được vượt quá 150 ký tự"),
  deathCertScanUrl: z
    .string()
    .url("Đường dẫn tệp scan không hợp lệ")
    .min(1, "Vui lòng tải lên tệp scan chứng từ hợp pháp"),
  deathCertScanHash: z
    .string()
    .length(64, "Mã băm SHA-256 của tệp scan phải đúng 64 ký tự hex")
    .regex(
      /^[0-9a-fA-F]{64}$/,
      "Mã băm SHA-256 chỉ được chứa các ký tự hex hợp lệ (0-9, a-f, A-F)"
    ),
  executorNotes: z
    .string()
    .max(500, "Ghi chú không được vượt quá 500 ký tự")
    .optional(),
});

export type SubmitClaimFormValues = z.infer<typeof submitClaimSchema>;
