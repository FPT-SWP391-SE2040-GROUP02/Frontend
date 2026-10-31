import { z } from "zod";
import { apiClient } from "@/shared/api";

import {
  executorSchema,
  planSetupSchema,
  executorInfoSchema,
  inviteExecutorSchema,
  invitationTokenSchema as tokenSchema,
} from "../model/planSetup.schema";
const vault = (id: string) => `/vaults/${z.string().uuid().parse(id)}`;
/** Confirmed raw BE contract. No invitation token in cache keys, responses or logs. */
export const planSetupService = {
  async get(id: string, signal?: AbortSignal) {
    return planSetupSchema.parse(
      await apiClient.get<unknown, unknown>(`${vault(id)}/plan-setup`, { signal }),
    );
  },
  async invite(id: string, request: z.infer<typeof inviteExecutorSchema>) {
    return executorSchema.parse(
      await apiClient.post<unknown, unknown>(
        `${vault(id)}/executors`,
        inviteExecutorSchema.parse(request),
      ),
    );
  },
  async resend(id: string, executorId: string, etag: string) {
    return executorSchema.parse(
      await apiClient.post<unknown, unknown>(
        `${vault(id)}/executors/${z.string().uuid().parse(executorId)}/resend`,
        { etag },
      ),
    );
  },
  /** Thu hồi lời mời hoặc Executor (SETUP-06); gọi lặp trên dòng đã kết thúc trả trạng thái hiện tại. */
  async revoke(id: string, executorId: string, etag: string) {
    return executorSchema.parse(
      await apiClient.post<unknown, unknown>(
        `${vault(id)}/executors/${z.string().uuid().parse(executorId)}/revoke`,
        { etag },
      ),
    );
  },
  async activate(
    id: string,
    request: { configVersion: number; policyVersion: string; acknowledgePolicy: boolean },
  ) {
    const body = z
      .object({
        configVersion: z.number().int().positive(),
        policyVersion: z.string().min(1),
        acknowledgePolicy: z.literal(true),
      })
      .parse(request);
    return planSetupSchema.parse(
      await apiClient.post<unknown, unknown>(`${vault(id)}/activate`, body),
    );
  },
  async inspect(token: string, signal?: AbortSignal) {
    return executorInfoSchema.parse(
      await apiClient.post<unknown, unknown>(
        "/executor-invitations/inspect",
        { token: tokenSchema.parse(token) },
        { signal },
      ),
    );
  },
  async respond(token: string, accept: boolean, acknowledgeScope: boolean, scopeVersion: string) {
    return executorSchema.parse(
      await apiClient.post<unknown, unknown>("/executor-invitations/respond", {
        token: tokenSchema.parse(token),
        accept,
        acknowledgeScope,
        scopeVersion,
      }),
    );
  },
};
