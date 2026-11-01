import { afterEach, describe, expect, it } from "vitest";
import { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { apiClient } from "@/shared/api/axiosClient";
import { VAULT_PIN_HEADER } from "@/shared/api/vaultPin";
import { vaultPinService } from "../vaultPinService";

const VAULT = "11111111-1111-4111-8111-111111111111";
const originalAdapter = apiClient.defaults.adapter;

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
});

/** Adapter giả trả 204, ghi lại request đã gửi. */
function capture() {
  const sent: InternalAxiosRequestConfig[] = [];
  apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    sent.push(config);
    return { data: "", status: 204, statusText: "204", headers: new AxiosHeaders(), config };
  };
  return sent;
}

describe("vaultPinService.verify", () => {
  it("posts to the verify endpoint with the pin in the header", async () => {
    const sent = capture();

    await vaultPinService.verify(VAULT, "482913");

    expect(sent).toHaveLength(1);
    expect(sent[0].method).toBe("post");
    expect(sent[0].url).toBe(`/vaults/${VAULT}/pin/verify`);
    expect(sent[0].headers.get(VAULT_PIN_HEADER)).toBe("482913");
  });

  it("sends no pin header when there is no pin yet", async () => {
    const sent = capture();

    await vaultPinService.verify(VAULT);

    expect(sent[0].headers.has(VAULT_PIN_HEADER)).toBe(false);
  });
});
