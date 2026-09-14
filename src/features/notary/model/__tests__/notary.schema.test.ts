import { describe, it, expect } from "vitest";
import { notaryApproveSchema, notaryRejectSchema, NOTARY_REJECTION_REASONS } from "../notary.schema";

describe("notary.schema validation", () => {
  describe("notaryApproveSchema", () => {
    const validApprove = {
      claimId: "clm_01",
      notaryPinCode: "123456",
      checkCriteria: {
        isDocumentValid: true,
        isIdentityMatched: true,
        isManifestIntegrityVerified: true,
        isExecutorAuthorized: true,
      },
      notaryNotes: "Đã thẩm định hợp lệ",
    };

    it("should pass when PIN has 6 digits and all 4 criteria are true", () => {
      const result = notaryApproveSchema.safeParse(validApprove);
      expect(result.success).toBe(true);
    });

    it("should fail when any of the 4 criteria is false", () => {
      const invalid = {
        ...validApprove,
        checkCriteria: {
          ...validApprove.checkCriteria,
          isManifestIntegrityVerified: false,
        },
      };
      const result = notaryApproveSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should fail when PIN code is not 6 digits", () => {
      const invalid = {
        ...validApprove,
        notaryPinCode: "1234",
      };
      const result = notaryApproveSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("notaryRejectSchema", () => {
    it("should pass when rejection notes have at least 20 characters", () => {
      const validReject = {
        claimId: "clm_01",
        rejectionReasonCode: NOTARY_REJECTION_REASONS.UNCLEAR_DOCUMENT,
        notaryNotes: "Bản scan giấy tờ bị mờ con dấu đỏ. Vui lòng quét lại rõ nét.",
      };
      const result = notaryRejectSchema.safeParse(validReject);
      expect(result.success).toBe(true);
    });

    it("should fail when rejection notes have fewer than 20 characters", () => {
      const invalidReject = {
        claimId: "clm_01",
        rejectionReasonCode: NOTARY_REJECTION_REASONS.UNCLEAR_DOCUMENT,
        notaryNotes: "Giấy tờ bị mờ",
      };
      const result = notaryRejectSchema.safeParse(invalidReject);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("tối thiểu 20 ký tự");
      }
    });
  });
});
