import { z } from "zod";
import { apiClient } from "@/shared/api";
import { readBlobFailure } from "@/shared/lib/saveBlob";
import {
  availableHandoverSchema,
  myClaimSchema,
  ownerRequestSchema,
} from "../model/handoverRequest.schema";
import type { TransferOptions } from "@/shared/lib/useTransfer";
import type { HandoverDocuments } from "../model/handoverDocuments";

const id = z.string().uuid();
const base = "/handover/requests";

/** Gửi lần đầu: tệp tách theo loại; Backend nhận giấy tờ khác ở trường "files". */
function requestForm(vaultId: string, note: string, documents: HandoverDocuments): FormData {
  const form = new FormData();
  form.append("vaultId", vaultId);
  form.append("note", note.trim());
  for (const file of documents.deathCertificates) form.append("deathCertificates", file);
  for (const file of documents.wills) form.append("wills", file);
  for (const file of documents.others) form.append("files", file);
  return form;
}

/** Nộp bổ sung: không chia loại. */
function supplementForm(note: string, files: File[]): FormData {
  const form = new FormData();
  form.append("note", note.trim());
  for (const file of files) form.append("files", file);
  return form;
}

/** Người nhận gửi yêu cầu nhận tài sản kèm giấy tờ; Chủ tài sản xem và hủy yêu cầu đang mở của kho. */
export const handoverRequestService = {
  /**
   * Gửi yêu cầu bằng tài khoản đã đăng nhập (email đã xác minh khớp email Chủ tài sản khai), không cần link riêng.
   * Multipart: bỏ Content-Type mặc định để trình duyệt tự đặt boundary.
   */
  async submitByAccount(vaultId: string, note: string, documents: HandoverDocuments) {
    return myClaimSchema.parse(
      await apiClient.post<unknown, unknown>(
        `${base}/by-account`,
        requestForm(id.parse(vaultId), note, documents),
        { headers: { "Content-Type": undefined } },
      ),
    );
  },
  /** Các kho được để lại cho tài khoản này; email chưa xác minh thì Backend trả mảng rỗng. */
  async available(signal?: AbortSignal) {
    return z
      .array(availableHandoverSchema)
      .parse(await apiClient.get<unknown, unknown>(`${base}/available`, { signal }));
  },
  async mine(signal?: AbortSignal) {
    return z
      .array(myClaimSchema)
      .parse(await apiClient.get<unknown, unknown>(`${base}/mine`, { signal }));
  },
  async supplement(claimId: string, note: string, files: File[]) {
    return myClaimSchema.parse(
      await apiClient.post<unknown, unknown>(
        `${base}/${id.parse(claimId)}/supplement`,
        supplementForm(note, files),
        { headers: { "Content-Type": undefined } },
      ),
    );
  },
  async downloadFile(claimId: string, fileId: string, options?: TransferOptions): Promise<Blob> {
    try {
      return await apiClient.get<Blob, Blob>(
        `${base}/${id.parse(claimId)}/files/${id.parse(fileId)}`,
        { responseType: "blob", ...options },
      );
    } catch (failure) {
      throw await readBlobFailure(failure);
    }
  },
  /** Yêu cầu đang mở của kho; Backend trả 204 khi không có thì trả null. */
  async ownerRequest(vaultId: string, signal?: AbortSignal) {
    const data = await apiClient.get<unknown, unknown>(
      `/vaults/${id.parse(vaultId)}/handover-request`,
      { signal },
    );
    if (data === undefined || data === null || data === "") return null;
    return ownerRequestSchema.parse(data);
  },
};
