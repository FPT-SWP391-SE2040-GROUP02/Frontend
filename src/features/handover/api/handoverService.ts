import { z } from "zod";
import { apiClient } from "@/shared/api/axiosClient";
import {
  invitationSchema,
  handoverTurnSchema,
  handoverItemSchema,
  mailCheckSchema,
} from "../model/handover.schema";
import { readBlobProblem } from "../model/handover.errors";
const id = z.string().uuid();
const token = z.string().min(1).max(512);
const turn = (value: string) => `/handover/turns/${id.parse(value)}`;
/** API người nhận chính thức; token lời mời không persist ngoài URL lời mời được cấp. */
export const handoverService = {
  async invitation(value: string, signal?: AbortSignal) {
    return invitationSchema.parse(
      await apiClient.get<unknown, unknown>(
        `/handover/invitations/${encodeURIComponent(token.parse(value))}`,
        { signal },
      ),
    );
  },
  /** Công khai: kiểm thư mời bằng mã hồ sơ và 4 số cuối căn cước; hết lượt thử thì 423 HANDOVER_MAIL_CHECK_LOCKED. */
  async checkMail(value: string, caseCode: string, citizenIdLast4: string) {
    return mailCheckSchema.parse(
      await apiClient.post<unknown, unknown>(
        `/handover/invitations/${encodeURIComponent(token.parse(value))}/check-mail`,
        {
          caseCode: z.string().trim().min(1).max(16).parse(caseCode),
          citizenIdLast4: z
            .string()
            .regex(/^\d{4}$/)
            .parse(citizenIdLast4),
        },
      ),
    );
  },
  async claim(value: string) {
    return handoverTurnSchema.parse(
      await apiClient.post<unknown, unknown>(
        `/handover/invitations/${encodeURIComponent(token.parse(value))}/claim`,
      ),
    );
  },
  async list(signal?: AbortSignal) {
    return z
      .array(handoverTurnSchema)
      .parse(await apiClient.get<unknown, unknown>("/handover/turns/me", { signal }));
  },
  async get(value: string, signal?: AbortSignal) {
    return handoverTurnSchema.parse(await apiClient.get<unknown, unknown>(turn(value), { signal }));
  },
  async decide(value: string, decision: "accept" | "decline") {
    return handoverTurnSchema.parse(
      await apiClient.post<unknown, unknown>(`${turn(value)}/${decision}`),
    );
  },
  /** Nhập khóa mở gói do Người thực hiện đưa; sai thì 403 HANDOVER_KEY_INVALID, quá giới hạn thì 423. */
  async verifyKey(value: string, key: string) {
    return handoverTurnSchema.parse(
      await apiClient.post<unknown, unknown>(`${turn(value)}/verify-key`, {
        key: z.string().trim().min(1).max(80).parse(key),
      }),
    );
  },
  /** Chốt danh tính lượt bàn giao; BE chuyển READY_TO_ACCEPT nếu đủ điều kiện. */
  async completeIdentity(value: string) {
    return handoverTurnSchema.parse(
      await apiClient.post<unknown, unknown>(`${turn(value)}/identity/complete`),
    );
  },
  async assets(grantId: string, signal?: AbortSignal) {
    return z.array(handoverItemSchema).parse(
      await apiClient.get<unknown, unknown>(`/handover/grants/${id.parse(grantId)}/assets`, {
        signal,
      }),
    );
  },
  /** Không cache blob, không dùng public URL để vượt Bearer hoặc integrity check của BE. */
  async download(grantId: string, itemId: string): Promise<Blob> {
    try {
      return await apiClient.get<Blob, Blob>(
        `/handover/grants/${id.parse(grantId)}/assets/${id.parse(itemId)}/content`,
        { responseType: "blob" },
      );
    } catch (failure) {
      throw await readBlobProblem(failure);
    }
  },
};
