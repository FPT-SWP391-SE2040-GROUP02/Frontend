import { describe, it, expect } from "vitest";
import { submitClaimSchema } from "../claim.schema";

describe("submitClaimSchema validation", () => {
  const validData = {
    vaultId: "vlt_01",
    documentType: "DEATH_CERTIFICATE" as const,
    deathCertificateNumber: "TLKT-2026/089/UBND",
    deathCertificateIssueDate: "2026-09-02",
    deathCertificateIssuer: "UBND Phường Bến Nghé, Quận 1, TP.HCM",
    deathCertScanUrl: "https://storage.legacyvault.vn/claims/cert_01.pdf",
    deathCertScanHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    executorNotes: "Hồ sơ đã đối soát hợp lệ",
  };

  it("should pass validation with valid executor claim data", () => {
    const result = submitClaimSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should fail when deathCertScanHash is not exactly 64 hex characters", () => {
    const invalidData = {
      ...validData,
      deathCertScanHash: "invalid_short_hash",
    };
    const result = submitClaimSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("64 ký tự");
    }
  });

  it("should fail when deathCertificateIssuer is too short", () => {
    const invalidData = {
      ...validData,
      deathCertificateIssuer: "UB",
    };
    const result = submitClaimSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
