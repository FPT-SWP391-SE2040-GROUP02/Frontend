import { z } from "zod";
const timestamp = z.string().datetime({ offset: true });
/** Raw trạng thái eKYC; score là cosine, không phải phần trăm. */
export const ekycStatusSchema = z.object({
  status: z.enum(["NOT_STARTED", "PENDING", "PASSED", "FAILED"]),
  verificationId: z.string().uuid().nullable(),
  citizenIdLast4: z.string().regex(/^(?:\d{4})?$/),
  faceMatchScore: z.number().nullable(),
  matchThreshold: z.number(),
  spoofCheckPassed: z.boolean().nullable(),
  createdAt: timestamp.nullable(),
  completedAt: timestamp.nullable(),
});
/** OCR chỉ giữ RAM trong form; không persist dữ liệu giấy tờ vào cache/storage. */
export const ekycDocumentSchema = z.object({
  verificationId: z.string().uuid().nullable(),
  idNumber: z.string(),
  fullName: z.string(),
  dateOfBirth: z.string(),
  residenceAddress: z.string(),
  canMatchFace: z.boolean(),
  expiresAt: timestamp.nullable(),
  warnings: z.array(z.string()),
});
