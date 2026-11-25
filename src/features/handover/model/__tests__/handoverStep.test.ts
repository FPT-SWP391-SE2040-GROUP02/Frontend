import { describe, expect, it } from "vitest";
import { currentHandoverStep } from "../handoverStep";

describe("currentHandoverStep (theo 6 bước của người nhận)", () => {
  it("chưa nộp căn cước thì ở bước Nộp ảnh căn cước", () => {
    expect(currentHandoverStep("INVITED")).toBe(3);
    expect(currentHandoverStep("IDENTITY_IN_PROGRESS")).toBe(3);
  });

  it("đã nộp căn cước thì chờ luật sư xác nhận danh tính", () => {
    expect(currentHandoverStep("IDENTITY_IN_PROGRESS", true)).toBe(4);
  });

  it("danh tính đã xong thì ở bước Ký biên bản, được giao thì ở bước nhập mã", () => {
    expect(currentHandoverStep("READY_TO_ACCEPT")).toBe(5);
    expect(currentHandoverStep("HANDOVER_COMMITTED")).toBe(6);
  });

  it("bấm Tôi đã nhận đủ thì cả 6 bước xong", () => {
    expect(currentHandoverStep("HANDOVER_COMMITTED", false, true)).toBe(7);
    expect(currentHandoverStep("HANDOVER_COMMITTED", false, false)).toBe(6);
  });

  it("lượt đã kết thúc không thành công không có bước hiện tại", () => {
    expect(currentHandoverStep("DECLINED")).toBeNull();
    expect(currentHandoverStep("CANCELLED")).toBeNull();
  });
});
