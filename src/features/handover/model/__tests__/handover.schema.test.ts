import { describe, it, expect } from "vitest";
import {
  ekycBiometricSchema,
  shamirRecombineSchema,
  refuseInheritanceSchema,
} from "../handover.schema";

/**
 * @file handover.schema.test.ts
 * @description Kiểm thử đơn vị (Unit Tests) cho các Zod Schemas phân hệ Bàn giao Di sản & eKYC Người thụ hưởng.
 * Tuân thủ Rule 6 (Conventional test:) và Quy tắc 4 Nhịp (Nhịp 4 Test pass 100%).
 */

describe("Handover Schemas Validation", () => {
  // =========================================================================
  // 1. KIỂM THỬ EKYC BIOMETRIC LIVENESS SCHEMA
  // =========================================================================
  describe("ekycBiometricSchema", () => {
    it("should pass when faceMatchScore >= 85 and livenessConfidence >= 90", () => {
      const validPayload = {
        sessionId: "session_ekyc_12345",
        faceMatchScore: 92.5,
        livenessConfidence: 95.0,
        biometricPassed: true as const,
      };
      const result = ekycBiometricSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("should fail when faceMatchScore is below 85%", () => {
      const invalidPayload = {
        sessionId: "session_ekyc_12345",
        faceMatchScore: 84.9, // Dưới ngưỡng an ninh
        livenessConfidence: 95.0,
        biometricPassed: true,
      };
      const result = ekycBiometricSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("tối thiểu 85.0%");
      }
    });

    it("should fail when livenessConfidence is below 90%", () => {
      const invalidPayload = {
        sessionId: "session_ekyc_12345",
        faceMatchScore: 90.0,
        livenessConfidence: 88.5, // Dưới ngưỡng chống Deepfake
        biometricPassed: true,
      };
      const result = ekycBiometricSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("tối thiểu 90.0%");
      }
    });

    it("should fail when biometricPassed is not true", () => {
      const invalidPayload = {
        sessionId: "session_ekyc_12345",
        faceMatchScore: 95.0,
        livenessConfidence: 98.0,
        biometricPassed: false,
      };
      const result = ekycBiometricSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  // =========================================================================
  // 2. KIỂM THỬ SHAMIR RECOMBINE SCHEMA
  // =========================================================================
  describe("shamirRecombineSchema", () => {
    it("should pass when both shares follow index-hex pattern", () => {
      const validPayload = {
        share1: "1-4f8a29b3c10e42d7",
        share2: "2-7b1c38e9a25f60d4",
      };
      const result = shamirRecombineSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("should fail when share format is invalid", () => {
      const invalidPayload = {
        share1: "not-a-valid-hex-share",
        share2: "2-7b1c38e9a25f60d4",
      };
      const result = shamirRecombineSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  // =========================================================================
  // 3. KIỂM THỬ REFUSE INHERITANCE SCHEMA (ĐIỀU 620 BLDS)
  // =========================================================================
  describe("refuseInheritanceSchema", () => {
    it("should pass when reason >= 30 chars and confirmLegalWaiver is true", () => {
      const validPayload = {
        claimId: "clm_01",
        reason: "Tôi xin tự nguyện từ chối nhận di sản thừa kế để nhường lại cho người dự phòng.",
        confirmLegalWaiver: true as const,
        notarizedDocScanUrl: "https://storage.legacyvault.vn/waiver.pdf",
      };
      const result = refuseInheritanceSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("should fail when reason is under 30 characters", () => {
      const invalidPayload = {
        claimId: "clm_01",
        reason: "Tôi không muốn nhận.", // Dưới 30 ký tự
        confirmLegalWaiver: true,
      };
      const result = refuseInheritanceSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("30 ký tự");
      }
    });

    it("should fail when confirmLegalWaiver is not checked", () => {
      const invalidPayload = {
        claimId: "clm_01",
        reason: "Tôi xin tự nguyện từ chối nhận di sản thừa kế để nhường lại cho người dự phòng.",
        confirmLegalWaiver: false,
      };
      const result = refuseInheritanceSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });
});
