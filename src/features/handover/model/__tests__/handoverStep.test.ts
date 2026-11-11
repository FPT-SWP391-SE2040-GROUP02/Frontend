import { describe, expect, it } from "vitest";
import { currentHandoverStep } from "../handoverStep";

describe("currentHandoverStep (3 bước của người nhận)", () => {
  it("chưa ký thì ở bước Đồng ý hoặc từ chối", () => {
    expect(currentHandoverStep("INVITED")).toBe(1);
    expect(currentHandoverStep("IDENTITY_IN_PROGRESS")).toBe(1);
  });

  it("đã ký và gửi thì chờ Người xét duyệt", () => {
    expect(currentHandoverStep("IDENTITY_IN_PROGRESS", true)).toBe(2);
  });

  it("được duyệt rồi thì ở bước nhập mã và mở gói", () => {
    expect(currentHandoverStep("READY_TO_ACCEPT")).toBe(3);
    expect(currentHandoverStep("HANDOVER_COMMITTED")).toBe(3);
  });

  it("lượt đã kết thúc không thành công không có bước hiện tại", () => {
    expect(currentHandoverStep("DECLINED")).toBeNull();
    expect(currentHandoverStep("CANCELLED")).toBeNull();
  });
});
