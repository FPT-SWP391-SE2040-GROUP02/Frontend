import { AxiosError, AxiosHeaders } from "axios";
import { expect, it } from "vitest";
import { formatDateTime } from "@/shared/lib/dateFormat";
import { readSigningFailure, signingFailureMessage } from "../signingError";

const LOCKED_UNTIL = "2026-10-30T10:15:00+00:00";

function httpError(status: number, data: unknown) {
  return new AxiosError("failed", undefined, undefined, undefined, {
    status,
    statusText: "",
    config: { headers: new AxiosHeaders() },
    headers: {},
    data,
  });
}

it("403 SIGNING_PASSWORD_INVALID có attemptsRemaining là sai mật khẩu, báo số lần còn lại", () => {
  const failure = readSigningFailure(
    httpError(403, { code: "SIGNING_PASSWORD_INVALID", attemptsRemaining: 3 }),
  );
  expect(failure).toEqual({ kind: "invalidPassword", attemptsRemaining: 3 });
  expect(signingFailureMessage(failure!)).toBe(
    "Mật khẩu chưa đúng. Còn 3 lần thử trước khi bị tạm khóa.",
  );
});

it("403 SIGNING_PASSWORD_INVALID không có attemptsRemaining là tài khoản chưa có mật khẩu", () => {
  const failure = readSigningFailure(httpError(403, { code: "SIGNING_PASSWORD_INVALID" }));
  expect(failure).toEqual({ kind: "noPassword" });
  expect(signingFailureMessage(failure!)).toMatch(/Tài khoản chưa có mật khẩu/);
});

it("423 SIGNING_LOCKED đọc lockedUntil và báo giờ mở khóa", () => {
  const failure = readSigningFailure(
    httpError(423, { code: "SIGNING_LOCKED", lockedUntil: LOCKED_UNTIL }),
  );
  expect(failure).toEqual({ kind: "locked", lockedUntil: new Date(LOCKED_UNTIL).getTime() });
  expect(signingFailureMessage(failure!)).toBe(
    `Chức năng ký số đang tạm khóa đến ${formatDateTime(LOCKED_UNTIL)}.`,
  );
});

it("423 SIGNING_LOCKED thiếu hoặc sai lockedUntil vẫn báo khóa, không bịa giờ", () => {
  for (const data of [{ code: "SIGNING_LOCKED" }, { code: "SIGNING_LOCKED", lockedUntil: "x" }]) {
    const failure = readSigningFailure(httpError(423, data));
    expect(failure).toEqual({ kind: "locked", lockedUntil: null });
    expect(signingFailureMessage(failure!)).toBe(
      "Chức năng ký số đang tạm khóa. Vui lòng thử lại sau.",
    );
  }
});

it("lỗi khác (sai mã, sai status, không có response) trả null để giữ báo lỗi chung", () => {
  expect(readSigningFailure(httpError(409, { code: "EDIT_CONFLICT" }))).toBeNull();
  expect(readSigningFailure(httpError(403, { code: "ROLE_NOT_ALLOWED" }))).toBeNull();
  expect(readSigningFailure(httpError(401, { code: "SIGNING_PASSWORD_INVALID" }))).toBeNull();
  expect(readSigningFailure(httpError(403, "not json"))).toBeNull();
  expect(readSigningFailure(new AxiosError("network"))).toBeNull();
  expect(readSigningFailure(new Error("boom"))).toBeNull();
});
