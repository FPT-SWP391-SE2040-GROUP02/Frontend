import type { CreateWillFormValues, CreateWillRequest } from "../model/will.types";
export { toWillViewModel } from "@/entities/will/lib/adapters";

/**
 * Chuyển đổi từ dữ liệu Form nhập liệu sang Payload Request gửi lên C# API
 * @param form Dữ liệu thu thập từ Stepper 4 bước
 * @returns Payload Request chuẩn bị gửi qua mạng
 */
export function toCreateWillPayload(form: CreateWillFormValues): CreateWillRequest {
  return {
    title: form.title,
    declarationNotes: form.declarationNotes,
    selectedAssetIds: form.selectedAssetIds,
    allocations: form.allocations,
    affidavitProof: form.affidavitProof,
  };
}
