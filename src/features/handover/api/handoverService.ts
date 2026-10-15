import { z } from "zod";
import { apiClient } from "@/shared/api/axiosClient";
import { invitationSchema, handoverTurnSchema, handoverItemSchema } from "../model/handover.schema";
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
  async assets(grantId: string, signal?: AbortSignal) {
    return z.array(handoverItemSchema).parse(
      await apiClient.get<unknown, unknown>(`/handover/grants/${id.parse(grantId)}/assets`, {
        signal,
      }),
    );
  },
  /** Không cache blob, không dùng public URL để vượt Bearer hoặc integrity check của BE. */
  async download(grantId: string, itemId: string): Promise<Blob> {
    return apiClient.get<Blob, Blob>(
      `/handover/grants/${id.parse(grantId)}/assets/${id.parse(itemId)}/content`,
      { responseType: "blob" },
    );
  },
};
