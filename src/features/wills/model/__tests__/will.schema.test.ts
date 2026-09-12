import { describe, it, expect } from "vitest";
import {
  beneficiaryAllocationSchema,
  allocationsArraySchema,
  affidavitProofSchema,
  createWillSchema,
} from "../will.schema";

describe("Will Zod Schemas Validation", () => {
  describe("beneficiaryAllocationSchema", () => {
    it("should accept valid beneficiary allocation", () => {
      const valid = {
        beneficiaryId: "ben_01",
        beneficiaryName: "Nguyễn Minh Khang",
        relationship: "Con trai",
        citizenId: "079095001234",
        percentage: 50,
      };
      const result = beneficiaryAllocationSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid percentage (>100 or <=0)", () => {
      const invalid = {
        beneficiaryId: "ben_01",
        beneficiaryName: "Nguyễn Minh Khang",
        relationship: "Con trai",
        citizenId: "079095001234",
        percentage: 120,
      };
      const result = beneficiaryAllocationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("allocationsArraySchema (Sum = 100%)", () => {
    it("should pass when total percentage is exactly 100%", () => {
      const allocations = [
        {
          beneficiaryId: "ben_01",
          beneficiaryName: "Khang",
          relationship: "Con",
          citizenId: "079095001234",
          percentage: 60,
        },
        {
          beneficiaryId: "ben_02",
          beneficiaryName: "My",
          relationship: "Con",
          citizenId: "079095005678",
          percentage: 40,
        },
      ];
      const result = allocationsArraySchema.safeParse(allocations);
      expect(result.success).toBe(true);
    });

    it("should fail when total percentage is not 100%", () => {
      const allocations = [
        {
          beneficiaryId: "ben_01",
          beneficiaryName: "Khang",
          relationship: "Con",
          citizenId: "079095001234",
          percentage: 50,
        },
        {
          beneficiaryId: "ben_02",
          beneficiaryName: "My",
          relationship: "Con",
          citizenId: "079095005678",
          percentage: 30, // Sum = 80%
        },
      ];
      const result = allocationsArraySchema.safeParse(allocations);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("100%");
      }
    });
  });

  describe("affidavitProofSchema (Điều 630 BLDS 2015)", () => {
    it("should pass when video is >= 15s and user confirmed", () => {
      const affidavit = {
        videoDurationSeconds: 15,
        sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        recordedAt: "2026-09-12T10:00:00Z",
        isConfirmed: true,
      };
      const result = affidavitProofSchema.safeParse(affidavit);
      expect(result.success).toBe(true);
    });

    it("should fail when video duration is under 15s", () => {
      const affidavit = {
        videoDurationSeconds: 10,
        sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        recordedAt: "2026-09-12T10:00:00Z",
        isConfirmed: true,
      };
      const result = affidavitProofSchema.safeParse(affidavit);
      expect(result.success).toBe(false);
    });

    it("should fail when user has not checked isConfirmed", () => {
      const affidavit = {
        videoDurationSeconds: 20,
        sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        recordedAt: "2026-09-12T10:00:00Z",
        isConfirmed: false,
      };
      const result = affidavitProofSchema.safeParse(affidavit);
      expect(result.success).toBe(false);
    });
  });

  describe("createWillSchema full validation", () => {
    it("should validate full 4-step will payload successfully", () => {
      const fullWill = {
        title: "Di chúc số gia tộc họ Nguyễn",
        declarationNotes: "Nguyện vọng chia đều và hòa thuận",
        selectedAssetIds: ["ast_01", "ast_02"],
        allocations: [
          {
            beneficiaryId: "ben_01",
            beneficiaryName: "Nguyễn Minh Khang",
            relationship: "Con",
            citizenId: "079095001234",
            percentage: 100,
          },
        ],
        legalComplianceConfirmed: true,
        affidavitProof: {
          videoDurationSeconds: 18,
          sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          recordedAt: "2026-09-12T10:00:00Z",
          isConfirmed: true,
        },
        confirmDigitalSignature: true,
      };
      const result = createWillSchema.safeParse(fullWill);
      expect(result.success).toBe(true);
    });
  });
});
