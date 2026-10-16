import { AxiosError, AxiosHeaders } from "axios";
import { expect, it } from "vitest";
import { getLoginErrorMessage } from "../loginFeedback";
import { getGoogleErrorMessage } from "../googleFeedback";
import { APP_MESSAGES } from "@/shared/constants";

function failure(status: number, code?: string) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("private detail", undefined, config, undefined, {
    status,
    statusText: "",
    headers: {},
    config,
    data: code ? { code, title: "private detail", attemptsRemaining: 2 } : "",
  });
}

it.each([
  [401, "INVALID_CREDENTIALS", "Email hoặc mật khẩu chưa đúng"],
  [403, "ACCOUNT_NOT_ACTIVE", "Tài khoản hiện không thể đăng nhập"],
  [400, "VALIDATION_ERROR", "Thông tin đăng nhập chưa hợp lệ"],
  [423, "ACCOUNT_LOCKED", "Bạn đã thử quá nhiều lần"],
  [429, undefined, "Bạn đã thử quá nhiều lần"],
])("maps auth HTTP %s %s without leaking server details", (status, code, expected) => {
  const message = getLoginErrorMessage(failure(status, code));
  expect(message).toContain(expected);
  expect(message).not.toContain("private");
  expect(message).not.toContain("2");
});

it("does not mistake unknown codes or a 500 response for invalid credentials", () => {
  expect(getLoginErrorMessage(failure(401, "NEW_CODE"))).toBe(APP_MESSAGES.ERROR.DEFAULT);
  expect(getLoginErrorMessage(failure(500, "INVALID_CREDENTIALS"))).toBe(APP_MESSAGES.ERROR.SERVER);
  expect(getGoogleErrorMessage(failure(500, "INVALID_GOOGLE_TOKEN"))).toBe(
    APP_MESSAGES.ERROR.SERVER,
  );
});
