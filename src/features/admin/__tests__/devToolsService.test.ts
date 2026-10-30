import { afterEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { apiClient } from "@/shared/api/axiosClient";
import { devToolsService } from "../api/devToolsService";

const VAULT_ID = "77777777-7777-4777-8777-777777777777";

const clockFixture = {
  vaultId: VAULT_ID,
  planStatus: "ACTIVE",
  checkInState: "ON_TIME",
  clockState: "REAL_TIME",
  milestones: [
    { key: "CHECKIN_OVERDUE", state: "AVAILABLE", note: "" },
    { key: "GRACE_ENDED", state: "AVAILABLE", note: "" },
    {
      key: "OBJECTION_WINDOW_ENDED",
      state: "NOT_APPLICABLE",
      note: "Chưa có hồ sơ chứng tử đang mở.",
    },
    {
      key: "SELFIE_DEADLINE_PASSED",
      state: "NOT_APPLICABLE",
      note: "Chưa có lời báo còn sống đang mở.",
    },
  ],
};

afterEach(() => vi.restoreAllMocks());

describe("devToolsService", () => {
  it("đọc danh sách kho đúng DTO", async () => {
    const vaults = [
      {
        vaultId: VAULT_ID,
        vaultName: "Kho của An",
        ownerName: "Nguyễn Văn An",
        planStatus: "ACTIVE",
      },
    ];
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(vaults);
    await expect(devToolsService.listVaults()).resolves.toEqual(vaults);
    expect(get).toHaveBeenCalledWith("/admin/dev-tools/vaults", { signal: undefined });
  });

  it("đọc đồng hồ của kho và từ chối mốc lạ", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(clockFixture);
    await expect(devToolsService.getClock(VAULT_ID)).resolves.toEqual(clockFixture);
    expect(get).toHaveBeenCalledWith(`/admin/dev-tools/vaults/${VAULT_ID}/clock`, {
      signal: undefined,
    });

    vi.spyOn(apiClient, "get").mockResolvedValue({
      ...clockFixture,
      milestones: [{ key: "TOMORROW", state: "AVAILABLE", note: "" }],
    });
    await expect(devToolsService.getClock(VAULT_ID)).rejects.toBeInstanceOf(ZodError);
  });

  it("gửi mốc cần tua và đọc trạng thái mới", async () => {
    const shifted = { ...clockFixture, clockState: "SHIFTED", checkInState: "OVERDUE" };
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(shifted);
    await expect(
      devToolsService.timeTravel(VAULT_ID, { milestone: "CHECKIN_OVERDUE" }),
    ).resolves.toEqual(shifted);
    expect(post).toHaveBeenCalledWith(`/admin/dev-tools/vaults/${VAULT_ID}/time-travel`, {
      milestone: "CHECKIN_OVERDUE",
    });
  });

  it("về thời gian hiện tại gọi đúng endpoint", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(clockFixture);
    await expect(devToolsService.resetClock(VAULT_ID)).resolves.toEqual(clockFixture);
    expect(post).toHaveBeenCalledWith(`/admin/dev-tools/vaults/${VAULT_ID}/reset-clock`);
  });

  it("không gọi API khi mã kho không hợp lệ", async () => {
    const get = vi.spyOn(apiClient, "get");
    await expect(devToolsService.getClock("khong-phai-uuid")).rejects.toBeInstanceOf(ZodError);
    expect(get).not.toHaveBeenCalled();
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

  it("đưa kho về trước eKYC gọi đúng endpoint và đọc số lượng đã đổi", async () => {
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

  it("không gọi API đưa về trước eKYC khi mã kho không hợp lệ", async () => {
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
