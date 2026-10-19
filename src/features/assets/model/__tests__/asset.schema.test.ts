import { describe, it, expect } from "vitest";
import {
  cryptoDataSchema,
  credentialDataSchema,
  documentDataSchema,
  createAssetSchema,
} from "../asset.schema";

describe("Asset Management Validation Schemas", () => {
  describe("cryptoDataSchema", () => {
    it("should accept valid ethereum wallet address", () => {
      const valid = {
        network: "ETHEREUM",
        walletAddress: "0x71C865768268571a82fD859345D181d1392b7D3",
      };
      expect(cryptoDataSchema.safeParse(valid).success).toBe(true);
    });

    it("should accept valid 12-word seed phrase", () => {
      const valid = {
        network: "BITCOIN",
        walletAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        seedPhrase: "one two three four five six seven eight nine ten eleven twelve",
      };
      expect(cryptoDataSchema.safeParse(valid).success).toBe(true);
    });

    it("should reject invalid seed phrase length (e.g. 5 words)", () => {
      const invalid = {
        network: "BITCOIN",
        walletAddress: "bc1q...",
        seedPhrase: "one two three four five",
      };
      expect(cryptoDataSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe("credentialDataSchema", () => {
    it("should validate complete credential input", () => {
      const valid = {
        serviceName: "Google Cloud Console",
        serviceUrl: "https://console.cloud.google.com",
        username: "admin@corp.vn",
        password: "SuperSecretPassword123!",
      };
      expect(credentialDataSchema.safeParse(valid).success).toBe(true);
    });

    it("should reject empty username or password", () => {
      const invalid = {
        serviceName: "AWS",
        username: "  ",
        password: "",
      };
      expect(credentialDataSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe("documentDataSchema", () => {
    it("should validate document identifier and category", () => {
      const valid = {
        documentCategory: "REAL_ESTATE_CERTIFICATE",
        identifierNumber: "GCN-QD-2024-889123",
        notes: "Lưu tại két sắt",
      };
      expect(documentDataSchema.safeParse(valid).success).toBe(true);
    });
  });

  describe("createAssetSchema", () => {
    it("should accept valid asset creation payload with beneficiaries", () => {
      const valid = {
        title: "Ví Khởi Nghiệp Web3",
        assetType: "CRYPTO",
        description: "Quỹ dự phòng",
        beneficiaryIds: ["ben_01"],
        shamirThreshold: 2,
        shamirTotalShares: 3,
        specificData: { walletAddress: "0x...", network: "ETHEREUM" },
      };
      expect(createAssetSchema.safeParse(valid).success).toBe(true);
    });

    it("should reject asset creation without beneficiaries", () => {
      const invalid = {
        title: "Ví Khởi Nghiệp",
        assetType: "CRYPTO",
        beneficiaryIds: [],
        specificData: {},
      };
      expect(createAssetSchema.safeParse(invalid).success).toBe(false);
    });
  });
});
