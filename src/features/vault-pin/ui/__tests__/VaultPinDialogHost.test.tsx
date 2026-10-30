import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it } from "vitest";
import { apiClient } from "@/shared/api/axiosClient";
import { VAULT_PIN_HEADER } from "@/shared/api/vaultPin";
import { VaultPinDialogHost } from "../VaultPinDialogHost";

const VAULT = "11111111-1111-4111-8111-111111111111";
const ASSET = "22222222-2222-4222-8222-222222222222";
const deleteUrl = `/vaults/${VAULT}/assets/${ASSET}`;
const originalAdapter = apiClient.defaults.adapter;

afterEach(() => {
  cleanup();
  apiClient.defaults.adapter = originalAdapter;
});

/** Adapter giả: không có header PIN thì 403 VAULT_PIN_REQUIRED, sai PIN thì 403 INVALID_VAULT_PIN, đúng thì 200. */
function backendWithPin(correct: string) {
  const sent: Array<string | undefined> = [];
  apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const header = config.headers.get(VAULT_PIN_HEADER);
    const pin = typeof header === "string" ? header : undefined;
    sent.push(pin);
    const respond = (status: number, data: unknown) => ({
      data,
      status,
      statusText: String(status),
      headers: new AxiosHeaders(),
      config,
    });
    if (pin === correct) return respond(200, { ok: true });
    const failure = pin
      ? respond(403, { code: "INVALID_VAULT_PIN", attemptsRemaining: 4 })
      : respond(403, { code: "VAULT_PIN_REQUIRED" });
    throw new AxiosError("failed", AxiosError.ERR_BAD_REQUEST, config, undefined, failure);
  };
  return sent;
}

function renderHost() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <VaultPinDialogHost />
    </QueryClientProvider>,
  );
}

describe("VaultPinDialogHost", () => {
  it("asks for the pin, then completes the blocked request with it", async () => {
    const sent = backendWithPin("482913");
    renderHost();
    const user = userEvent.setup();

    const request = apiClient.delete<unknown, unknown>(deleteUrl);
    await user.type(await screen.findByLabelText("Mã PIN của kho"), "482913");
    await user.click(screen.getByRole("button", { name: "Xác nhận" }));

    await expect(request).resolves.toEqual({ ok: true });
    expect(sent).toEqual([undefined, "482913"]);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("asks again with the remaining tries after a wrong pin", async () => {
    const sent = backendWithPin("482913");
    renderHost();
    const user = userEvent.setup();

    const request = apiClient.delete<unknown, unknown>(deleteUrl);
    await user.type(await screen.findByLabelText("Mã PIN của kho"), "999000");
    await user.click(screen.getByRole("button", { name: "Xác nhận" }));

    expect(await screen.findByText(/Còn 4 trên 5 lần thử/)).toBeInTheDocument();
    await user.type(screen.getByLabelText("Mã PIN của kho"), "482913");
    await user.click(screen.getByRole("button", { name: "Xác nhận" }));

    await expect(request).resolves.toEqual({ ok: true });
    expect(sent).toEqual([undefined, "999000", "482913"]);
  });

  it("rejects with the backend error when the user cancels", async () => {
    backendWithPin("482913");
    renderHost();
    const user = userEvent.setup();

    const request = apiClient.delete<unknown, unknown>(deleteUrl);
    const assertion = expect(request).rejects.toMatchObject({
      response: { status: 403, data: { code: "VAULT_PIN_REQUIRED" } },
    });
    await screen.findByLabelText("Mã PIN của kho");
    await user.click(screen.getByRole("button", { name: "Hủy" }));

    await assertion;
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("does not submit a pin that is not six digits", async () => {
    const sent = backendWithPin("482913");
    renderHost();
    const user = userEvent.setup();

    const request = apiClient.delete<unknown, unknown>(deleteUrl);
    const assertion = expect(request).rejects.toBeDefined();
    await user.type(await screen.findByLabelText("Mã PIN của kho"), "4829");
    await user.click(screen.getByRole("button", { name: "Xác nhận" }));

    expect(await screen.findByText("Mã PIN gồm đúng 6 chữ số.")).toBeInTheDocument();
    expect(sent).toEqual([undefined]);
    await user.click(screen.getByRole("button", { name: "Hủy" }));
    await assertion;
  });

  it("shows the lock time instead of asking when the pin is locked", async () => {
    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError("locked", AxiosError.ERR_BAD_REQUEST, config, undefined, {
        data: { code: "VAULT_PIN_LOCKED", lockedUntil: "2026-10-30T09:00:00Z" },
        status: 423,
        statusText: "Locked",
        headers: new AxiosHeaders(),
        config,
      });
    };
    renderHost();
    const user = userEvent.setup();

    await expect(apiClient.delete<unknown, unknown>(deleteUrl)).rejects.toMatchObject({
      response: { status: 423 },
    });

    expect(await screen.findByText("Mã PIN đang bị khóa tạm")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Đã hiểu" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
