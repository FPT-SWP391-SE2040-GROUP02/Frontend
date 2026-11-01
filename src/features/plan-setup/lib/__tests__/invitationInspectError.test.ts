import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { invitationInspectFailure } from "../invitationInspectError";

const token = "a".repeat(64);

function httpError(status: number, data: unknown): AxiosError {
  return new AxiosError("x", undefined, undefined, undefined, {
    status,
    statusText: "",
    config: { headers: new AxiosHeaders() },
    headers: {},
    data,
  });
}

describe("invitationInspectFailure", () => {
  it("reports a missing/too-short token before blaming the invitation", () => {
    const result = invitationInspectFailure(new z.ZodError([]), "");
    expect(result.title).toBe("Liên kết thiếu mã lời mời");
    expect(result.retryable).toBe(false);
  });

  it("explains a 404 EXECUTOR_INVITATION_INVALID as unusable invitation, not retryable", () => {
    const result = invitationInspectFailure(
      httpError(404, { code: "EXECUTOR_INVITATION_INVALID" }),
      token,
    );
    expect(result.title).toBe("Lời mời không còn dùng được");
    expect(result.message).toContain("gửi lại");
    expect(result.retryable).toBe(false);
  });

  it("flags a 404 without the invitation code as a wrong API/deployment", () => {
    const result = invitationInspectFailure(httpError(404, {}), token);
    expect(result.title).toBe("Không tìm thấy chức năng lời mời");
    expect(result.retryable).toBe(false);
  });

  it("treats network failure, 429 and 5xx as retryable", () => {
    expect(invitationInspectFailure(new AxiosError("net"), token)).toMatchObject({
      title: "Không kết nối được máy chủ",
      retryable: true,
    });
    expect(invitationInspectFailure(httpError(429, {}), token).retryable).toBe(true);
    expect(invitationInspectFailure(httpError(503, {}), token).retryable).toBe(true);
  });

  it("separates a malformed server response from a bad token", () => {
    const result = invitationInspectFailure(new z.ZodError([]), token);
    expect(result.title).toBe("Không đọc được phản hồi của máy chủ");
    expect(result.retryable).toBe(false);
  });

  it("never echoes the token", () => {
    const result = invitationInspectFailure(httpError(404, { code: "X" }), token);
    expect(JSON.stringify(result)).not.toContain(token);
  });
});
