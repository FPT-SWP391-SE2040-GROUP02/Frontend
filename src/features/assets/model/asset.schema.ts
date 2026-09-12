import { z } from "zod";
import { APP_MESSAGES } from "@/shared/constants";

/**
 * @file asset.schema.ts
 * @description Zod validation schemas cho các loại tài sản số trong kho di sản.
 */

/**
 * Schema cho dữ liệu tài sản Crypto (Ví tiền mã hóa / Khóa riêng)
 */
export const cryptoDataSchema = z.object({
  walletAddress: z
    .string()
    .trim()
    .min(1, { message: APP_MESSAGES.VALIDATION.REQUIRED("Địa chỉ ví") }),
  network: z.enum(["ETHEREUM", "BITCOIN", "SOLANA", "BINANCE_SMART_CHAIN", "OTHER"], {
    required_error: "Vui lòng chọn mạng lưới blockchain",
  }),
  seedPhrase: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => {
        if (!val || val.length === 0) return true;
        const words = val.trim().split(/\s+/);
        return words.length === 12 || words.length === 24;
      },
      { message: "Cụm từ khôi phục (Seed phrase) bắt buộc phải có đúng 12 hoặc 24 từ" }
    ),
  privateKey: z.string().trim().optional(),
});

export type CryptoDataInput = z.infer<typeof cryptoDataSchema>;

/**
 * Schema cho dữ liệu tài khoản số (Web & Cloud Credentials)
 */
export const credentialDataSchema = z.object({
  serviceName: z
    .string()
    .trim()
    .min(1, { message: APP_MESSAGES.VALIDATION.REQUIRED("Tên nền tảng/dịch vụ") }),
  serviceUrl: z
    .string()
    .trim()
    .url({ message: "Địa chỉ website không đúng định dạng URL" })
    .optional()
    .or(z.literal("")),
  username: z
    .string()
    .trim()
    .min(1, { message: APP_MESSAGES.VALIDATION.REQUIRED("Tên đăng nhập / Email") }),
  password: z
    .string()
    .min(1, { message: APP_MESSAGES.VALIDATION.REQUIRED("Mật khẩu tài khoản") }),
  twoFactorBackupCodes: z.string().trim().optional(),
});

export type CredentialDataInput = z.infer<typeof credentialDataSchema>;

/**
 * Schema cho dữ liệu tài liệu bảo mật số (Legal & Financial Documents)
 */
export const documentDataSchema = z.object({
  documentCategory: z.enum([
    "REAL_ESTATE_CERTIFICATE",
    "INSURANCE_POLICY",
    "SHARE_CERTIFICATE",
    "INTELLECTUAL_PROPERTY",
    "OTHER_DOCUMENT",
  ]),
  identifierNumber: z
    .string()
    .trim()
    .min(1, { message: APP_MESSAGES.VALIDATION.REQUIRED("Số hiệu giấy tờ/hợp đồng") }),
  notes: z.string().max(1000).optional(),
});

export type DocumentDataInput = z.infer<typeof documentDataSchema>;

/**
 * Schema form tạo tài sản số hoàn chỉnh
 */
export const createAssetSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { message: APP_MESSAGES.VALIDATION.MIN_LENGTH("Tên tài sản", 3) })
    .max(100, { message: APP_MESSAGES.VALIDATION.MAX_LENGTH("Tên tài sản", 100) }),
  assetType: z.enum(["CRYPTO", "CREDENTIAL", "DOCUMENT"], {
    required_error: "Vui lòng chọn loại tài sản số",
  }),
  description: z.string().max(500).optional(),
  beneficiaryIds: z.array(z.string()).min(1, {
    message: "Bắt buộc chỉ định ít nhất 1 người thừa kế thụ hưởng tài sản này",
  }),
  shamirThreshold: z.number().int().min(1).default(2),
  shamirTotalShares: z.number().int().min(1).default(3),
  specificData: z.record(z.unknown()),
});

export type CreateAssetSchemaInput = z.infer<typeof createAssetSchema>;
