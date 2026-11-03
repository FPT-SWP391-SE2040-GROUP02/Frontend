import { describe, expect, it } from "vitest";
import { getDisplayedServiceTier } from "../vaultServicePresentation";

const NOW = Date.parse("2026-11-01T00:00:00Z");
const FUTURE = "2026-12-01T00:00:00+00:00";
const PAST = "2026-10-01T00:00:00+00:00";

describe("getDisplayedServiceTier", () => {
  it("giữ tên gói trả phí khi còn hạn", () => {
    expect(
      getDisplayedServiceTier(
        { serviceTier: "XS_MAX", serviceStatus: "PAID_ACTIVE", serviceExpiresAt: FUTURE },
        NOW,
      ),
    ).toBe("XS_MAX");
  });

  it.each(["GRACE_READ_ONLY", "EXPIRED_REVIEW"])("hiện Free khi kho ở trạng thái %s", (status) => {
    expect(
      getDisplayedServiceTier(
        { serviceTier: "XS_MAX", serviceStatus: status, serviceExpiresAt: PAST },
        NOW,
      ),
    ).toBe("FREE");
  });

  it("hiện Free khi quá hạn mà job chưa kịp chuyển trạng thái", () => {
    expect(
      getDisplayedServiceTier(
        { serviceTier: "XS", serviceStatus: "PAID_ACTIVE", serviceExpiresAt: PAST },
        NOW,
      ),
    ).toBe("FREE");
  });

  it("gói Free vẫn là Free", () => {
    expect(
      getDisplayedServiceTier(
        { serviceTier: "FREE", serviceStatus: "FREE", serviceExpiresAt: null },
        NOW,
      ),
    ).toBe("FREE");
  });
});
