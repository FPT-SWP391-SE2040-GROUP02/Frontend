import { z } from "zod";
import { apiClient } from "@/shared/api";
import { readBlobFailure } from "@/shared/lib/saveBlob";
import {
  myClaimSchema,
  ownerRequestSchema,
  requestPreviewSchema,
} from "../model/handoverRequest.schema";

const id = z.string().uuid();
const base = "/handover/requests";

function filesForm(files: File[], note: string, token?: string): FormData {
  const form = new FormData();
  if (token !== undefined) form.append("token", token);
  form.append("note", note.trim());
  for (const file of files) form.append("files", file);
  return form;
}

/** Người nhận gửi yêu cầu nhận tài sản kèm giấy tờ; Chủ kho xem và hủy yêu cầu đang mở của kho. */
export const handoverRequestService = {
  async preview(token: string, signal?: AbortSignal) {
    return requestPreviewSchema.parse(
      await apiClient.get<unknown, unknown>(`${base}/preview`, { params: { token }, signal }),
    );
  },
  /** Multipart: bỏ Content-Type mặc định để trình duyệt tự đặt boundary. */
  async submit(token: string, note: string, files: File[]) {
    return myClaimSchema.parse(
      await apiClient.post<unknown, unknown>(base, filesForm(files, note, token), {
        headers: { "Content-Type": undefined },
      }),
    );
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
        filesForm(files, note),
        { headers: { "Content-Type": undefined } },
      ),
    );
  },
  async downloadFile(claimId: string, fileId: string): Promise<Blob> {
    try {
      return await apiClient.get<Blob, Blob>(
        `${base}/${id.parse(claimId)}/files/${id.parse(fileId)}`,
        { responseType: "blob" },
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
  async cancel(vaultId: string) {
    await apiClient.post<unknown, unknown>(`/vaults/${id.parse(vaultId)}/handover-request/cancel`);
  },
};
