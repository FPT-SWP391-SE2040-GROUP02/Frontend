import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { privateActionError } from "../usePrivateAction";

function failure(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("private transport detail", undefined, config, undefined, {
    status,
    statusText: "",
    headers: {},
    config,
    data,
  });
}

describe("official BE business errors", () => {
  it.each([
    [400, "VALIDATION_ERROR", "Dữ liệu chưa hợp lệ"],
    [403, "PAID_TIER_REQUIRED", "trả phí"],
    [404, "VAULT_NOT_FOUND", "Không tìm thấy kho"],
    [404, "ASSET_NOT_FOUND", "Không tìm thấy tài sản"],
    [404, "CONTAINER_NOT_FOUND", "Không tìm thấy gói"],
    [404, "BENEFICIARY_NOT_FOUND", "Không tìm thấy hồ sơ"],
    [409, "EDIT_CONFLICT", "Dữ liệu đã thay đổi"],
    [409, "DEATH_CASE_INCOMPLETE", "Hồ sơ chưa đủ"],
    [409, "DEATH_CASE_NOT_ALLOWED", "không cho phép"],
    [409, "DEATH_CASE_FILE_LIMIT_EXCEEDED", "giới hạn số trang"],
    [404, "DEATH_CASE_NOT_FOUND", "Không tìm thấy hồ sơ"],
    [404, "HANDOVER_INVITATION_INVALID", "Lời mời không hợp lệ"],
    [404, "HANDOVER_NOT_FOUND", "Không tìm thấy lượt"],
    [409, "HANDOVER_NOT_ALLOWED", "không cho phép"],
    [409, "HANDOVER_ALREADY_CLAIMED", "đã được nhận"],
    [409, "HANDOVER_DECISION_EXPIRED", "Thời hạn quyết định"],
    [403, "GRANT_NOT_ACTIVE", "không còn hiệu lực"],
    [409, "CONTENT_INTEGRITY_FAILED", "tính toàn vẹn"],
    [503, "EKYC_SERVICE_UNAVAILABLE", "Dịch vụ xác minh"],
  ])("maps %s %s without displaying raw title/errors", (status, code, expected) => {
    const message = privateActionError(
      failure(Number(status), {
        status,
        code,
        title: "private title",
        errors: { content: ["private content"] },
      }),
    );
    expect(message).toContain(expected);
    expect(message).not.toContain("private");
  });

  it.each([
    ["EXECUTOR_NOT_ALLOWED", "INVITEE_EMAIL_MISMATCH", "email khác"],
    ["HANDOVER_NOT_ALLOWED", "HOLD_ACTIVE", "tạm giữ"],
    ["HANDOVER_NOT_ALLOWED", "RESEND_TOO_SOON", "15 phút"],
    ["ASSET_IN_USE", "IN_CONTAINER", "gỡ khỏi gói"],
    ["ASSET_IN_USE", "PINNED_IN_HANDOVER", "ghim"],
    ["VAULT_NOT_EDITABLE", "HOLD_ACTIVE", "tạm giữ"],
  ])("prefers the reason-specific message for %s/%s", (code, reason, expected) => {
    const message = privateActionError(failure(409, { code, reason }));
    expect(message.toLowerCase()).toContain(expected.toLowerCase());
  });

  it("falls back to the generic code message for an unknown reason", () => {
    const message = privateActionError(
      failure(409, { code: "HANDOVER_NOT_ALLOWED", reason: "constructor" }),
    );
    expect(message).toContain("không cho phép");
  });

  it.each([
    null,
    "",
    { code: 42 },
    { code: "NEW_BACKEND_CODE" },
    { code: "constructor" },
    { code: "__proto__" },
  ])("handles an empty, malformed or unknown body safely: %j", (body) => {
    const message = privateActionError(failure(409, body));
    expect(typeof message).toBe("string");
    expect(message).toContain("Tải lại");
  });

  it("treats HTTP 500 as a server failure even if its code resembles an empty/validation state", () => {
    expect(privateActionError(failure(500, { code: "VAULT_NOT_FOUND" }))).toContain(
      "Máy chủ đang gặp sự cố",
    );
  });

  it.each([401, 403, 413, 429])("handles framework HTTP %s without JSON", (status) => {
    expect(privateActionError(failure(status, ""))).not.toContain("Không hoàn tất được thao tác");
  });

  it("explains when AI finds no death certificate page", () => {
    const message = privateActionError(
      failure(409, {
        code: "DEATH_CASE_INCOMPLETE",
        missingRequirements: ["DEATH_CERTIFICATE_NOT_RECOGNIZED"],
        fileChecks: [],
      }),
    );
    expect(message).toContain("không nhận ra trang nào là giấy chứng tử");
  });

  it("distinguishes timeout from network errors and advises checking before resubmitting", () => {
    expect(privateActionError(new AxiosError("private", AxiosError.ECONNABORTED))).toContain(
      "phản hồi quá lâu",
    );
    expect(privateActionError(new AxiosError("private", AxiosError.ERR_NETWORK))).toContain(
      "Không kết nối được máy chủ",
    );
    expect(privateActionError(new Error("private"))).not.toContain("private");
  });
});
