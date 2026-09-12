import { describe, it, expect } from "vitest";
import { dmsConfigSchema, notificationChannelSchema, pingRequestSchema } from "../dms.schema";

describe("DMS Validation Schemas", () => {
  describe("notificationChannelSchema", () => {
    it("should accept valid email notification channel", () => {
      const valid = {
        type: "EMAIL",
        enabled: true,
        targetValue: "user@example.com",
      };
      const result = notificationChannelSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should accept valid telegram notification channel", () => {
      const valid = {
        type: "TELEGRAM",
        enabled: true,
        targetValue: "@telegram_user",
      };
      const result = notificationChannelSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject empty target value", () => {
      const invalid = {
        type: "EMAIL",
        enabled: true,
        targetValue: "   ",
      };
      const result = notificationChannelSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("dmsConfigSchema", () => {
    it("should validate a complete valid dms config", () => {
      const validConfig = {
        checkIntervalDays: 30,
        gracePeriodDays: 14,
        reminderFrequencyDays: 3,
        channels: [
          { type: "EMAIL", enabled: true, targetValue: "test@example.com" },
        ],
        notifyExecutorOnGracePeriod: true,
      };
      const result = dmsConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it("should reject checkIntervalDays less than 7 days", () => {
      const invalidConfig = {
        checkIntervalDays: 3,
        gracePeriodDays: 14,
        reminderFrequencyDays: 3,
        channels: [
          { type: "EMAIL", enabled: true, targetValue: "test@example.com" },
        ],
      };
      const result = dmsConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it("should reject empty channels array", () => {
      const invalidConfig = {
        checkIntervalDays: 30,
        gracePeriodDays: 14,
        reminderFrequencyDays: 3,
        channels: [],
      };
      const result = dmsConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe("pingRequestSchema", () => {
    it("should parse default source WEB", () => {
      const result = pingRequestSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.source).toBe("WEB");
      }
    });

    it("should accept source EMAIL_LINK and TELEGRAM", () => {
      expect(pingRequestSchema.safeParse({ source: "EMAIL_LINK" }).success).toBe(true);
      expect(pingRequestSchema.safeParse({ source: "TELEGRAM" }).success).toBe(true);
    });
  });
});
