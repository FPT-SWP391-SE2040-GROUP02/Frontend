import { describe, expect, it } from "vitest";
import {
  createProxyCheckInFormSchema,
  nowForDateTimeInput,
  proxyCheckInFormSchema,
} from "../proxyCheckIn.schema";

const DAY_MS = 24 * 60 * 60 * 1000;

function values(contactedAt: string) {
  return { contactedWho: "Anh Minh", contactedAt, contactMethod: "PHONE" as const };
}

describe("giờ liên lạc của điểm danh thay theo giờ hệ thống", () => {
  it("giờ máy: lúc ở 10 ngày tới bị coi là tương lai", () => {
    const future = nowForDateTimeInput(new Date(Date.now() + 10 * DAY_MS));

    const result = proxyCheckInFormSchema.safeParse(values(future));

    expect(result.success).toBe(false);
  });

  it("đang giả lập ngày: lúc của ngày giả lập hợp lệ vì so với giờ hệ thống", () => {
    const schema = createProxyCheckInFormSchema(() => Date.now() + 30 * DAY_MS);
    const simulatedNow = nowForDateTimeInput(new Date(Date.now() + 30 * DAY_MS));

    const result = schema.safeParse(values(simulatedNow));

    expect(result.success).toBe(true);
  });

  it("đang giả lập ngày: lúc ở sau giờ hệ thống vẫn bị chặn", () => {
    const schema = createProxyCheckInFormSchema(() => Date.now() + 30 * DAY_MS);
    const later = nowForDateTimeInput(new Date(Date.now() + 40 * DAY_MS));

    const result = schema.safeParse(values(later));

    expect(result.success).toBe(false);
  });
});
