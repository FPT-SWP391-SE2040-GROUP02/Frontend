import { describe, expect, it } from "vitest";
import { formatTimeThenDate } from "../dateFormat";

describe("formatTimeThenDate", () => {
  it("in giờ rồi ngày theo giờ Việt Nam", () => {
    // 17:30 UTC = 00:30 ngày hôm sau ở Việt Nam (UTC+7).
    expect(formatTimeThenDate("2026-10-10T17:30:00Z")).toBe("00:30 11/10/2026");
    expect(formatTimeThenDate("2026-11-08T03:00:00+00:00")).toBe("10:00 08/11/2026");
  });

  it("thiếu hoặc sai thì ghi chưa rõ, không ném lỗi", () => {
    expect(formatTimeThenDate(null)).toBe("chưa rõ");
    expect(formatTimeThenDate(undefined)).toBe("chưa rõ");
    expect(formatTimeThenDate("không phải ngày")).toBe("chưa rõ");
  });
});
