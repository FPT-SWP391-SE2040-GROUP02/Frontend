import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api";
import { ekycService } from "../ekycService";

afterEach(() => {
  vi.restoreAllMocks();
});

const image = new File(["x"], "front.jpg", { type: "image/jpeg" });

describe("ekycService: đọc ảnh giấy tờ", () => {
  it.each([
    ["mặt trước", () => ekycService.submitDocument(image, "OWNER_ENROLLMENT"), "/ekyc/document"],
    [
      "mặt sau",
      () => ekycService.submitDocumentBack(image, "OWNER_ENROLLMENT"),
      "/ekyc/document-back",
    ],
  ])("%s chờ tối đa 120 giây, không dùng 30 giây mặc định", async (_name, call, url) => {
    const post = vi.spyOn(apiClient, "post").mockRejectedValue(new Error("dừng ở đây"));
    await expect(call()).rejects.toThrow("dừng ở đây");
    expect(post).toHaveBeenCalledWith(
      url,
      expect.any(FormData),
      expect.objectContaining({ timeout: 120000 }),
    );
  });
});
