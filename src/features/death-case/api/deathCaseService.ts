import { z } from "zod";
import { apiClient } from "@/shared/api/axiosClient";
import {
  executorAssetNameSchema,
  executorRecipientSchema,
  executorVaultSchema,
} from "../model/deathCase.schema";
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
  /** Đồng ý (ký bằng mật khẩu) hoặc không đồng ý phiên bản biên bản phân chia Chủ kho ký lại. */
  async respondWill(vaultId: string, accept: boolean, willVersionNo: number, password: string) {
    const body: Record<string, unknown> = { accept, willVersionNo };
    if (accept) {
      body.password = password;
    }
    await apiClient.post<unknown, unknown>(
      `/executor/vaults/${id.parse(vaultId)}/will/respond`,
      body,
    );
  },
  /** Người nhận kèm tài sản được gán (không có nội dung); chỉ xem được sau khi luật sư chốt biên bản. */
  async recipients(vaultId: string, signal?: AbortSignal) {
    return z.array(executorRecipientSchema).parse(
      await apiClient.get<unknown, unknown>(`/executor/vaults/${id.parse(vaultId)}/assets`, {
        signal,
      }),
    );
  },
  /** Tên và loại mọi tài sản của kho; xem được cả trước khi bàn giao, không có người nhận hay nội dung. */
  async assetNames(vaultId: string, signal?: AbortSignal) {
    return z.array(executorAssetNameSchema).parse(
      await apiClient.get<unknown, unknown>(`/executor/vaults/${id.parse(vaultId)}/asset-names`, {
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
  /** Người thực thi ký bên giao của phiếu giao nhận; chỉ khi người nhận đã xác nhận nhận đủ. */
  async signReceipt(recordId: string, turnId: string) {
    await apiClient.post<unknown, unknown>(
      `${path(recordId)}/handover-turns/${id.parse(turnId)}/sign-receipt`,
    );
  },
};
