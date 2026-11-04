import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import { settingsSaveError } from "../adminError";

function failure(status: number, data: unknown) {
  return new AxiosError("fail", undefined, undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: {} as InternalAxiosRequestConfig,
    data,
  });
}

describe("settingsSaveError", () => {
  it("lấy câu báo lỗi 400 do Backend viết", () => {
    expect(
      settingsSaveError(
        failure(400, {
          title: "Bảng giá không hợp lệ: Giá gói kduy không được thấp hơn gói XS Max.",
        }),
      ),
    ).toBe("Bảng giá không hợp lệ: Giá gói kduy không được thấp hơn gói XS Max.");
  });

  it("lỗi khác 400 hoặc không có tiêu đề thì để UI dùng câu chung", () => {
    expect(settingsSaveError(failure(500, { title: "x" }))).toBeNull();
    expect(settingsSaveError(failure(400, {}))).toBeNull();
    expect(settingsSaveError(new Error("mạng"))).toBeNull();
  });
});
