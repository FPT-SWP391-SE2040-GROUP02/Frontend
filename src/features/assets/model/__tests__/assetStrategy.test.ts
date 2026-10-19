import { describe, it, expect } from "vitest";
import { getAssetStrategy, assetStrategyMap } from "../strategies/assetStrategyMap";
import { toViewModel, toCreatePayload } from "../../lib/adapters";
import type { AssetItemDto, CreateAssetFormValues } from "../asset.types";

describe("Strategy Pattern & Adapter Pattern Tests", () => {
  describe("Strategy Pattern Registry", () => {
    it("should retrieve valid CryptoStrategy for CRYPTO asset type", () => {
      const strat = getAssetStrategy("CRYPTO");
      expect(strat.type).toBe("CRYPTO");
      expect(strat.label).toContain("Ví Tiền Mã Hóa");
    });

    it("should retrieve valid CredentialStrategy for CREDENTIAL asset type", () => {
      const strat = getAssetStrategy("CREDENTIAL");
      expect(strat.type).toBe("CREDENTIAL");
      expect(strat.label).toContain("Tài Khoản Số");
    });

    it("should retrieve valid DocumentStrategy for DOCUMENT asset type", () => {
      const strat = getAssetStrategy("DOCUMENT");
      expect(strat.type).toBe("DOCUMENT");
      expect(strat.label).toContain("Tài Liệu");
    });

    it("should prepare encrypted payload from strategy", () => {
      const strat = assetStrategyMap.CRYPTO;
      const payload = strat.preparePayload({ walletAddress: "0x123", network: "ETHEREUM" });
      expect(payload).toBeDefined();
      expect(payload.ciphertext).toBeDefined();
      expect(payload.iv).toBeDefined();
    });
  });

  describe("Adapter Pattern", () => {
    it("should convert AssetItemDto to UI AssetViewModel properly", () => {
      const dto: AssetItemDto = {
        id: "ast_01",
        vaultId: "vlt_01",
        title: "Ví Bitcoin Lạnh",
        assetType: "CRYPTO",
        description: "Ví lưu trữ",
        status: "ACTIVE",
        beneficiaryCount: 2,
        shamirThreshold: 2,
        shamirTotalShares: 3,
        encryptedPayload: {
          ciphertext: "cipher...",
          iv: "iv...",
          authTag: "tag...",
          keyDerivationSalt: "salt...",
        },
        createdAt: "2026-08-15T08:30:00Z",
        updatedAt: "2026-08-15T08:30:00Z",
      };

      const viewModel = toViewModel(dto);
      expect(viewModel.id).toBe("ast_01");
      expect(viewModel.statusLabel).toBe("Đang Bảo Vệ");
      expect(viewModel.shamirThresholdText).toBe("2/3 Mảnh Shamir");
      expect(viewModel.createdAtFormatted).toBeDefined();
    });

    it("should convert CreateAssetFormValues to CreateAssetRequest payload", () => {
      const form: CreateAssetFormValues = {
        title: "Tài khoản Gmail",
        assetType: "CREDENTIAL",
        description: "Email công việc",
        beneficiaryIds: ["ben_01"],
        shamirThreshold: 2,
        shamirTotalShares: 3,
        specificData: {
          serviceName: "Google",
          username: "test@gmail.com",
          password: "password123",
        },
      };

      const request = toCreatePayload(form);
      expect(request.title).toBe("Tài khoản Gmail");
      expect(request.assetType).toBe("CREDENTIAL");
      expect(request.encryptedPayload).toBeDefined();
      expect(request.encryptedPayload.ciphertext).toBeDefined();
    });
  });
});
