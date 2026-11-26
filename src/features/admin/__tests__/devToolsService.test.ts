import { afterEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { apiClient } from "@/shared/api/axiosClient";
import { devToolsService } from "../api/devToolsService";

const VAULT_ID = "77777777-7777-4777-8777-777777777777";

afterEach(() => vi.restoreAllMocks());

describe("devToolsService", () => {
  it("đọc danh sách tài sản đúng DTO", async () => {
    const vaults = [
      {
        vaultId: VAULT_ID,
        vaultName: "Tài sản của An",
        ownerName: "Nguyễn Văn An",
        planStatus: "ACTIVE",
      },
    ];
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(vaults);
    await expect(devToolsService.listVaults()).resolves.toEqual(vaults);
    expect(get).toHaveBeenCalledWith("/admin/dev-tools/vaults", { signal: undefined });
  });

  it("đặt lại eKYC gửi email đã chuẩn hóa và đọc số lượng đã xóa", async () => {
    const result = {
      userId: VAULT_ID,
      email: "owner@example.test",
      verificationsRemoved: 1,
      consentsRemoved: 3,
      identityRemoved: true,
      faceTemplatesRemoved: 1,
      vaultRemoved: true,
      filesRemoved: 4,
    };
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(result);
    await expect(devToolsService.resetEkyc({ email: "  owner@example.test " })).resolves.toEqual(
      result,
    );
    expect(post).toHaveBeenCalledWith("/admin/dev-tools/users/ekyc-reset", {
      email: "owner@example.test",
    });
  });

  it("đưa tài sản về trước eKYC gọi đúng endpoint và đọc số lượng đã đổi", async () => {
    const result = {
      vaultId: VAULT_ID,
      ownerEmail: "owner@example.test",
      verificationsRemoved: 1,
      consentsRemoved: 1,
      identityRemoved: true,
      faceTemplatesRemoved: 0,
      previousTier: "XS",
      entitlementReset: true,
      pendingOrdersCancelled: 1,
    };
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(result);
    await expect(devToolsService.rewindBeforeEkyc(VAULT_ID)).resolves.toEqual(result);
    expect(post).toHaveBeenCalledWith(`/admin/dev-tools/vaults/${VAULT_ID}/rewind-before-ekyc`);
  });

  it("không gọi API đưa về trước eKYC khi mã tài sản không hợp lệ", async () => {
    const post = vi.spyOn(apiClient, "post");
    await expect(devToolsService.rewindBeforeEkyc("khong-phai-uuid")).rejects.toBeInstanceOf(
      ZodError,
    );
    expect(post).not.toHaveBeenCalled();
  });

  it("không gọi API đặt lại eKYC khi email không hợp lệ", async () => {
    const post = vi.spyOn(apiClient, "post");
    await expect(devToolsService.resetEkyc({ email: "khong-phai-email" })).rejects.toBeInstanceOf(
      ZodError,
    );
    expect(post).not.toHaveBeenCalled();
  });
});
