import { z } from "zod";
import { createAssetSchema } from "./asset.schema";
import { getAssetStrategy } from "./strategies/assetStrategyMap";

/** @description Validation của bản xem trước; không chứa beneficiary hoặc tham số Shamir giả. */
export const assetPreviewSchema = createAssetSchema
  .pick({
    title: true,
    description: true,
    assetType: true,
    specificData: true,
  })
  .superRefine((values, context) => {
    if (!getAssetStrategy(values.assetType).validate(values.specificData))
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["specificData"],
        message: "Vui lòng kiểm tra các trường bắt buộc của loại tài sản đã chọn.",
      });
  });

/** @description Dữ liệu form preview, chưa phải request gửi BE. */
export type AssetPreviewInput = z.infer<typeof assetPreviewSchema>;
