import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { APP_MESSAGES, HTTP_STATUS } from "@/shared/constants";
import { getRegisterErrorMessage } from "../registerFeedback";

describe("register feedback", () => {
  it.each([HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.CONFLICT, HTTP_STATUS.UNPROCESSABLE_ENTITY])(
    "does not expose raw response or infer email conflict from status %s without code",
    (status) => {
      const response: AxiosResponse<unknown> = {
        data: { message: "private backend details" },
        status,
        statusText: "Error",
        headers: {},
        config: { headers: new AxiosHeaders() },
      };
      expect(
        getRegisterErrorMessage(
          new AxiosError("failure", undefined, undefined, undefined, response),
        ),
      ).toBe(APP_MESSAGES.ERROR.DEFAULT);
    },
  );

  it("displays friendly message when Backend returns EMAIL_ALREADY_EXISTS code", () => {
    const response: AxiosResponse<unknown> = {
      data: { code: "EMAIL_ALREADY_EXISTS", message: "Email already taken" },
      status: HTTP_STATUS.CONFLICT,
      statusText: "Conflict",
      headers: {},
      config: { headers: new AxiosHeaders() },
    };
    expect(
      getRegisterErrorMessage(new AxiosError("failure", undefined, undefined, undefined, response)),
    ).toBe(
      "Địa chỉ email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng tính năng Quên mật khẩu.",
    );
  });
});
