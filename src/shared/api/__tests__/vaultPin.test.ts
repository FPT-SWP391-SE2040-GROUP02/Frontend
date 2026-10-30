import { afterEach, describe, expect, it, vi } from "vitest";
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { apiClient } from "@/shared/api/axiosClient";
import {
  registerVaultPinHandler,
  VAULT_PIN_HEADER,
  type VaultPinHandler,
} from "@/shared/api/vaultPin";

const VAULT = "11111111-1111-4111-8111-111111111111";
const ASSET = "22222222-2222-4222-8222-222222222222";
const originalAdapter = apiClient.defaults.adapter;

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
});

interface Scripted {
  status: number;
  body: unknown;
}

/** Adapter giả: trả lần lượt các phản hồi đã dựng sẵn, ghi lại header PIN của từng request. */
function script(responses: Scripted[]) {
  const sentPins: Array<string | undefined> = [];
  const urls: string[] = [];
  let index = 0;
  apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const next = responses[Math.min(index, responses.length - 1)];
    index += 1;
    const header = config.headers.get(VAULT_PIN_HEADER);
    sentPins.push(typeof header === "string" ? header : undefined);
    urls.push(config.url ?? "");
    const response = {
      data: next.body,
      status: next.status,
      statusText: String(next.status),
      headers: new AxiosHeaders(),
      config,
    };
    if (next.status >= 400) {
      throw new AxiosError("failed", AxiosError.ERR_BAD_REQUEST, config, undefined, response);
    }
    return response;
  };
  return { sentPins, urls };
}

function handler(overrides: Partial<VaultPinHandler> = {}): VaultPinHandler {
  return {
    requestPin: vi.fn().mockResolvedValue(null),
    requestNewPin: vi.fn().mockResolvedValue(null),
    notifyLocked: vi.fn(),
    afterAssetCreated: vi.fn(),
    ...overrides,
  };
}

const required = { status: 403, body: { code: "VAULT_PIN_REQUIRED" } };
const invalid = { status: 403, body: { code: "INVALID_VAULT_PIN", attemptsRemaining: 4 } };
const deleted = { status: 200, body: { ok: true } };
const deleteUrl = `/vaults/${VAULT}/assets/${ASSET}`;

describe("vault pin retry in the api client", () => {
  it("asks for the pin and resends the same request with the header", async () => {
    const requestPin = vi.fn().mockResolvedValue("482913");
    const unregister = registerVaultPinHandler(handler({ requestPin }));
    const calls = script([required, deleted]);

    const result = await apiClient.delete<unknown, unknown>(deleteUrl);
    unregister();

    expect(result).toEqual({ ok: true });
    expect(calls.sentPins).toEqual([undefined, "482913"]);
    expect(requestPin).toHaveBeenCalledWith({
      vaultId: VAULT,
      reason: "required",
      attemptsRemaining: undefined,
    });
  });

  it("asks again after a wrong pin and tells the user how many tries are left", async () => {
    const requestPin = vi.fn().mockResolvedValueOnce("111222").mockResolvedValueOnce("482913");
    const unregister = registerVaultPinHandler(handler({ requestPin }));
    const calls = script([required, invalid, deleted]);

    await apiClient.delete<unknown, unknown>(deleteUrl);
    unregister();

    expect(calls.sentPins).toEqual([undefined, "111222", "482913"]);
    expect(requestPin).toHaveBeenNthCalledWith(2, {
      vaultId: VAULT,
      reason: "invalid",
      attemptsRemaining: 4,
    });
  });

  it("asks for the pin when a blob download gets the error as a json blob", async () => {
    const requestPin = vi.fn().mockResolvedValue("482913");
    const unregister = registerVaultPinHandler(handler({ requestPin }));
    const problem = new Blob([JSON.stringify({ code: "VAULT_PIN_REQUIRED" })], {
      type: "application/problem+json",
    });
    const file = new Blob(["secret"], { type: "text/plain" });
    const calls = script([
      { status: 403, body: problem },
      { status: 200, body: file },
    ]);

    const result = await apiClient.get<Blob, Blob>(`/vaults/${VAULT}/assets/${ASSET}/content`, {
      responseType: "blob",
    });
    unregister();

    expect(result).toBe(file);
    expect(calls.sentPins).toEqual([undefined, "482913"]);
    expect(requestPin).toHaveBeenCalledWith({
      vaultId: VAULT,
      reason: "required",
      attemptsRemaining: undefined,
    });
  });

  it("turns a json blob error into an object so its code can be shown", async () => {
    const unregister = registerVaultPinHandler(handler());
    const problem = new Blob([JSON.stringify({ code: "VAULT_PIN_REQUIRED" })], {
      type: "application/problem+json",
    });
    script([{ status: 403, body: problem }]);

    await expect(
      apiClient.get<Blob, Blob>(`/vaults/${VAULT}/assets/${ASSET}/content`, {
        responseType: "blob",
      }),
    ).rejects.toMatchObject({
      response: { status: 403, data: { code: "VAULT_PIN_REQUIRED" } },
    });
    unregister();
  });

  it("keeps the original error when the user cancels", async () => {
    const unregister = registerVaultPinHandler(handler());
    script([required]);

    await expect(apiClient.delete<unknown, unknown>(deleteUrl)).rejects.toMatchObject({
      response: { status: 403, data: { code: "VAULT_PIN_REQUIRED" } },
    });
    unregister();
  });

  it("does not ask again once the pin is locked, it only informs", async () => {
    const notifyLocked = vi.fn();
    const requestPin = vi.fn();
    const unregister = registerVaultPinHandler(handler({ notifyLocked, requestPin }));
    script([
      { status: 423, body: { code: "VAULT_PIN_LOCKED", lockedUntil: "2026-10-30T09:00:00Z" } },
    ]);

    await expect(apiClient.delete<unknown, unknown>(deleteUrl)).rejects.toMatchObject({
      response: { status: 423 },
    });
    unregister();

    expect(notifyLocked).toHaveBeenCalledWith("2026-10-30T09:00:00Z");
    expect(requestPin).not.toHaveBeenCalled();
  });

  it("offers to set a pin when the vault has none and resends with the new pin", async () => {
    const requestNewPin = vi.fn().mockResolvedValue("482913");
    const unregister = registerVaultPinHandler(handler({ requestNewPin }));
    const calls = script([{ status: 409, body: { code: "VAULT_PIN_NOT_SET" } }, deleted]);

    await apiClient.delete<unknown, unknown>(deleteUrl);
    unregister();

    expect(requestNewPin).toHaveBeenCalledWith(VAULT);
    expect(calls.sentPins).toEqual([undefined, "482913"]);
  });

  it("leaves the pin management endpoints to their own forms", async () => {
    const requestPin = vi.fn().mockResolvedValue("482913");
    const unregister = registerVaultPinHandler(handler({ requestPin }));
    script([invalid]);

    await expect(
      apiClient.post<unknown, unknown>(`/vaults/${VAULT}/pin/change`, {}),
    ).rejects.toMatchObject({ response: { status: 403 } });
    unregister();

    expect(requestPin).not.toHaveBeenCalled();
  });

  it("ignores unrelated errors and requests without a vault", async () => {
    const requestPin = vi.fn().mockResolvedValue("482913");
    const unregister = registerVaultPinHandler(handler({ requestPin }));
    script([{ status: 403, body: { code: "VAULT_PIN_REQUIRED" } }]);

    await expect(apiClient.get<unknown, unknown>("/me/login-methods")).rejects.toBeDefined();
    script([{ status: 409, body: { code: "EDIT_CONFLICT" } }]);
    await expect(apiClient.delete<unknown, unknown>(deleteUrl)).rejects.toBeDefined();
    unregister();

    expect(requestPin).not.toHaveBeenCalled();
  });

  it("surfaces the error as before when no handler is registered", async () => {
    script([required]);

    await expect(apiClient.delete<unknown, unknown>(deleteUrl)).rejects.toMatchObject({
      response: { status: 403 },
    });
  });

  it("tells the handler after an asset is created so it can invite the user to set a pin", async () => {
    const afterAssetCreated = vi.fn();
    const unregister = registerVaultPinHandler(handler({ afterAssetCreated }));
    script([{ status: 201, body: { id: ASSET } }]);

    await apiClient.post<unknown, unknown>(`/vaults/${VAULT}/assets/text`, { name: "a" });
    await apiClient.post<unknown, unknown>(`/vaults/${VAULT}/assets`, {});
    unregister();

    expect(afterAssetCreated).toHaveBeenCalledTimes(2);
    expect(afterAssetCreated).toHaveBeenCalledWith(VAULT);
  });

  it("does not tell the handler for other creations", async () => {
    const afterAssetCreated = vi.fn();
    const unregister = registerVaultPinHandler(handler({ afterAssetCreated }));
    script([{ status: 201, body: {} }]);

    await apiClient.post<unknown, unknown>(`/vaults/${VAULT}/beneficiaries`, {});
    unregister();

    expect(afterAssetCreated).not.toHaveBeenCalled();
  });
});
