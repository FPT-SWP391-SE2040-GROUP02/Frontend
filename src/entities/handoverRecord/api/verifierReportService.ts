import { z } from "zod";
import { apiClient } from "@/shared/api";
import { readBlobFailure } from "@/shared/lib/saveBlob";
import { verifierReportSchema } from "../model/handoverReport.schema";
import type { TransferOptions } from "@/shared/lib/useTransfer";

const id = z.string().uuid();
const base = "/verifier/handover-reports";

/** Luật sư xét hồ sơ báo tin Chủ kho đã mất. */
export const verifierReportService = {
  async list(signal?: AbortSignal) {
    return z
      .array(verifierReportSchema)
      .parse(await apiClient.get<unknown, unknown>(base, { signal }));
  },
  async review(
    reportId: string,
    decision: "ACCEPT" | "REQUEST_SUPPLEMENT" | "REJECT",
    reason?: string,
    confirmDocuments = false,
  ) {
    return verifierReportSchema.parse(
      await apiClient.post<unknown, unknown>(`${base}/${id.parse(reportId)}/review`, {
        decision,
        reason,
        confirmDocuments,
      }),
    );
  },
  async downloadFile(reportId: string, fileId: string, options?: TransferOptions): Promise<Blob> {
    try {
      return await apiClient.get<Blob, Blob>(
        `${base}/${id.parse(reportId)}/files/${id.parse(fileId)}`,
        { responseType: "blob", ...options },
      );
    } catch (failure) {
      throw await readBlobFailure(failure);
    }
  },
};
