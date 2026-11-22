import { z } from "zod";
import { apiClient } from "@/shared/api";
import { readBlobFailure } from "@/shared/lib/saveBlob";
import {
  handoverRecordSchema,
  handoverRecordSummarySchema,
  newRecipientSchema,
  recordLineSchema,
  type NewRecipient,
  type RecordLine,
} from "../model/handoverRecord.schema";

const id = z.string().uuid();
const verifierPath = (recordId: string) => `/verifier/handover-records/${id.parse(recordId)}`;
const executorPath = (vaultId: string) => `/executor/vaults/${id.parse(vaultId)}/handover-record`;
const recipientPath = (turnId: string) => `/handover/turns/${id.parse(turnId)}/record`;

/** Biên bản bàn giao: luật sư lập và ký, Người thực thi ký, người nhận gửi yêu cầu rồi ký. */
export const handoverRecordService = {
  // Luật sư
  async list(signal?: AbortSignal) {
    return z
      .array(handoverRecordSummarySchema)
      .parse(await apiClient.get<unknown, unknown>("/verifier/handover-records", { signal }));
  },
  async get(recordId: string, signal?: AbortSignal) {
    return handoverRecordSchema.parse(
      await apiClient.get<unknown, unknown>(verifierPath(recordId), { signal }),
    );
  },
  async useOwnerSplit(recordId: string) {
    return handoverRecordSchema.parse(
      await apiClient.post<unknown, unknown>(`${verifierPath(recordId)}/use-owner-split`),
    );
  },
  async setLines(recordId: string, lines: RecordLine[]) {
    const body = { lines: z.array(recordLineSchema).parse(lines) };
    return handoverRecordSchema.parse(
      await apiClient.put<unknown, unknown>(`${verifierPath(recordId)}/lines`, body),
    );
  },
  async finalize(recordId: string) {
    return handoverRecordSchema.parse(
      await apiClient.post<unknown, unknown>(`${verifierPath(recordId)}/finalize`),
    );
  },
  async reopen(recordId: string) {
    return handoverRecordSchema.parse(
      await apiClient.post<unknown, unknown>(`${verifierPath(recordId)}/reopen`),
    );
  },
  /** Xét giấy tờ một yêu cầu nhận: chấp nhận, yêu cầu bổ sung hoặc từ chối (hai cái sau bắt buộc lý do). */
  async reviewClaim(
    recordId: string,
    claimId: string,
    decision: "ACCEPT" | "REQUEST_SUPPLEMENT" | "REJECT",
    reason?: string,
  ) {
    return handoverRecordSchema.parse(
      await apiClient.post<unknown, unknown>(
        `${verifierPath(recordId)}/claims/${id.parse(claimId)}/review`,
        { decision, reason },
      ),
    );
  },
  async addRecipient(recordId: string, recipient: NewRecipient) {
    return handoverRecordSchema.parse(
      await apiClient.post<unknown, unknown>(
        `${verifierPath(recordId)}/recipients`,
        newRecipientSchema.parse(recipient),
      ),
    );
  },
  /** Đính kèm tệp căn cứ (multipart); bỏ Content-Type mặc định để trình duyệt tự đặt boundary. */
  async addEvidence(recordId: string, files: File[]) {
    const form = new FormData();
    for (const file of files) form.append("files", file);
    return handoverRecordSchema.parse(
      await apiClient.post<unknown, unknown>(`${verifierPath(recordId)}/evidence`, form, {
        headers: { "Content-Type": undefined },
      }),
    );
  },
  async removeEvidence(recordId: string, fileId: string) {
    return handoverRecordSchema.parse(
      await apiClient.delete<unknown, unknown>(
        `${verifierPath(recordId)}/evidence/${id.parse(fileId)}`,
      ),
    );
  },
  /** Tải một tệp đính kèm biên bản về dạng Blob; không cache. */
  async downloadFile(recordId: string, fileId: string): Promise<Blob> {
    try {
      return await apiClient.get<Blob, Blob>(
        `${verifierPath(recordId)}/files/${id.parse(fileId)}`,
        {
          responseType: "blob",
        },
      );
    } catch (failure) {
      throw await readBlobFailure(failure);
    }
  },
  async signAsVerifier(recordId: string) {
    return handoverRecordSchema.parse(
      await apiClient.post<unknown, unknown>(`${verifierPath(recordId)}/sign`),
    );
  },

  // Người thực thi
  /** Biên bản của kho; Backend trả 204 khi chưa có yêu cầu nhận tài sản thì trả null. */
  async getForExecutor(vaultId: string, signal?: AbortSignal) {
    const data = await apiClient.get<unknown, unknown>(executorPath(vaultId), { signal });
    if (data === undefined || data === null || data === "") return null;
    return handoverRecordSchema.parse(data);
  },
  async signAsExecutor(vaultId: string) {
    return handoverRecordSchema.parse(
      await apiClient.post<unknown, unknown>(`${executorPath(vaultId)}/sign`),
    );
  },

  // Người nhận
  async getForRecipient(turnId: string, signal?: AbortSignal) {
    return handoverRecordSchema.parse(
      await apiClient.get<unknown, unknown>(recipientPath(turnId), { signal }),
    );
  },
  async signAsRecipient(turnId: string) {
    return handoverRecordSchema.parse(
      await apiClient.post<unknown, unknown>(`${recipientPath(turnId)}/sign`),
    );
  },
};
