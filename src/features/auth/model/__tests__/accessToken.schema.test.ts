import { describe, expect, it } from "vitest";
import { accessTokenSchema } from "../accessToken.schema";

/** Dữ liệu giả để kiểm tra cấu trúc, không phải JWT hợp lệ. */
const TOKEN_FIXTURE = {
  accessToken: "test-opaque-token",
  expiresAt: "2026-10-10T05:00:00Z",
};

describe("accessTokenSchema", () => {
  it("accepts the documented credential fields and strips refresh tokens", () => {
    const result = accessTokenSchema.parse({ ...TOKEN_FIXTURE, refreshToken: "must-not-propagate" });
    expect(result).toEqual(TOKEN_FIXTURE);
    expect(result).not.toHaveProperty("refreshToken");
  });

  it.each(["", "   ", null, undefined])("rejects an absent or blank token: %s", (accessToken) => {
    expect(accessTokenSchema.safeParse({ ...TOKEN_FIXTURE, accessToken }).success).toBe(false);
  });

  it.each(["not-a-date", "2026-10-10T05:00:00", "2026-02-30T05:00:00Z", 900])(
    "rejects invalid or timezone-free expiration: %s",
    (expiresAt) => {
      expect(accessTokenSchema.safeParse({ ...TOKEN_FIXTURE, expiresAt }).success).toBe(false);
    },
  );

  it("accepts an expiration with an explicit timezone offset", () => {
    expect(accessTokenSchema.safeParse({ ...TOKEN_FIXTURE, expiresAt: "2026-10-10T12:00:00+07:00" }).success).toBe(true);
  });
});
