import { z } from "zod";
import { apiClient } from "@/shared/api";
import { readBlobFailure } from "@/shared/lib/saveBlob";
import {
  availableHandoverSchema,
  myClaimSchema,
  ownerRequestSchema,
  requestPreviewSchema,
} from "../model/handoverRequest.schema";

const id = z.string().uuid();
const base = "/handover/requests";

/** Trường định danh kho: token của link riêng, hoặc vaultId khi người nhận đã đăng nhập. */
interface RequestTarget {
  token?: string;
  vaultId?: string;
}

function filesForm(files: File[], note: string, target: RequestTarget = {}): FormData {
  const form = new FormData();
  if (target.token !== undefined) form.append("token", target.token);
  if (target.vaultId !== undefined) form.append("vaultId", target.vaultId);
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
      await apiClient.post<unknown, unknown>(base, filesForm(files, note, { token }), {
        headers: { "Content-Type": undefined },
      }),
    );
  },
  /** Gửi yêu cầu bằng tài khoản đã đăng nhập (email đã xác minh khớp email Chủ kho khai), không cần link riêng. */
  async submitByAccount(vaultId: string, note: string, files: File[]) {
    return myClaimSchema.parse(
      await apiClient.post<unknown, unknown>(
        `${base}/by-account`,
        filesForm(files, note, { vaultId: id.parse(vaultId) }),
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
