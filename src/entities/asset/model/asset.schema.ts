// ==============================================================================
// SWP391 - LegacyVault: Digital Asset Zod Validation Schemas
// Đảm nhận 100% việc validate dữ liệu form tài sản số
// ==============================================================================

import { z } from "zod";
import { APP_MESSAGES } from "@/shared/constants";
import { statusSchema } from "@/shared/schemas";
import { ASSET_CATEGORY, ASSET_DATA_TYPE, PROPERTY_TYPE } from "./asset.types";

/**
 * @description Zod Schema cho Danh mục tài sản số.
 */
export const assetCategorySchema = z.enum([
  ASSET_CATEGORY.CRYPTO,
  ASSET_CATEGORY.CREDENTIAL,
  ASSET_CATEGORY.DOCUMENT,
], {
  message: APP_MESSAGES.VALIDATION.REQUIRED("Danh mục tài sản"),
});

/**
 * @description Zod Schema cho Loại dữ liệu chi tiết của tài sản.
 */
export const assetDataTypeSchema = z.enum([
  ASSET_DATA_TYPE.SEED_PHRASE,
  ASSET_DATA_TYPE.PRIVATE_KEY,
  ASSET_DATA_TYPE.WALLET_ADDRESS,
  ASSET_DATA_TYPE.WEB_ACCOUNT,
  ASSET_DATA_TYPE.SERVER_SSH,
  ASSET_DATA_TYPE.API_KEY,
  ASSET_DATA_TYPE.PDF_CONTRACT,
  ASSET_DATA_TYPE.LEGAL_DEED,
  ASSET_DATA_TYPE.ENCRYPTED_NOTE,
], {
  message: APP_MESSAGES.VALIDATION.REQUIRED("Loại dữ liệu tài sản"),
});

/**
 * @description Zod Schema cho Loại quyền sở hữu tài sản di sản.
 */
export const propertyTypeSchema = z.enum([
  PROPERTY_TYPE.SEPARATE_PROPERTY,
  PROPERTY_TYPE.COMMON_PROPERTY,
], {
  message: APP_MESSAGES.VALIDATION.REQUIRED("Quyền sở hữu tài sản"),
});

/**
 * @description Regex kiểm tra địa chỉ ví EVM (0x...) và Bitcoin (1/3/bc1...).
 */
const WALLET_REGEX = /^(0x[a-fA-F0-9]{40}|(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,39})$/;

/**
 * @description Regex kiểm tra Private Key Hex (64 ký tự).
 */
const PRIVATE_KEY_HEX_REGEX = /^(0x)?[a-fA-F0-9]{64}$/;

/**
 * @description Zod Schema validate trường dữ liệu nhạy cảm của Tài sản Crypto.
 */
export const cryptoSecretSchema = z.object({
  /** Địa chỉ ví công khai */
  walletAddress: z
    .string()
    .min(1, { message: APP_MESSAGES.VALIDATION.REQUIRED("Địa chỉ ví") })
    .regex(WALLET_REGEX, { message: "Địa chỉ ví Web3 không hợp lệ (EVM / Bitcoin)" }),
  /** Seed phrase (12, 18 hoặc 24 từ) */
  seedPhrase: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const words = val.trim().split(/\s+/);
        return [12, 18, 24].includes(words.length);
      },
      { message: "Cụm từ khôi phục (Seed phrase) phải gồm chính xác 12, 18 hoặc 24 từ" }
    ),
  /** Private key bí mật */
  privateKey: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return PRIVATE_KEY_HEX_REGEX.test(val.trim());
      },
      { message: "Khóa bí mật (Private Key) phải là chuỗi Hex 64 ký tự hợp lệ" }
    ),
  /** Mạng blockchain */
  network: z.string().min(1, { message: APP_MESSAGES.VALIDATION.REQUIRED("Mạng Blockchain") }),
});

/**
 * @description Zod Schema validate trường dữ liệu nhạy cảm của Tài sản Tài khoản / Mật khẩu.
 */
export const credentialSecretSchema = z.object({
  /** Đường dẫn / Website đăng nhập */
  serviceUrl: z
    .string()
    .url({ message: "URL dịch vụ không đúng định dạng web" })
    .or(z.string().min(1, { message: APP_MESSAGES.VALIDATION.REQUIRED("Dịch vụ / Tên hệ thống") })),
  /** Tên đăng nhập hoặc Email */
  username: z.string().min(1, { message: APP_MESSAGES.VALIDATION.REQUIRED("Tên đăng nhập / Email") }),
  /** Mật khẩu truy cập */
  password: z.string().min(1, { message: APP_MESSAGES.VALIDATION.REQUIRED("Mật khẩu") }),
  /** Mã bí mật 2FA hoặc Khóa phục hồi (nếu có) */
  twoFactorSecret: z.string().optional(),
  /** Ghi chú bổ sung */
  notes: z.string().max(500, { message: APP_MESSAGES.VALIDATION.MAX_LENGTH("Ghi chú", 500) }).optional(),
});

/**
 * @description Zod Schema validate trường dữ liệu của Tài liệu bí mật / File đính kèm.
 */
export const documentSecretSchema = z.object({
  /** Tên tệp tin gốc */
  fileName: z.string().min(1, { message: APP_MESSAGES.VALIDATION.REQUIRED("Tên tệp tin") }),
  /** Loại MIME của tệp tin */
  mimeType: z.string().min(1, { message: APP_MESSAGES.VALIDATION.REQUIRED("Định dạng tệp tin") }),
  /** Dung lượng tệp tin (tối đa 10MB = 10 * 1024 * 1024 bytes) */
  fileSizeBytes: z
    .number()
    .max(10 * 1024 * 1024, { message: "Dung lượng tệp tin không được vượt quá 10MB" }),
  /** Dữ liệu Base64 của tệp tin */
  fileBase64: z.string().min(1, { message: APP_MESSAGES.VALIDATION.REQUIRED("Nội dung tệp tin") }),
  /** Ghi chú pháp lý hoặc tóm tắt nội dung tài liệu */
  description: z.string().optional(),
});

/**
 * @description Zod Schema chuẩn cho Form thêm mới Tài sản số tổng quát.
 */
export const createAssetFormSchema = z.object({
  /** ID kho lưu trữ liên kết */
  vaultId: z.string().uuid({ message: "Mã Kho lưu trữ không hợp lệ" }),
  /** Tiêu đề gợi nhớ của tài sản */
  title: z
    .string()
    .min(3, { message: APP_MESSAGES.VALIDATION.MIN_LENGTH("Tiêu đề", 3) })
    .max(200, { message: APP_MESSAGES.VALIDATION.MAX_LENGTH("Tiêu đề", 200) }),
  /** Danh mục tài sản */
  category: assetCategorySchema,
  /** Loại dữ liệu chi tiết */
  dataType: assetDataTypeSchema,
  /** Loại quyền sở hữu */
  propertyType: propertyTypeSchema,
  /** Dữ liệu thô nhạy cảm (sẽ được mã hóa trước khi gửi API) */
  secretPayload: z.union([cryptoSecretSchema, credentialSecretSchema, documentSecretSchema]),
});

/**
 * @description Zod Schema cho Form cập nhật Tài sản số.
 */
export const updateAssetFormSchema = createAssetFormSchema.partial().extend({
  status: statusSchema.optional(),
});

/** Kiểu dữ liệu infer từ createAssetFormSchema */
export type CreateAssetFormValues = z.infer<typeof createAssetFormSchema>;

/** Kiểu dữ liệu infer từ updateAssetFormSchema */
export type UpdateAssetFormValues = z.infer<typeof updateAssetFormSchema>;
