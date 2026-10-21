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
});
