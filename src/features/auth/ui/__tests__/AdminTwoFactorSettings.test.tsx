import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { twoFactorService } from "../../api/twoFactorService";
import { AdminTwoFactorSettings } from "../AdminTwoFactorSettings";

let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("admin-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

const off = { enabled: false, setupPending: false, recoveryCodesRemaining: 0 };
const on = { enabled: true, setupPending: false, recoveryCodesRemaining: 8 };

function problem(status: number, code: string) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("x", undefined, config, undefined, {
    status,
    statusText: "",
    headers: {},
    config,
    data: { code },
  });
}

function renderSettings() {
  return render(
    <QueryClientProvider client={client}>
      <AdminTwoFactorSettings />
    </QueryClientProvider>,
  );
}

describe("AdminTwoFactorSettings", () => {
  it("walks through setup, confirmation and the one-time recovery codes", async () => {
    const user = userEvent.setup();
    vi.spyOn(twoFactorService, "status").mockResolvedValue(off);
    const setup = vi.spyOn(twoFactorService, "setup").mockResolvedValue({
      secret: "JBSWY3DPEHPK3PXP",
      otpAuthUri: "otpauth://totp/x?secret=JBSW",
    });
    const enable = vi
      .spyOn(twoFactorService, "enable")
      .mockResolvedValue({ recoveryCodes: ["AAAAAA-111111", "BBBBBB-222222"] });
    renderSettings();
    await user.click(await screen.findByRole("button", { name: "Bật xác thực hai bước" }));
    expect(setup).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("JBSW Y3DP EHPK 3PXP")).toBeInTheDocument();
    const confirm = screen.getByRole("button", { name: "Xác nhận và bật" });
    expect(confirm).toBeDisabled();
    await user.type(screen.getByLabelText("Mã 6 số"), "012345");
    await user.click(confirm);
    expect(enable).toHaveBeenCalledWith("012345");
    expect(await screen.findByText("AAAAAA-111111")).toBeInTheDocument();
    const done = screen.getByRole("button", { name: "Xong" });
    expect(done).toBeDisabled();
    await user.click(screen.getByRole("checkbox"));
    await user.click(done);
    expect(screen.queryByText("AAAAAA-111111")).not.toBeInTheDocument();
  });

  it("says the code is wrong without calling it an expired session", async () => {
    const user = userEvent.setup();
    vi.spyOn(twoFactorService, "status").mockResolvedValue(off);
    vi.spyOn(twoFactorService, "setup").mockResolvedValue({
      secret: "ABCD",
      otpAuthUri: "otpauth://x",
    });
    vi.spyOn(twoFactorService, "enable").mockRejectedValue(problem(401, "INVALID_TWO_FACTOR_CODE"));
    renderSettings();
    await user.click(await screen.findByRole("button", { name: "Bật xác thực hai bước" }));
    await user.type(await screen.findByLabelText("Mã 6 số"), "000000");
    await user.click(screen.getByRole("button", { name: "Xác nhận và bật" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/Mã chưa đúng/);
    expect(alert).not.toHaveTextContent(/hết hạn/);
  });

  it("only offers to disable when enabled, and needs a code first", async () => {
    const user = userEvent.setup();
    vi.spyOn(twoFactorService, "status").mockResolvedValue(on);
    const disable = vi.spyOn(twoFactorService, "disable").mockResolvedValue();
    renderSettings();
    expect(await screen.findByText(/Còn 8 mã khôi phục/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bật xác thực hai bước" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tắt xác thực hai bước" }));
    const confirm = screen.getByRole("button", { name: "Xác nhận tắt" });
    expect(confirm).toBeDisabled();
    await user.type(screen.getByLabelText("Mã xác thực hoặc mã khôi phục"), "ab12cd-34ef56");
    await user.click(confirm);
    expect(disable).toHaveBeenCalledWith("ab12cd-34ef56");
    await waitFor(() =>
      expect(screen.queryByLabelText("Mã xác thực hoặc mã khôi phục")).toBeNull(),
    );
  });

  it("does not send an obviously malformed disable code", async () => {
    const user = userEvent.setup();
    vi.spyOn(twoFactorService, "status").mockResolvedValue(on);
    const disable = vi.spyOn(twoFactorService, "disable").mockResolvedValue();
    renderSettings();
    await user.click(await screen.findByRole("button", { name: "Tắt xác thực hai bước" }));
    await user.type(screen.getByLabelText("Mã xác thực hoặc mã khôi phục"), "123");
    await user.click(screen.getByRole("button", { name: "Xác nhận tắt" }));
    expect(disable).not.toHaveBeenCalled();
  });

  it("offers a retry when the status cannot be read", async () => {
    vi.spyOn(twoFactorService, "status").mockRejectedValue(new Error("down"));
    renderSettings();
    expect(await screen.findByRole("alert")).toHaveTextContent(/Không đọc được trạng thái/);
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});
