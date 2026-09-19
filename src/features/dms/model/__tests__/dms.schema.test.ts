import { describe, it, expect } from "vitest";
import { dmsConfigSchema, notificationChannelSchema, pingRequestSchema } from "../dms.schema";

/**
 * @file dms.schema.test.ts
 * @description Bộ kiểm thử Cấu hình Sinh tồn DMS tuân thủ chuẩn ISTQB v4.0:
 * - Kỹ thuật Phân tích giá trị biên (Boundary Value Analysis - BVA)
 * - Kỹ thuật Phân vùng tương đương (Equivalence Partitioning - EP)
 */
describe("[ISTQB v4.0] DMS Validation Schemas", () => {
  describe("[ISTQB-EP] notificationChannelSchema", () => {
    it("should accept valid notification channel types", () => {
      const validChannels = ["EMAIL", "SMS", "TELEGRAM", "VOICE_CALL"] as const;
      validChannels.forEach((type) => {
        const result = notificationChannelSchema.safeParse({
          type,
          enabled: true,
          targetValue: "contact_point_value",
        });
        expect(result.success).toBe(true);
      });
    });

    it("should reject empty or whitespace target value (Invalid Partition)", () => {
      const invalid = {
        type: "EMAIL",
        enabled: true,
        targetValue: "   ",
      };
      const result = notificationChannelSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("[ISTQB-BVA] dmsConfigSchema Boundary Value Analysis", () => {
    const baseValidConfig = {
      checkIntervalDays: 30,
      gracePeriodDays: 14,
      reminderFrequencyDays: 3,
      channels: [{ type: "EMAIL" as const, enabled: true, targetValue: "test@example.com" }],
      notifyExecutorOnGracePeriod: true,
    };

    describe("checkIntervalDays Boundaries (Min: 7, Max: 365)", () => {
      it("should reject under-boundary: 6 days (Min - 1)", () => {
        const result = dmsConfigSchema.safeParse({
          ...baseValidConfig,
          checkIntervalDays: 6,
        });
        expect(result.success).toBe(false);
      });

      it("should accept lower boundary: 7 days (Min)", () => {
        const result = dmsConfigSchema.safeParse({
          ...baseValidConfig,
          checkIntervalDays: 7,
        });
        expect(result.success).toBe(true);
      });

      it("should accept nominal boundary: 8 days (Min + 1)", () => {
        const result = dmsConfigSchema.safeParse({
          ...baseValidConfig,
          checkIntervalDays: 8,
        });
        expect(result.success).toBe(true);
      });

      it("should accept upper nominal boundary: 364 days (Max - 1)", () => {
        const result = dmsConfigSchema.safeParse({
          ...baseValidConfig,
          checkIntervalDays: 364,
        });
        expect(result.success).toBe(true);
      });

      it("should accept upper boundary: 365 days (Max)", () => {
        const result = dmsConfigSchema.safeParse({
          ...baseValidConfig,
          checkIntervalDays: 365,
        });
        expect(result.success).toBe(true);
      });

      it("should reject over-boundary: 366 days (Max + 1)", () => {
        const result = dmsConfigSchema.safeParse({
          ...baseValidConfig,
          checkIntervalDays: 366,
        });
        expect(result.success).toBe(false);
      });
    });

    describe("gracePeriodDays Boundaries (Min: 3, Max: 60)", () => {
      it("should reject under-boundary: 2 days (Min - 1)", () => {
        const result = dmsConfigSchema.safeParse({
          ...baseValidConfig,
          gracePeriodDays: 2,
        });
        expect(result.success).toBe(false);
      });

      it("should accept lower boundary: 3 days (Min)", () => {
        const result = dmsConfigSchema.safeParse({
          ...baseValidConfig,
          gracePeriodDays: 3,
        });
        expect(result.success).toBe(true);
      });

      it("should accept upper boundary: 60 days (Max)", () => {
        const result = dmsConfigSchema.safeParse({
          ...baseValidConfig,
          gracePeriodDays: 60,
        });
        expect(result.success).toBe(true);
      });

      it("should reject over-boundary: 61 days (Max + 1)", () => {
        const result = dmsConfigSchema.safeParse({
          ...baseValidConfig,
          gracePeriodDays: 61,
        });
        expect(result.success).toBe(false);
      });
    });

    describe("reminderFrequencyDays Boundaries (Min: 1, Max: 14)", () => {
      it("should reject under-boundary: 0 days (Min - 1)", () => {
        const result = dmsConfigSchema.safeParse({
          ...baseValidConfig,
          reminderFrequencyDays: 0,
        });
        expect(result.success).toBe(false);
      });

      it("should accept lower boundary: 1 day (Min)", () => {
        const result = dmsConfigSchema.safeParse({
          ...baseValidConfig,
          reminderFrequencyDays: 1,
        });
        expect(result.success).toBe(true);
      });

      it("should accept upper boundary: 14 days (Max)", () => {
        const result = dmsConfigSchema.safeParse({
          ...baseValidConfig,
          reminderFrequencyDays: 14,
        });
        expect(result.success).toBe(true);
      });

      it("should reject over-boundary: 15 days (Max + 1)", () => {
        const result = dmsConfigSchema.safeParse({
          ...baseValidConfig,
          reminderFrequencyDays: 15,
        });
        expect(result.success).toBe(false);
      });
    });

    describe("channels Array Boundaries (Min: 1 channel)", () => {
      it("should reject empty channels array (Boundary: 0 elements)", () => {
        const result = dmsConfigSchema.safeParse({
          ...baseValidConfig,
          channels: [],
        });
        expect(result.success).toBe(false);
      });

      it("should accept exactly 1 channel (Boundary: 1 element)", () => {
        const result = dmsConfigSchema.safeParse({
          ...baseValidConfig,
          channels: [{ type: "EMAIL" as const, enabled: true, targetValue: "admin@corp.vn" }],
        });
        expect(result.success).toBe(true);
      });

      it("should accept multiple channels configured", () => {
        const result = dmsConfigSchema.safeParse({
          ...baseValidConfig,
          channels: [
            { type: "EMAIL" as const, enabled: true, targetValue: "admin@corp.vn" },
            { type: "TELEGRAM" as const, enabled: true, targetValue: "@vault_admin" },
          ],
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe("[ISTQB-EP] pingRequestSchema", () => {
    it("should set default source to WEB when not provided", () => {
      const result = pingRequestSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe("WEB");
      }
    });

    it("should accept valid ping sources", () => {
      const validSources = ["WEB", "EMAIL_LINK", "TELEGRAM", "MOBILE_APP"] as const;
      validSources.forEach((src) => {
        const res = pingRequestSchema.safeParse({ source: src });
        expect(res.success).toBe(true);
      });
    });
  });
});
