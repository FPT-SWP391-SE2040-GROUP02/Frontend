import { useQuery } from "@tanstack/react-query";
import { ownerVaultService } from "../api/ownerVaultService";
import { isAxiosError } from "axios";
import { z } from "zod";
import { HTTP_STATUS } from "@/shared/constants";

const vaultMissingProblemSchema = z.object({ code: z.literal("VAULT_NOT_FOUND") });
const emailNotVerifiedProblemSchema = z.object({ code: z.literal("EMAIL_NOT_VERIFIED") });

/** 404 VAULT_NOT_FOUND của GET /vaults/me; 404 route sai không được coi là chưa có kho. */
function isVaultNotFound(error: unknown): boolean {
  return (
    isAxiosError<unknown>(error) &&
    error.response?.status === HTTP_STATUS.NOT_FOUND &&
    vaultMissingProblemSchema.safeParse(error.response.data).success
  );
}

/** 403 EMAIL_NOT_VERIFIED: BE chỉ tạo kho cho tài khoản đã xác minh email (AC-01). */
export function isOwnerVaultEmailNotVerified(error: unknown): boolean {
  return (
    isAxiosError<unknown>(error) &&
    error.response?.status === HTTP_STATUS.FORBIDDEN &&
    emailNotVerifiedProblemSchema.safeParse(error.response.data).success
  );
}

/**
 * Chưa có kho để dùng. Kho được tự tạo khi đọc, nên trường hợp này thực tế là
 * email chưa xác minh (hoặc 404 còn sót nếu BE trả về như vậy).
 */
export function isOwnerVaultMissing(error: unknown): boolean {
  return isVaultNotFound(error) || isOwnerVaultEmailNotVerified(error);
}

/** Cache riêng theo kho; auth transitions hủy và xóa dữ liệu khi đổi identity. */
export const ownerVaultKeys = {
  all: ["owner-vault"] as const,
  mine: ["owner-vault", "mine"] as const,
};
/**
 * Đọc kho của tài khoản; chưa có kho thì tự tạo (POST /vaults không gửi tên, BE dùng tên mặc định).
 * Mỗi người chỉ có một kho và POST idempotent, nên gọi trùng từ nhiều màn vẫn ra cùng một kho.
 * Chỉ chạy khi caller xác nhận session sẵn sàng.
 */
async function getOrCreateMyVault(signal: AbortSignal) {
  try {
    return await ownerVaultService.getMine(signal);
  } catch (error) {
    if (!isVaultNotFound(error)) throw error;
    return ownerVaultService.createMine();
  }
}

/** Kho của tài khoản hiện tại, tự tạo lần đầu; lỗi 403 EMAIL_NOT_VERIFIED được giữ nguyên cho UI. */
export function useOwnerVault(enabled: boolean) {
  return useQuery({
    queryKey: ownerVaultKeys.mine,
    queryFn: ({ signal }) => getOrCreateMyVault(signal),
    enabled,
    retry: false,
  });
}
