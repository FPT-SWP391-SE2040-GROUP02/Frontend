import { isAxiosError } from "axios";
import { z } from "zod";

/** Mã BE trả trong missingRequirements khi AI không thấy trang nào là giấy chứng tử. */
export const CERTIFICATE_NOT_RECOGNIZED = "DEATH_CERTIFICATE_NOT_RECOGNIZED";

/** Kết quả AI cho một trang (BE DeathCertificateFileCheck). */
const fileCheckSchema = z.object({
  fileId: z.string(),
  fileName: z.string(),
  status: z.enum(["RECOGNIZED", "NOT_RECOGNIZED", "UNAVAILABLE"]),
  documentType: z.string().nullish(),
});
export type CertificateFileCheck = z.infer<typeof fileCheckSchema>;

const rejectionSchema = z.object({
  code: z.literal("DEATH_CASE_INCOMPLETE"),
  missingRequirements: z.array(z.string()),
  fileChecks: z.array(fileCheckSchema),
});

/** Đọc kết quả AI từng trang khi BE chặn gửi hồ sơ; lỗi khác trả null. */
export function readCertificateRejection(error: unknown): CertificateFileCheck[] | null {
  if (!isAxiosError(error)) return null;
  const parsed = rejectionSchema.safeParse(error.response?.data);
  if (!parsed.success || !parsed.data.missingRequirements.includes(CERTIFICATE_NOT_RECOGNIZED))
    return null;
  return parsed.data.fileChecks;
}
