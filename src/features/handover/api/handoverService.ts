import { z } from "zod";
import { apiClient } from "@/shared/api/axiosClient";
import { invitationSchema, handoverTurnSchema, handoverItemSchema } from "../model/handover.schema";
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
  /** Admin có bật "mã tải" không: bật thì mỗi lần tải phải kèm mã gửi qua email. */
  async downloadCodeRequired(): Promise<boolean> {
    const result = z
      .object({ required: z.boolean() })
      .parse(await apiClient.get<unknown, unknown>("/handover/download-code"));
    return result.required;
  },
  /** Gửi mã tải 6 số (dùng một lần, hạn 10 phút) qua email của người đang đăng nhập. */
  async requestDownloadCode(grantId: string): Promise<void> {
    await apiClient.post<unknown, unknown>(`/handover/grants/${id.parse(grantId)}/download-code`);
  },
  /** Không cache blob, không dùng public URL để vượt Bearer hoặc integrity check của BE. */
  async download(grantId: string, itemId: string, code?: string): Promise<Blob> {
    try {
      return await apiClient.get<Blob, Blob>(
        `/handover/grants/${id.parse(grantId)}/assets/${id.parse(itemId)}/content`,
        {
          responseType: "blob",
          ...(code
            ? {
                headers: {
                  "X-Download-Code": z
                    .string()
                    .regex(/^\d{6}$/)
                    .parse(code),
                },
              }
            : {}),
        },
      );
    } catch (failure) {
      throw await readBlobProblem(failure);
    }
  },
};
