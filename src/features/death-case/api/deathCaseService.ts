import { z } from "zod";
import { apiClient } from "@/shared/api/axiosClient";
import { deathCaseSchema, deathDraftSchema, executorVaultSchema } from "../model/deathCase.schema";
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
  async upload(caseId: string, file: File) {
    const body = new FormData();
    body.append("file", file);
    return deathCaseSchema.parse(
      await apiClient.post<unknown, unknown>(`${path(caseId)}/files`, body, {
        headers: { "Content-Type": undefined },
      }),
    );
  },
  async removeFile(caseId: string, fileId: string) {
    return deathCaseSchema.parse(
      await apiClient.delete<unknown, unknown>(`${path(caseId)}/files/${id.parse(fileId)}`),
    );
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
};
