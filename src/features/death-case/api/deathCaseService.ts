import { z } from "zod";
import { apiClient } from "@/shared/api/axiosClient";
import {
  deathCaseSchema,
  deathDraftSchema,
  executorCheckInSchema,
  executorVaultSchema,
} from "../model/deathCase.schema";
import {
  confirmIdentitySchema,
  handoverProgressSchema,
  resendInvitationSchema,
} from "../model/handoverProgress.schema";
const id = z.string().uuid();
const path = (caseId: string) => `/executor/death-cases/${id.parse(caseId)}`;
const versionRequest = z.object({ etag: z.string().min(1).max(64) });
/** Transport Executor theo controller thực; không dùng claims/di chúc legacy. */
export const deathCaseService = {
  async vaults(signal?: AbortSignal) {
    return z
      .array(executorVaultSchema)
      .parse(await apiClient.get<unknown, unknown>("/executor/vaults", { signal }));
  },
  /** Điểm danh thay chủ kho khi chủ kho quá hạn và kho chưa có hồ sơ chứng tử đang mở. */
  async checkInForOwner(vaultId: string) {
    return executorCheckInSchema.parse(
      await apiClient.post<unknown, unknown>(`/executor/vaults/${id.parse(vaultId)}/check-in`),
    );
  },
  async open(vaultId: string) {
    return deathCaseSchema.parse(
      await apiClient.post<unknown, unknown>(`/executor/vaults/${id.parse(vaultId)}/death-case`),
    );
  },
  async get(caseId: string, signal?: AbortSignal) {
    return deathCaseSchema.parse(await apiClient.get<unknown, unknown>(path(caseId), { signal }));
  },
  async update(caseId: string, values: z.infer<typeof deathDraftSchema>) {
    return deathCaseSchema.parse(
      await apiClient.put<unknown, unknown>(
        `${path(caseId)}/draft`,
        deathDraftSchema.parse(values),
      ),
    );
  },
  /** Multipart tệp kèm tiến độ theo byte đã gửi; không cache nội dung giấy tờ. */
  async upload(caseId: string, file: File, onUploadProgress?: (percent: number) => void) {
    const body = new FormData();
    body.append("file", file);
    return deathCaseSchema.parse(
      await apiClient.post<unknown, unknown>(`${path(caseId)}/files`, body, {
        headers: { "Content-Type": undefined },
        onUploadProgress: (event) => {
          if (onUploadProgress && event.total) {
            onUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        },
      }),
    );
  },
  async removeFile(caseId: string, fileId: string) {
    return deathCaseSchema.parse(
      await apiClient.delete<unknown, unknown>(`${path(caseId)}/files/${id.parse(fileId)}`),
    );
  },
  /** Hủy hồ sơ còn nháp (chưa gửi lần nào): BE xóa hồ sơ và các trang đã tải, trả 204. */
  async cancelDraft(caseId: string) {
    await apiClient.delete<unknown, unknown>(`${path(caseId)}/draft`);
  },
  async submit(caseId: string, etag: string) {
    return deathCaseSchema.parse(
      await apiClient.post<unknown, unknown>(`${path(caseId)}/submit`, {
        ...versionRequest.parse({ etag }),
        confirm: true,
      }),
    );
  },
  async newVersion(caseId: string, etag: string) {
    return deathCaseSchema.parse(
      await apiClient.post<unknown, unknown>(
        `${path(caseId)}/versions`,
        versionRequest.parse({ etag }),
      ),
    );
  },
  /** Tiến độ bàn giao chỉ đọc; người gọi không phải Executor đang hiệu lực nhận 404 DEATH_CASE_NOT_FOUND. */
  async handoverProgress(caseId: string, signal?: AbortSignal) {
    return handoverProgressSchema.parse(
      await apiClient.get<unknown, unknown>(`${path(caseId)}/handover-progress`, { signal }),
    );
  },
  /** Gửi lại lời mời cho lượt chưa ai nhận; link cũ hết dùng, cách nhau tối thiểu 15 phút (BE mục 6.16). */
  async resendInvitation(caseId: string, turnId: string) {
    return resendInvitationSchema.parse(
      await apiClient.post<unknown, unknown>(
        `${path(caseId)}/handover-turns/${id.parse(turnId)}/resend-invitation`,
      ),
    );
  },
  /** Xác nhận đúng người bằng tay khi người nhận không qua được eKYC; lượt sang READY_TO_ACCEPT (BR-122). */
  async confirmIdentity(caseId: string, turnId: string) {
    return confirmIdentitySchema.parse(
      await apiClient.post<unknown, unknown>(
        `${path(caseId)}/handover-turns/${id.parse(turnId)}/confirm-identity`,
      ),
    );
  },
};
