import { afterEach, describe, expect, it } from "vitest";
import { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { apiClient } from "@/shared/api/axiosClient";
import { VAULT_PIN_HEADER } from "@/shared/api/vaultPin";
import { backendAssetService } from "../backendAssetService";

const VAULT = "11111111-1111-4111-8111-111111111111";
const ASSET = "22222222-2222-4222-8222-222222222222";
const originalAdapter = apiClient.defaults.adapter;
const updated = {
  id: ASSET,
  vaultId: VAULT,
  kind: "TEXT",
  name: "Tên mới",
  description: null,
  fileName: null,
  contentType: "text/plain",
  sizeBytes: 12,
  createdAt: "2026-10-19T00:00:00+00:00",
  updatedAt: "2026-10-31T00:00:00+00:00",
  etag: "etag-2",
};

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
});

/** Adapter giả trả tài sản đã sửa, ghi lại request đã gửi. */
function capture() {
  const sent: InternalAxiosRequestConfig[] = [];
  apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    sent.push(config);
    return { data: updated, status: 200, statusText: "200", headers: new AxiosHeaders(), config };
  };
  return sent;
}

describe("backendAssetService.update", () => {
  it("sends the confirmed pin so saving does not ask again", async () => {
    const sent = capture();

    await backendAssetService.update(VAULT, ASSET, { etag: "etag-1", name: "Tên mới" }, "482913");

    expect(sent[0].method).toBe("put");
    expect(sent[0].headers.get(VAULT_PIN_HEADER)).toBe("482913");
  });

  it("sends no pin header without a pin", async () => {
    const sent = capture();

    await backendAssetService.update(VAULT, ASSET, { etag: "etag-1", name: "Tên mới" });

    expect(sent[0].headers.has(VAULT_PIN_HEADER)).toBe(false);
  });
});
