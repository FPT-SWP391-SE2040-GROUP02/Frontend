import { z } from "zod";
import { apiClient } from "@/shared/api/axiosClient";
import { ownerDeathCaseSchema } from "../model/ownerObjection.schema";

const id = z.string().uuid();
const path = (vaultId: string) => `/vaults/${id.parse(vaultId)}/death-case`;

/** Transport Owner theo `OwnerObjectionController` (api-contract mục 6.14). */
export const ownerObjectionService = {
  /** Hồ sơ chứng tử đang mở của kho; 404 `DEATH_CASE_NOT_FOUND` khi không có. */
  async get(vaultId: string, signal?: AbortSignal) {
    return ownerDeathCaseSchema.parse(
      await apiClient.get<unknown, unknown>(path(vaultId), { signal }),
    );
  },
  /** "Tôi còn sống": chặn ngay hồ sơ, kế hoạch và quyền tải. */
  async report(vaultId: string) {
    return ownerDeathCaseSchema.parse(
      await apiClient.post<unknown, unknown>(`${path(vaultId)}/objection`),
    );
  },
  /** Selfie trực tiếp (multipart, field `file`); so với mẫu khuôn mặt Owner phía server. */
  async submitSelfie(vaultId: string, file: File) {
    const body = new FormData();
    body.append("file", file);
    return ownerDeathCaseSchema.parse(
      await apiClient.post<unknown, unknown>(`${path(vaultId)}/objection/selfie`, body, {
        headers: { "Content-Type": undefined },
      }),
    );
  },
};
