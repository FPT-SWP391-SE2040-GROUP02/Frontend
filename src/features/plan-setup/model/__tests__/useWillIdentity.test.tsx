import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { registerVaultPinHandler, type VaultPinHandler } from "@/shared/api/vaultPin";
import { planSetupService } from "../../api/planSetupService";
import { useWillIdentity } from "../useWillIdentity";

vi.mock("../../api/planSetupService", () => ({
  planSetupService: { getWillIdentity: vi.fn() },
}));

const VAULT_ID = "11111111-1111-4111-8111-111111111111";
const PIN = "482913";
const IDENTITY = { owner: null, recipients: [] };

function pinRequired(): AxiosError {
  const response = {
    status: 403,
    data: { code: "VAULT_PIN_REQUIRED" },
    headers: {},
    statusText: "Forbidden",
    config: { headers: new AxiosHeaders() },
  } as AxiosResponse;
  return new AxiosError("403", "ERR_BAD_REQUEST", undefined, undefined, response);
}

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function handlerReturning(pin: string | null): VaultPinHandler {
  return {
    requestPin: vi.fn().mockResolvedValue(pin),
    requestNewPin: vi.fn().mockResolvedValue(null),
    notifyLocked: vi.fn(),
    afterAssetCreated: vi.fn(),
  };
}

describe("useWillIdentity", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("hỏi PIN đúng một lần khi Backend đòi, gửi lại kèm PIN và nhớ PIN cho ô ký", async () => {
    const get = vi.mocked(planSetupService.getWillIdentity);
    get.mockRejectedValueOnce(pinRequired()).mockResolvedValueOnce(IDENTITY);
    const handler = handlerReturning(PIN);
    const unregister = registerVaultPinHandler(handler);
    const remember = vi.fn();
    const client = new QueryClient();

    const { result } = renderHook(
      () => useWillIdentity(VAULT_ID, true, { getPin: () => "", remember }),
      { wrapper: wrapper(client) },
    );

    await waitFor(() => expect(result.current.data).toEqual(IDENTITY));
    expect(handler.requestPin).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledTimes(2);
    expect(get.mock.calls[1]?.[2]).toBe(PIN);
    expect(remember).toHaveBeenCalledWith(PIN);
    unregister();
  });

  it("dùng lại PIN đã nhớ khi tải lại, không hỏi nữa", async () => {
    const get = vi.mocked(planSetupService.getWillIdentity);
    get.mockResolvedValueOnce(IDENTITY);
    const handler = handlerReturning(PIN);
    const unregister = registerVaultPinHandler(handler);
    const client = new QueryClient();

    const { result } = renderHook(
      () => useWillIdentity(VAULT_ID, true, { getPin: () => PIN, remember: vi.fn() }),
      { wrapper: wrapper(client) },
    );

    await waitFor(() => expect(result.current.data).toEqual(IDENTITY));
    expect(get).toHaveBeenCalledTimes(1);
    expect(get.mock.calls[0]?.[2]).toBe(PIN);
    expect(handler.requestPin).not.toHaveBeenCalled();
    unregister();
  });

  it("báo lỗi và không nhớ PIN khi người dùng hủy hộp thoại PIN", async () => {
    const get = vi.mocked(planSetupService.getWillIdentity);
    get.mockRejectedValueOnce(pinRequired());
    const unregister = registerVaultPinHandler(handlerReturning(null));
    const remember = vi.fn();
    const client = new QueryClient();

    const { result } = renderHook(
      () => useWillIdentity(VAULT_ID, true, { getPin: () => "", remember }),
      { wrapper: wrapper(client) },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(remember).not.toHaveBeenCalled();
    unregister();
  });
});
