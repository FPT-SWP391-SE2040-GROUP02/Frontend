import { useQuery } from "@tanstack/react-query";
import type { z } from "zod";
import { confirmVaultPin } from "@/shared/api/vaultPin";
import { planSetupService } from "../api/planSetupService";
import type { willIdentitySchema } from "./willIdentity.schema";

/** Khóa cache danh tính lập di chúc; làm mới sau khi ký lại. */
export function willIdentityQueryKey(vaultId: string): readonly ["will-identity", string] {
  return ["will-identity", vaultId];
}

/** PIN đã xác nhận khi mở khung, chỉ giữ trong RAM của khung để khỏi bắt nhập lại (lúc tải lại và ở ô ký). */
export interface WillPinMemory {
  getPin: () => string;
  remember: (pin: string) => void;
}

/**
 * Danh tính đầy đủ (CCCD, ngày sinh, thường trú) để in trong di chúc. Chỉ bật khi khung xem trước đang mở. Không giữ
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
      if (!result.confirmed || box.value === undefined) {
        throw new Error("Chưa nhập mã PIN nên chưa xem được danh tính đầy đủ.");
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
