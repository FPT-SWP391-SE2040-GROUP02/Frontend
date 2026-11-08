import { afterEach, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api";
import { devToolsService } from "../../api/devToolsService";
import { ekycPauseDone } from "../devTools.content";

afterEach(() => vi.restoreAllMocks());

it("đọc trạng thái tạm ngừng eKYC từ máy chủ", async () => {
  const get = vi.spyOn(apiClient, "get").mockResolvedValue({ paused: true });

  const result = await devToolsService.getEkycPause();

  expect(get).toHaveBeenCalledWith("/admin/dev-tools/ekyc-pause", expect.anything());
  expect(result.paused).toBe(true);
});

it("bật tạm ngừng gửi paused=true lên máy chủ và trả đúng kết quả", async () => {
  const put = vi.spyOn(apiClient, "put").mockResolvedValue({ paused: true });

  const result = await devToolsService.setEkycPause(true);

  expect(put).toHaveBeenCalledWith("/admin/dev-tools/ekyc-pause", { paused: true });
  expect(result.paused).toBe(true);
});

it("phản hồi sai dạng thì bị từ chối thay vì coi như đã tắt", async () => {
  vi.spyOn(apiClient, "get").mockResolvedValue({ paused: "yes" });

  await expect(devToolsService.getEkycPause()).rejects.toThrow();
});

it("thông báo kết quả khác nhau khi bật và khi tắt", () => {
  expect(ekycPauseDone(true)).toContain("tạm ngừng");
  expect(ekycPauseDone(false)).toContain("eKYC thật");
});
