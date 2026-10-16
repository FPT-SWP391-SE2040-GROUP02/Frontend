import { describe, expect, it } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { getVerifyEmailFeedback } from "../verifyEmailFeedback";
import { VERIFY_EMAIL_CONTENT } from "../../model/verifyEmail.schema";
import { APP_MESSAGES } from "@/shared/constants";

function failure(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("internal fixture details", undefined, config, undefined, {
    status,
    statusText: "fixture",
    data,
    config,
    headers: {},
  });
}

describe("verify email feedback", () => {
  it("recognizes only the approved status and token error code", () => {
    expect(
      getVerifyEmailFeedback(
        failure(400, { code: "INVALID_VERIFICATION_TOKEN", detail: "internal fixture details" }),
      ),
    ).toEqual({ message: VERIFY_EMAIL_CONTENT.invalidLink, invalidToken: true });
    expect(getVerifyEmailFeedback(failure(500, { code: "INVALID_VERIFICATION_TOKEN" }))).toEqual({
      message: APP_MESSAGES.ERROR.SERVER,
      invalidToken: false,
    });
  });
  it("does not render arbitrary response details", () => {
    expect(getVerifyEmailFeedback(failure(400, { detail: "internal fixture details" }))).toEqual({
      message: VERIFY_EMAIL_CONTENT.unexpected,
      invalidToken: false,
    });
  });
  it.each([AxiosError.ERR_NETWORK, AxiosError.ECONNABORTED, AxiosError.ETIMEDOUT])(
    "explains uncertain outcomes for %s",
    (code) => {
      expect(getVerifyEmailFeedback(new AxiosError("internal fixture details", code))).toEqual({
        message: VERIFY_EMAIL_CONTENT.uncertain,
        invalidToken: false,
      });
    },
  );
  it("does not invent a cooldown for 429", () => {
    expect(getVerifyEmailFeedback(failure(429, {}))).toEqual({
      message: VERIFY_EMAIL_CONTENT.rateLimited,
      invalidToken: false,
    });
  });
  it("keeps unknown runtime errors private", () => {
    expect(getVerifyEmailFeedback(new Error("internal fixture details"))).toEqual({
      message: VERIFY_EMAIL_CONTENT.unexpected,
      invalidToken: false,
    });
  });
});
