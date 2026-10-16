import { AxiosError, isAxiosError } from "axios";
import { z } from "zod";
import { APP_MESSAGES, HTTP_STATUS } from "@/shared/constants";
import { VERIFY_EMAIL_CONTENT } from "../model/verifyEmail.schema";

const invalidTokenProblem = z.object({ code: z.literal("INVALID_VERIFICATION_TOKEN") });

/** Phân loại lỗi theo contract; không hiển thị raw response hoặc phân biệt token hết hạn/đã dùng. */
export function getVerifyEmailFeedback(error: unknown): { message: string; invalidToken: boolean } {
  if (!isAxiosError<unknown>(error))
    return { message: VERIFY_EMAIL_CONTENT.unexpected, invalidToken: false };
  if (
    error.response?.status === HTTP_STATUS.BAD_REQUEST &&
    invalidTokenProblem.safeParse(error.response.data).success
  ) {
    return { message: VERIFY_EMAIL_CONTENT.invalidLink, invalidToken: true };
  }
  if (
    !error.response ||
    error.code === AxiosError.ECONNABORTED ||
    error.code === AxiosError.ETIMEDOUT
  ) {
    return { message: VERIFY_EMAIL_CONTENT.uncertain, invalidToken: false };
  }
  if (error.response.status === HTTP_STATUS.TOO_MANY_REQUESTS)
    return { message: VERIFY_EMAIL_CONTENT.rateLimited, invalidToken: false };
  if (error.response.status >= HTTP_STATUS.INTERNAL_SERVER_ERROR)
    return { message: APP_MESSAGES.ERROR.SERVER, invalidToken: false };
  return { message: VERIFY_EMAIL_CONTENT.unexpected, invalidToken: false };
}
