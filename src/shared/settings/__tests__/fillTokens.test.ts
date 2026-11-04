import { describe, expect, it } from "vitest";
import { fillTokens } from "../fillTokens";

describe("fillTokens", () => {
  it("thay mốc trong chuỗi, mảng và object lồng nhau", () => {
    const content = {
      title: "{objectionHours} giờ để phản đối",
      points: ["Có {grantDays} ngày để tải", "Không đổi"],
      nested: { text: "Free {freeQuotaMb} MiB" },
    };
    expect(fillTokens(content, { objectionHours: 48, grantDays: 30, freeQuotaMb: 5 })).toEqual({
      title: "48 giờ để phản đối",
      points: ["Có 30 ngày để tải", "Không đổi"],
      nested: { text: "Free 5 MiB" },
    });
  });

  it("giữ nguyên mốc lạ để dễ phát hiện khi quên khai báo", () => {
    expect(fillTokens("{khongCo} x", { a: 1 })).toBe("{khongCo} x");
  });
});
