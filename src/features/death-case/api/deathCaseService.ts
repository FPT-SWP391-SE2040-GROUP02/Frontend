import { z } from "zod";
import { apiClient } from "@/shared/api/axiosClient";
import { executorPackageSchema, executorVaultSchema } from "../model/deathCase.schema";
import { handoverProgressSchema, sendHandoverKeySchema } from "../model/handoverProgress.schema";

const id = z.string().uuid();
/** Đường dẫn theo biên bản bàn giao của kho (thay cho hồ sơ chứng tử cũ). */
const path = (recordId: string) => `/executor/handover-records/${id.parse(recordId)}`;

/** Transport phía Người thực thi: các kho, tài sản, tiến độ bàn giao và gửi mã nhận. */
export const deathCaseService = {
  /** Các kho tôi đang là Người thực thi, kèm tình trạng biên bản bàn giao. */
  async vaults(signal?: AbortSignal) {
    return z
      .array(executorVaultSchema)
      .parse(await apiClient.get<unknown, unknown>("/executor/vaults", { signal }));
  },
  /** Danh sách tài sản (không có nội dung); chỉ xem được sau khi luật sư chốt biên bản. */
  async packages(vaultId: string, signal?: AbortSignal) {
    return z.array(executorPackageSchema).parse(
      await apiClient.get<unknown, unknown>(`/executor/vaults/${id.parse(vaultId)}/assets`, {
        signal,
      }),
    );
  },
  /** Tiến độ bàn giao chỉ đọc theo biên bản; người gọi không phải Người thực thi đang hiệu lực nhận 404. */
  async handoverProgress(recordId: string, signal?: AbortSignal) {
    return handoverProgressSchema.parse(
      await apiClient.get<unknown, unknown>(`${path(recordId)}/handover-progress`, { signal }),
    );
  },
  /** Gửi mã nhận tới email người nhận của lượt; chỉ khi lượt của người nhận đã được mở quyền tải (HANDOVER_COMMITTED), không chờ người nhận khác. BE kiểm khóa và không lưu khóa. */
  async sendKey(recordId: string, turnId: string, key: string) {
    return sendHandoverKeySchema.parse(
      await apiClient.post<unknown, unknown>(
        `${path(recordId)}/handover-turns/${id.parse(turnId)}/send-key`,
        { key },
      ),
    );
  },
};
