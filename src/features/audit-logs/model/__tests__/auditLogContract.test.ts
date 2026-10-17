import { describe, expect, it } from "vitest";
import {
  auditLogPageSchema,
  auditLogQuerySchema,
  auditLogResponseSchema,
} from "../auditLog.schema";
import {
  isCalendarDateString,
  localDateToNextDayStartIso,
  localDateToStartOfDayIso,
} from "../auditLogDate";

const baseEntry = {
  id: "0199e7a4-5c1b-7c3e-9a51-3f0f5d2b8a10",
  at: "2026-10-15T08:30:00+00:00",
  actorRole: "OWNER",
  actorUserId: "0199e7a4-0000-7c3e-9a51-3f0f5d2b8a10",
  action: "CONTAINER_BENEFICIARY_ADDED",
  targetType: "CONTAINER",
  targetId: "0199e7a4-1111-7c3e-9a51-3f0f5d2b8a10",
  targetVersion: 7,
  outcome: "SUCCEEDED",
  reason: "Người nhận 0199e7a4-2222-7c3e-9a51-3f0f5d2b8a10",
} as const;

describe("auditLogResponseSchema", () => {
  it.each([
    ["HOLD_PLACED", "HOLD"],
    ["HOLD_RELEASED", "HOLD"],
    ["INCIDENT_ASSIGNED", "INCIDENT"],
    ["INCIDENT_RESOLVED", "INCIDENT"],
    ["USER_ROLE_CHANGED", "USER"],
    ["USER_STATUS_CHANGED", "USER"],
    ["VERIFIER_REASSIGNED", "DEATH_CASE"],
    ["OBJECTION_REPORTED", "DEATH_CASE"],
    ["OBJECTION_CONCLUDED", "DEATH_CASE"],
  ])("accepts the updated BE wire event %s and its target", (action, targetType) => {
    expect(auditLogResponseSchema.parse({ ...baseEntry, action, targetType })).toMatchObject({
      action,
      targetType,
    });
    expect(auditLogQuerySchema.parse({ pageIndex: 1, pageSize: 20, action }).action).toBe(action);
  });

  it("parses a wire entry with all fields populated", () => {
    expect(() => auditLogResponseSchema.parse(baseEntry)).not.toThrow();
  });

  it("preserves nullable DTO properties (actorUserId, targetId, targetVersion, reason)", () => {
    const parsed = auditLogResponseSchema.parse({
      ...baseEntry,
      actorUserId: null,
      targetId: null,
      targetVersion: null,
      reason: null,
    });
    expect(parsed.actorUserId).toBeNull();
    expect(parsed.targetId).toBeNull();
    expect(parsed.targetVersion).toBeNull();
    expect(parsed.reason).toBeNull();
  });

  it("rejects an unknown action value (PascalCase leak)", () => {
    const result = auditLogResponseSchema.safeParse({ ...baseEntry, action: "ContainerCreated" });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed target version (must be integer)", () => {
    const result = auditLogResponseSchema.safeParse({ ...baseEntry, targetVersion: 1.5 });
    expect(result.success).toBe(false);
  });

  it("rejects a non-offset datetime", () => {
    const result = auditLogResponseSchema.safeParse({ ...baseEntry, at: "2026-10-15T08:30:00" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-uuid id (Backend Id is a non-null Guid)", () => {
    const result = auditLogResponseSchema.safeParse({ ...baseEntry, id: "not-a-uuid" });
    expect(result.success).toBe(false);
  });
});

describe("auditLogPageSchema", () => {
  it("parses raw PaginatedList<AuditLogResponse>", () => {
    const page = {
      items: [baseEntry],
      totalCount: 1,
      pageIndex: 1,
      pageSize: 20,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    };
    const parsed = auditLogPageSchema.parse(page);
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0].action).toBe("CONTAINER_BENEFICIARY_ADDED");
  });

  it("rejects malformed page metadata (pageSize > 100)", () => {
    const page = {
      items: [],
      totalCount: 0,
      pageIndex: 1,
      pageSize: 500,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    };
    expect(() => auditLogPageSchema.parse(page)).toThrow();
  });
});

describe("auditLogQuerySchema", () => {
  it("accepts valid wire query with optional filters", () => {
    const result = auditLogQuerySchema.parse({
      pageIndex: 1,
      pageSize: 20,
      sortBy: "at",
      isAscending: false,
      action: "CONTAINER_CREATED",
      from: "2026-10-01T00:00:00+00:00",
      to: "2026-11-01T00:00:00+00:00",
    });
    expect(result.action).toBe("CONTAINER_CREATED");
    expect(result.isAscending).toBe(false);
  });

  it("rejects an invalid action value", () => {
    const result = auditLogQuerySchema.safeParse({ action: "BOGUS" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid sortBy (only at allowed by contract)", () => {
    const result = auditLogQuerySchema.safeParse({ sortBy: "actor" });
    expect(result.success).toBe(false);
  });

  it("forbids searchTerm (controller does not use it)", () => {
    const result = auditLogQuerySchema.safeParse({ searchTerm: "anything" });
    expect(result.success).toBe(false);
  });
});

describe("auditLogDate helpers", () => {
  it("isCalendarDateString accepts a real calendar day", () => {
    expect(isCalendarDateString("2026-10-15")).toBe(true);
  });

  it("isCalendarDateString rejects impossible dates that the regex lets through", () => {
    expect(isCalendarDateString("2026-02-31")).toBe(false); // 31 Feb
    expect(isCalendarDateString("2025-02-29")).toBe(false); // 2025 không nhuận
    expect(isCalendarDateString("2024-02-30")).toBe(false);
    expect(isCalendarDateString("2026-13-01")).toBe(false); // tháng 13
    expect(isCalendarDateString("2026-04-31")).toBe(false); // tháng 4 chỉ có 30 ngày
    expect(isCalendarDateString("2026-00-15")).toBe(false); // tháng 0
    expect(isCalendarDateString("2026-10-00")).toBe(false); // ngày 0
    expect(isCalendarDateString("2026-10-32")).toBe(false);
  });

  it("isCalendarDateString accepts the leap-day in a leap year and rejects in a non-leap year", () => {
    expect(isCalendarDateString("2024-02-29")).toBe(true);
    expect(isCalendarDateString("2025-02-29")).toBe(false);
    expect(isCalendarDateString("1900-02-29")).toBe(false);
    expect(isCalendarDateString("2000-02-29")).toBe(true);
    expect(isCalendarDateString("0000-01-01")).toBe(false);
    expect(isCalendarDateString("0099-01-01")).toBe(true);
  });

  it("converts a local YYYY-MM-DD to start-of-day ISO with offset", () => {
    expect(localDateToStartOfDayIso("2026-10-15")).toBe(
      new Date("2026-10-15T00:00:00").toISOString(),
    );
  });

  it("produces the next calendar day as the inclusive end boundary", () => {
    // UI nói "đến hết ngày 20/10": 20/10 23:59:59 phải nằm trong [from, to).
    // Vì vậy `to` phải là 21/10 00:00:00 (không phải 20/10 00:00:00).
    const from = localDateToStartOfDayIso("2026-10-15");
    const to = localDateToNextDayStartIso("2026-10-20");
    expect(from).not.toBe(to);
    const fromDate = new Date(from as string);
    const toDate = new Date(to as string);
    // Khoảng cách đúng 6 ngày (15 → 20 hết ngày là 6 ngày exclusive next-day).
    expect(toDate.getTime() - fromDate.getTime()).toBe(6 * 24 * 60 * 60 * 1000);
    // `to` rơi vào 0 giờ ngày 21/10 theo giờ địa phương (chọn YYYY-MM-DD rồi cộng 1 ngày lịch).
    expect(toDate.getFullYear()).toBe(2026);
    expect(toDate.getMonth()).toBe(9); // tháng 10 (0-indexed)
    expect(toDate.getDate()).toBe(21);
    expect(toDate.getHours()).toBe(0);
    expect(new Date("2026-10-20T23:59:59.999").getTime()).toBeLessThan(toDate.getTime());
    expect(new Date("2026-10-21T00:00:00").getTime()).toBe(toDate.getTime());
  });

  it("next-day helper advances calendar day, not 24h arithmetic (month boundary)", () => {
    const to = localDateToNextDayStartIso("2026-10-31");
    const date = new Date(to as string);
    // Local time: tháng 11, ngày 1. Cộng 24h có thể vẫn ở tháng 10 nếu DST; dùng calendar.
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(10); // tháng 11 (0-indexed)
    expect(date.getDate()).toBe(1);
  });

  it("rejects a calendar-invalid value as undefined (no normalization to a real day)", () => {
    expect(localDateToStartOfDayIso("2026-02-31")).toBeUndefined();
    expect(localDateToNextDayStartIso("2026-02-31")).toBeUndefined();
    expect(localDateToStartOfDayIso("2026-13-01")).toBeUndefined();
  });

  it("returns undefined for empty/invalid dates", () => {
    expect(localDateToStartOfDayIso(undefined)).toBeUndefined();
    expect(localDateToStartOfDayIso("")).toBeUndefined();
    expect(localDateToStartOfDayIso("2026/10/15")).toBeUndefined();
    expect(localDateToNextDayStartIso(undefined)).toBeUndefined();
  });
});
