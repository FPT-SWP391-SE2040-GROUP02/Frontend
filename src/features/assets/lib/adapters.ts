import type { CreateAssetFormValues, CreateAssetRequest } from "../model/asset.types";
import { getAssetStrategy } from "../model/strategies/assetStrategyMap";
export { toViewModel } from "@/entities/asset/lib/adapters";

/**
 * Chuyển đổi từ dữ liệu Form nhập liệu sang Payload gửi lên Backend API
 * @param form Dữ liệu thu thập từ Form tạo mới
 * @returns Payload Request chuẩn bị gửi qua mạng
 */
export function toCreatePayload(form: CreateAssetFormValues): CreateAssetRequest {
  const strategy = getAssetStrategy(form.assetType);
  const encryptedPayload = strategy.preparePayload(form.specificData);

  return {
    title: form.title,
    assetType: form.assetType,
    description: form.description,
    encryptedPayload,
    beneficiaryIds: form.beneficiaryIds,
    shamirThreshold: form.shamirThreshold,
    shamirTotalShares: form.shamirTotalShares,
  };
}
