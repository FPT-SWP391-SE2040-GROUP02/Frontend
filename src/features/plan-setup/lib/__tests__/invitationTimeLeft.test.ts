import { describe, expect, it } from "vitest";
import { invitationTimeLeft } from "../invitationTimeLeft";

const NOW = Date.parse("2026-11-11T04:30:00Z");

function at(offsetMs: number): string {
  return new Date(NOW + offsetMs).toISOString();
}

describe("invitationTimeLeft", () => {
  it("còn vài phút thì hiện phút", () => {
    expect(invitationTimeLeft(at(9 * 60_000), NOW)).toBe("9 phút");
  });

  it("còn vài giây vẫn hiện 1 phút, không hiện 0", () => {
    expect(invitationTimeLeft(at(20_000), NOW)).toBe("1 phút");
  });

  it("còn hơn một giờ thì hiện giờ và phút", () => {
    expect(invitationTimeLeft(at(3 * 3_600_000 + 20 * 60_000), NOW)).toBe("3 giờ 20 phút");
    expect(invitationTimeLeft(at(2 * 3_600_000), NOW)).toBe("2 giờ");
  });

  it("còn hơn một ngày thì hiện ngày và giờ", () => {
    expect(invitationTimeLeft(at(2 * 86_400_000 + 4 * 3_600_000), NOW)).toBe("2 ngày 4 giờ");
    expect(invitationTimeLeft(at(7 * 86_400_000), NOW)).toBe("7 ngày");
  });

  it("hết hạn hoặc dữ liệu sai thì trả null", () => {
    expect(invitationTimeLeft(at(0), NOW)).toBeNull();
    expect(invitationTimeLeft(at(-60_000), NOW)).toBeNull();
    expect(invitationTimeLeft("không phải ngày", NOW)).toBeNull();
  });
});
