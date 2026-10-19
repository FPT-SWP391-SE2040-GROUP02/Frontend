import { describe, expect, it } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { deathCaseActionError } from "../deathCase.errors";

function failure(status: number, data: unknown) {
  return new AxiosError("Request failed", "ERR_BAD_RESPONSE", undefined, undefined, {
    data,
    status,
    statusText: "",
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  });
}

describe("deathCaseActionError", () => {
  it.each([
    ["PLAN_NOT_RUNNING", "chưa kích hoạt hoặc đã sang giai đoạn khác"],
    ["VERSION_LOCKED", "đã gửi nên không sửa được nữa"],
    ["CASE_CLOSED", "Hồ sơ đã đóng"],
    ["CASE_NOT_REVISABLE", "Chưa tạo được phiên bản bổ sung"],
  ])("maps DEATH_CASE_NOT_ALLOWED reason %s", (reason, text) => {
    const message = deathCaseActionError(failure(409, { code: "DEATH_CASE_NOT_ALLOWED", reason }));
    expect(message).toContain(text);
  });

  it.each([
    ["PLAN_NOT_IN_HANDOVER", "không còn ở giai đoạn bàn giao"],
    ["WRONG_STATE", "đã có người nhận hoặc đã kết thúc"],
    ["HOLD_ACTIVE", "đang bị tạm giữ"],
    ["RESEND_TOO_SOON", "15 phút"],
    ["NO_EMAIL", "chưa có email"],
  ])("maps resend reason %s", (reason, text) => {
    const message = deathCaseActionError(failure(409, { code: "HANDOVER_NOT_ALLOWED", reason }));
    expect(message).toContain(text);
  });

  it("maps the 503 send failure before the generic server error", () => {
    const message = deathCaseActionError(
      failure(503, { code: "HANDOVER_NOT_ALLOWED", reason: "INVITATION_SEND_FAILED" }),
    );
    expect(message).toContain("Gửi thư lời mời chưa thành công");
  });

  it("falls back to an empty string for unknown reasons, other codes and non-Axios errors", () => {
    expect(
      deathCaseActionError(failure(409, { code: "DEATH_CASE_NOT_ALLOWED", reason: "NEW_REASON" })),
    ).toBe("");
    expect(deathCaseActionError(failure(409, { code: "EDIT_CONFLICT" }))).toBe("");
    expect(
      deathCaseActionError(failure(409, { code: "VAULT_NOT_EDITABLE", reason: "CASE_CLOSED" })),
    ).toBe("");
    expect(deathCaseActionError(new Error("boom"))).toBe("");
  });
});
