import { useQuery } from "@tanstack/react-query";
import type { z } from "zod";
import { confirmVaultPin } from "@/shared/api/vaultPin";
import { planSetupService } from "../api/planSetupService";
import type { willIdentitySchema } from "./willIdentity.schema";

/** Khóa cache danh tính lập biên bản phân chia; làm mới sau khi ký lại. */
export function willIdentityQueryKey(vaultId: string): readonly ["will-identity", string] {
  return ["will-identity", vaultId];
}

/**
 * Người dùng đóng hộp PIN, hoặc PIN đang bị khóa (hộp PIN đã báo): chưa có danh tính nhưng không phải lỗi mạng hay
 * lỗi hệ thống, nên nơi dùng không báo đỏ.
 */
export class WillPinNotConfirmedError extends Error {
  constructor() {
    super("Chưa xác nhận mã PIN nên chưa xem được danh tính đầy đủ.");
    this.name = "WillPinNotConfirmedError";
  }
}

/** PIN đã xác nhận khi mở khung, chỉ giữ trong RAM của khung để khỏi bắt nhập lại lúc tải lại. */
export interface WillPinMemory {
  getPin: () => string;
  remember: (pin: string) => void;
}

/**
 * Danh tính đầy đủ (CCCD, ngày sinh, thường trú) để in trong biên bản phân chia. Chỉ bật khi khung xem trước đang mở. Không giữ
 * trong cache: staleTime 0 và gcTime 0 để dữ liệu nhạy cảm mất ngay khi khung đóng; không tự gọi lại, không retry.
 * Backend đòi PIN kho: hỏi một lần qua hộp thoại PIN chung, PIN đúng được nhớ để dùng lại, không hỏi lần hai.
 */
export function useWillIdentity(vaultId: string, enabled: boolean, memory: WillPinMemory) {
  return useQuery({
    queryKey: willIdentityQueryKey(vaultId),
    queryFn: async ({ signal }) => {
      const box: { value?: z.infer<typeof willIdentitySchema> } = {};
      const result = await confirmVaultPin(vaultId, async (typed) => {
        box.value = await planSetupService.getWillIdentity(
          vaultId,
          signal,
          typed || memory.getPin() || undefined,
        );
      });
      if (!result.confirmed) {
        throw new WillPinNotConfirmedError();
      }
      if (box.value === undefined) {
        throw new Error("Máy chủ không trả danh tính.");
      }
      if (result.pin) {
        memory.remember(result.pin);
      }
      return box.value;
    },
    enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
