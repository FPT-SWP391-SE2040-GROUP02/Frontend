import { isAxiosError } from "axios";
import { z } from "zod";
import { HTTP_STATUS } from "@/shared/constants";
import { getLoginErrorMessage } from "./loginFeedback";
import { TwoFactorChallengeMissingError } from "../model/twoFactorChallenge";

const problem = z.object({ code: z.string() });

/** Thử thách hết hạn, bị hủy (sai 5 lần) hoặc đã mất do tải lại trang: phải đăng nhập lại. */
export function isTwoFactorChallengeLost(error: unknown): boolean {
  if (error instanceof TwoFactorChallengeMissingError) return true;
  if (!isAxiosError(error) || error.response?.status !== HTTP_STATUS.UNAUTHORIZED) return false;
  const parsed = problem.safeParse(error.response.data);
  return parsed.success && parsed.data.code === "TWO_FACTOR_CHALLENGE_INVALID";
}

/** `INVALID_TWO_FACTOR_CODE` là 401 nhưng không phải hết phiên. */
export function isInvalidTwoFactorCode(error: unknown): boolean {
  if (!isAxiosError(error) || error.response?.status !== HTTP_STATUS.UNAUTHORIZED) return false;
  const parsed = problem.safeParse(error.response.data);
  return parsed.success && parsed.data.code === "INVALID_TWO_FACTOR_CODE";
}

/** Thông báo an toàn cho bước nhập mã; không lộ body BE. */
export function getTwoFactorErrorMessage(error: unknown): string {
  if (isTwoFactorChallengeLost(error))
    return "Phiên xác thực đã hết hạn hoặc bị hủy. Hãy đăng nhập lại để nhận thử thách mới.";
  if (isInvalidTwoFactorCode(error))
    return "Mã chưa đúng hoặc đã dùng. Kiểm tra mã đang hiện trên ứng dụng xác thực rồi thử lại.";
  return getLoginErrorMessage(error);
}
