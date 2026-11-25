import { z } from "zod";
import { apiClient } from "@/shared/api";
import { readBlobFailure } from "@/shared/lib/saveBlob";
import { myReportSchema, type SuggestedRecipient } from "@/entities/handoverRecord";
import type { TransferOptions } from "@/shared/lib/useTransfer";

const id = z.string().uuid();
const base = "/handover/reports";
// Multipart: bỏ Content-Type mặc định để trình duyệt tự đặt boundary.
const multipart = { headers: { "Content-Type": undefined } };

export interface ReportInput {
  deceasedFullName: string;
  deceasedCitizenId: string;
  attested: boolean;
  note: string;
  recipients: SuggestedRecipient[];
  deathCertificates: File[];
  wills: File[];
  others: File[];
}

/** Người thân nộp hồ sơ báo tin Chủ kho đã mất và theo dõi kết quả. */
export const handoverReportService = {
  async submit(input: ReportInput) {
    const form = new FormData();
    form.append("deceasedFullName", input.deceasedFullName.trim());
    form.append("deceasedCitizenId", input.deceasedCitizenId.trim());
    form.append("attested", String(input.attested));
    form.append("note", input.note.trim());
    form.append("recipients", JSON.stringify(input.recipients));
    for (const file of input.deathCertificates) form.append("deathCertificates", file);
    for (const file of input.wills) form.append("wills", file);
    for (const file of input.others) form.append("others", file);
    return myReportSchema.parse(await apiClient.post<unknown, unknown>(base, form, multipart));
  },
  async mine(signal?: AbortSignal) {
    return z
      .array(myReportSchema)
      .parse(await apiClient.get<unknown, unknown>(`${base}/mine`, { signal }));
  },
  async supplement(reportId: string, note: string, files: File[]) {
    const form = new FormData();
    form.append("note", note.trim());
    for (const file of files) form.append("files", file);
    return myReportSchema.parse(
      await apiClient.post<unknown, unknown>(
        `${base}/${id.parse(reportId)}/supplement`,
        form,
        multipart,
      ),
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
