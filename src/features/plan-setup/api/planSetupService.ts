import { z } from "zod";
import { apiClient, VAULT_PIN_HEADER } from "@/shared/api";

import {
  executorSchema,
  planSetupSchema,
  executorInfoSchema,
  inviteExecutorSchema,
  invitationTokenSchema as tokenSchema,
} from "../model/planSetup.schema";
import { myInvitationsSchema } from "../model/myInvitations.schema";
import { willIdentitySchema } from "../model/willIdentity.schema";
const vault = (id: string) => `/vaults/${z.string().uuid().parse(id)}`;
/** Confirmed raw BE contract. No invitation token in cache keys, responses or logs. */
export const planSetupService = {
  async get(id: string, signal?: AbortSignal) {
    return planSetupSchema.parse(
      await apiClient.get<unknown, unknown>(`${vault(id)}/plan-setup`, { signal }),
    );
  },
  async checkEmail(id: string, email: string, signal?: AbortSignal) {
    const response = await apiClient.get<unknown, { email: string; exists: boolean }>(
      `${vault(id)}/check-email`,
      { params: { email }, signal },
    );
    return response.exists;
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
  /**
   * Ký biên bản phân chia và kích hoạt kế hoạch. Chủ tài sản ký bằng mã PIN của kho (header X-Vault-Pin). Form có ô PIN riêng nên
   * lỗi PIN trả về form, không mở hộp thoại PIN chung. PIN chỉ đi qua header, không vào body, log hay storage.
   */
  async activate(
    id: string,
    request: { configVersion: number; policyVersion: string; acknowledgePolicy: boolean },
    pin: string,
  ) {
    const body = z
      .object({
        configVersion: z.number().int().positive(),
        policyVersion: z.string().min(1),
        acknowledgePolicy: z.literal(true),
      })
      .parse(request);
    return planSetupSchema.parse(
      await apiClient.post<unknown, unknown>(`${vault(id)}/activate`, body, {
        headers: { [VAULT_PIN_HEADER]: pin },
        skipVaultPinPrompt: true,
      }),
    );
  },
  /**
   * Chủ tài sản ký lại biên bản phân chia khi kế hoạch đang chạy và có thay đổi chưa ký. `configVersion` là bản cấu hình đang xem
   * (cũ hơn thì Backend trả 409 EDIT_CONFLICT). PIN chỉ đi qua header, như `activate`.
   */
  async signWill(id: string, configVersion: number, pin: string) {
    const body = z.object({ configVersion: z.number().int().positive() }).parse({ configVersion });
    return planSetupSchema.parse(
      await apiClient.post<unknown, unknown>(`${vault(id)}/will/sign`, body, {
        headers: { [VAULT_PIN_HEADER]: pin },
        skipVaultPinPrompt: true,
      }),
    );
  },
  /**
   * Danh tính đầy đủ (CCCD, ngày sinh, thường trú) để in trong biên bản phân chia; chỉ Chủ tài sản. Dữ liệu nhạy cảm: không log,
   * không lưu storage, không giữ trong cache (xem useWillIdentity).
   */
  async getWillIdentity(id: string, signal?: AbortSignal, pin?: string) {
    // Backend đòi PIN kho. Không để interceptor tự hỏi: useWillIdentity hỏi một lần rồi dùng lại PIN đó cho ô ký.
    return willIdentitySchema.parse(
      await apiClient.get<unknown, unknown>(`${vault(id)}/will/identity`, {
        signal,
        headers: pin ? { [VAULT_PIN_HEADER]: pin } : undefined,
        skipVaultPinPrompt: true,
      }),
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
  /** Lời mời gửi tới email đã xác minh của tài khoản đang đăng nhập; không có token trong response. */
  async mine(signal?: AbortSignal) {
    return myInvitationsSchema.parse(
      await apiClient.get<unknown, unknown>("/executor-invitations/mine", { signal }),
    );
  },
  /** Trả lời theo id lời mời (không cần link email); cùng luật và mã lỗi như respond bằng token. */
  async respondById(
    invitationId: string,
    accept: boolean,
    acknowledgeScope: boolean,
    scopeVersion: string,
    password?: string,
    willVersionNo?: number | null,
  ) {
    const id = z.string().uuid().parse(invitationId);
    const body: Record<string, unknown> = { accept, acknowledgeScope, scopeVersion };
    if (accept && password !== undefined) {
      body.password = password;
    }
    if (accept && willVersionNo) {
      body.willVersionNo = willVersionNo;
    }
    return executorSchema.parse(
      await apiClient.post<unknown, unknown>(`/executor-invitations/${id}/respond`, body),
    );
  },
};
