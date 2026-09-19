import { describe, it, expect } from "vitest";
import { submitClaimSchema } from "../claim.schema";

/**
 * @file claim.schema.test.ts
 * @description Bộ kiểm thử Schema Nộp Hồ sơ Thừa kế tuân thủ chuẩn ISTQB v4.0:
 * - Kỹ thuật Phân vùng tương đương (Equivalence Partitioning - EP)
 * - Kỹ thuật Phân tích giá trị biên 2-value & 3-value (Boundary Value Analysis - BVA)
 * - Kỹ thuật Bảng quyết định (Decision Table Testing)
 */
describe("[ISTQB v4.0] submitClaimSchema Validation Testing", () => {
  const baseValidData = {
    vaultId: "vlt_01",
    documentType: "DEATH_CERTIFICATE" as const,
    deathCertificateNumber: "TLKT-2026/089/UBND",
    deathCertificateIssueDate: "2026-09-02",
    deathCertificateIssuer: "UBND Phường Bến Nghé, Quận 1, TP.HCM",
    deathCertScanUrl: "https://storage.legacyvault.vn/claims/cert_01.pdf",
    deathCertScanHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    executorNotes: "Hồ sơ đã đối soát hợp lệ",
  };

  describe("[ISTQB-EP] Document Type Equivalence Partitioning", () => {
    it("should accept valid document types (Valid Partitions)", () => {
      const validTypes = [
        "DEATH_CERTIFICATE",
        "COURT_MISSING_DECREE",
        "COURT_DEATH_DECREE",
      ] as const;

      validTypes.forEach((docType) => {
        const result = submitClaimSchema.safeParse({
          ...baseValidData,
          documentType: docType,
        });
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid document types (Invalid Partition)", () => {
      const result = submitClaimSchema.safeParse({
        ...baseValidData,
        documentType: "INVALID_MEDICAL_RECORD" as unknown as typeof baseValidData.documentType,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBeDefined();
      }
    });
  });

  describe("[ISTQB-BVA] Certificate Number Length Boundaries (Min: 3, Max: 50)", () => {
    it("should reject under-boundary length: 2 characters (Min - 1)", () => {
      const result = submitClaimSchema.safeParse({
        ...baseValidData,
        deathCertificateNumber: "AB",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("ít nhất 3 ký tự");
      }
    });

    it("should accept lower boundary length: 3 characters (Min)", () => {
      const result = submitClaimSchema.safeParse({
        ...baseValidData,
        deathCertificateNumber: "ABC",
      });
      expect(result.success).toBe(true);
    });

    it("should accept nominal boundary length: 4 characters (Min + 1)", () => {
      const result = submitClaimSchema.safeParse({
        ...baseValidData,
        deathCertificateNumber: "ABCD",
      });
      expect(result.success).toBe(true);
    });

    it("should accept upper boundary length: 50 characters (Max)", () => {
      const result = submitClaimSchema.safeParse({
        ...baseValidData,
        deathCertificateNumber: "A".repeat(50),
      });
      expect(result.success).toBe(true);
    });

    it("should reject over-boundary length: 51 characters (Max + 1)", () => {
      const result = submitClaimSchema.safeParse({
        ...baseValidData,
        deathCertificateNumber: "A".repeat(51),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("không được vượt quá 50 ký tự");
      }
    });
  });

  describe("[ISTQB-BVA] Certificate Issuer Length Boundaries (Min: 5, Max: 150)", () => {
    it("should reject under-boundary length: 4 characters (Min - 1)", () => {
      const result = submitClaimSchema.safeParse({
        ...baseValidData,
        deathCertificateIssuer: "UBND",
      });
      expect(result.success).toBe(false);
    });

    it("should accept lower boundary length: 5 characters (Min)", () => {
      const result = submitClaimSchema.safeParse({
        ...baseValidData,
        deathCertificateIssuer: "UBND1",
      });
      expect(result.success).toBe(true);
    });

    it("should accept upper boundary length: 150 characters (Max)", () => {
      const result = submitClaimSchema.safeParse({
        ...baseValidData,
        deathCertificateIssuer: "B".repeat(150),
      });
      expect(result.success).toBe(true);
    });

    it("should reject over-boundary length: 151 characters (Max + 1)", () => {
      const result = submitClaimSchema.safeParse({
        ...baseValidData,
        deathCertificateIssuer: "B".repeat(151),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("[ISTQB-BVA & EP-REGEX] SHA-256 Hash Length & Charset Validation", () => {
    it("should reject length 63 characters (Boundary: Length - 1)", () => {
      const result = submitClaimSchema.safeParse({
        ...baseValidData,
        deathCertScanHash: "a".repeat(63),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("64 ký tự");
      }
    });

    it("should accept exactly 64 valid hex characters (Boundary: Length = 64)", () => {
      const result = submitClaimSchema.safeParse({
        ...baseValidData,
        deathCertScanHash: "a".repeat(64),
      });
      expect(result.success).toBe(true);
    });

    it("should reject length 65 characters (Boundary: Length + 1)", () => {
      const result = submitClaimSchema.safeParse({
        ...baseValidData,
        deathCertScanHash: "a".repeat(65),
      });
      expect(result.success).toBe(false);
    });

    it("[ISTQB-EP-REGEX] should reject 64 characters containing non-hex characters (e.g. 'z', 'g')", () => {
      // Chuỗi đủ 64 ký tự nhưng chứa ký tự phi hex 'z'
      const nonHexHash = "z".repeat(64);
      const result = submitClaimSchema.safeParse({
        ...baseValidData,
        deathCertScanHash: nonHexHash,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("ký tự hex hợp lệ");
      }
    });

    it("[ISTQB-EP-REGEX] should reject 64 characters with whitespace or symbols", () => {
      const hashWithSpecialChar = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b85#";
      const result = submitClaimSchema.safeParse({
        ...baseValidData,
        deathCertScanHash: hashWithSpecialChar,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("[ISTQB-DECISION-TABLE] Claim Submission Rules Matrix", () => {
    // Rule 1: T1 (Valid DocType) + T2 (Valid Hex Hash) + T3 (Valid Issuer) -> Pass
    it("Rule 1: All mandatory conditions valid -> Form Valid (Pass)", () => {
      const result = submitClaimSchema.safeParse(baseValidData);
      expect(result.success).toBe(true);
    });

    // Rule 2: F1 (Invalid DocType) + T2 (Valid Hex Hash) + T3 (Valid Issuer) -> Fail
    it("Rule 2: Invalid Document Type -> Form Invalid (Fail)", () => {
      const result = submitClaimSchema.safeParse({
        ...baseValidData,
        documentType: "NOT_A_DOC" as unknown as typeof baseValidData.documentType,
      });
      expect(result.success).toBe(false);
    });

    // Rule 3: T1 (Valid DocType) + F2 (Non-hex Hash) + T3 (Valid Issuer) -> Fail
    it("Rule 3: Invalid Non-hex Hash -> Form Invalid (Fail)", () => {
      const result = submitClaimSchema.safeParse({
        ...baseValidData,
        deathCertScanHash: "g".repeat(64),
      });
      expect(result.success).toBe(false);
    });

    // Rule 4: T1 (Valid DocType) + T2 (Valid Hex Hash) + F3 (Short Issuer) -> Fail
    it("Rule 4: Invalid Short Issuer -> Form Invalid (Fail)", () => {
      const result = submitClaimSchema.safeParse({
        ...baseValidData,
        deathCertificateIssuer: "UB",
      });
      expect(result.success).toBe(false);
    });
  });
});
