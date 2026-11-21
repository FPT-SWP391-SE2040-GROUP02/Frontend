import { z } from "zod";
import { apiClient } from "@/shared/api";
import {
  handoverRecordSchema,
  handoverRecordSummarySchema,
  recordLineSchema,
  type RecordLine,
} from "../model/handoverRecord.schema";

const id = z.string().uuid();
const verifierPath = (recordId: string) => `/verifier/handover-records/${id.parse(recordId)}`;
const executorPath = (vaultId: string) => `/executor/vaults/${id.parse(vaultId)}/handover-record`;
const recipientPath = (turnId: string) => `/handover/turns/${id.parse(turnId)}/record`;

/** Biên bản bàn giao: luật sư lập và ký, Người thực thi mở bàn giao và ký, người nhận ký. */
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
  async signAsVerifier(recordId: string) {
    return handoverRecordSchema.parse(
      await apiClient.post<unknown, unknown>(`${verifierPath(recordId)}/sign`),
    );
  },

  // Người thực thi
  /** Biên bản của kho; Backend trả 204 khi chưa mở bàn giao thì trả null. */
  async getForExecutor(vaultId: string, signal?: AbortSignal) {
    const data = await apiClient.get<unknown, unknown>(executorPath(vaultId), { signal });
    if (data === undefined || data === null || data === "") return null;
    return handoverRecordSchema.parse(data);
  },
  async open(vaultId: string) {
    return handoverRecordSchema.parse(
      await apiClient.post<unknown, unknown>(executorPath(vaultId)),
    );
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
