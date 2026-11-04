import { describe, expect, it } from "vitest";
import { endedStatusLabel, remainingTime } from "../myInvitationHelpers";

const NOW = Date.parse("2026-11-04T00:00:00Z");

describe("remainingTime", () => {
  it("counts days, rounding up, while more than a day is left", () => {
    expect(remainingTime("2026-11-08T12:00:00Z", NOW)).toEqual({
      label: "Còn 5 ngày",
      tone: "warning",
      expiringSoon: false,
    });
  });
  it("counts hours and warns when less than a day is left", () => {
    expect(remainingTime("2026-11-04T13:30:00Z", NOW)).toEqual({
      label: "Còn 14 giờ",
      tone: "danger",
      expiringSoon: true,
    });
  });
  it("reports an expired invitation", () => {
    expect(remainingTime("2026-11-03T00:00:00Z", NOW).label).toBe("Đã hết hạn");
  });
});

describe("endedStatusLabel", () => {
  it("names each ended status", () => {
    expect(endedStatusLabel("DECLINED")).toBe("Đã từ chối");
    expect(endedStatusLabel("EXPIRED")).toBe("Đã hết hạn");
    expect(endedStatusLabel("REVOKED")).toBe("Chủ kho đã thu hồi");
  });
});
