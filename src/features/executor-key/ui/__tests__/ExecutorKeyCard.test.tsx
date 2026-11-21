import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError, AxiosHeaders } from "axios";
import { axiosClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { ExecutorKeyCard } from "../ExecutorKeyCard";

const VAULT_ID = "22222222-2222-4222-8222-222222222222";
const PIN = "482913";

let client: QueryClient;
beforeEach(() => {
  accessTokenMemory.set("test-token");
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => {
  accessTokenMemory.clear();
  cleanup();
  client.clear();
  vi.restoreAllMocks();
});

function status(overrides: Record<string, unknown> = {}) {
  return {
    hasKey: false,
    version: 0,
    issuedAt: null,
    reissuedAt: null,
    canIssue: true,
    ...overrides,
  };
}

function renderCard() {
  return render(
    <QueryClientProvider client={client}>
      <ExecutorKeyCard vaultId={VAULT_ID} />
    </QueryClientProvider>,
  );
}

function pinProblem(code: string, extra: Record<string, unknown> = {}, httpStatus = 403) {
  return new AxiosError("pin", AxiosError.ERR_BAD_REQUEST, undefined, undefined, {
    status: httpStatus,
    statusText: "error",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { code, ...extra },
  });
}

describe("ExecutorKeyCard (Chủ kho)", () => {
  it("hệ thống tự giữ mã: chỉ có số bản, không hiện mã, không có phiếu hay nút tạo mã", async () => {
    vi.spyOn(axiosClient, "get").mockResolvedValue(
      status({ hasKey: true, version: 1, issuedAt: "2026-11-08T01:00:00Z" }),
    );
    renderCard();

    expect(await screen.findByText("Đã có · Bản 1")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Hệ thống tự giữ mã và chỉ gửi cho người nhận sau khi hồ sơ được duyệt. Bạn không cần lưu hay in mã.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Bản đang dùng")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Tạo mã mở gói/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /phiếu/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "File phân chia" })).not.toBeInTheDocument();
  });

  it("chưa có mã: nói mã được tạo khi ký kích hoạt, không có nút nào", async () => {
    vi.spyOn(axiosClient, "get").mockResolvedValue(status());
    renderCard();

    expect(await screen.findByText("Chưa tạo")).toBeInTheDocument();
    expect(screen.getByText("Mã được tạo khi bạn ký và kích hoạt kế hoạch.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("Đổi mã mới gửi mã PIN ở header X-Vault-Pin, không bật hộp thoại PIN chung, chỉ báo số bản mới", async () => {
    vi.spyOn(axiosClient, "get").mockResolvedValue(
      status({ hasKey: true, version: 1, issuedAt: "2026-11-08T01:00:00Z" }),
    );
    const post = vi
      .spyOn(axiosClient, "post")
      .mockResolvedValue(status({ hasKey: true, version: 2, issuedAt: "2026-11-08T01:00:00Z" }));
    renderCard();

    await userEvent.click(await screen.findByRole("button", { name: "Đổi mã mới" }));
    expect(post).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Mã cũ hết dùng được ngay");
    await userEvent.type(within(dialog).getByLabelText(/Nhập mã PIN của kho/), PIN);
    await userEvent.click(within(dialog).getByRole("button", { name: "Đổi mã mới" }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][0]).toBe(`/vaults/${VAULT_ID}/executor-key/reissue`);
    expect(post.mock.calls[0][2]).toMatchObject({
      headers: { "X-Vault-Pin": PIN },
      skipVaultPinPrompt: true,
    });
    expect(await screen.findByText("Đã đổi mã. Bản đang dùng là Bản 2.")).toBeInTheDocument();
    expect(document.body.textContent ?? "").not.toContain(PIN);
  });

  it("sai PIN: hiện số lần còn lại, xóa ô PIN, không đóng hộp thoại", async () => {
    vi.spyOn(axiosClient, "get").mockResolvedValue(status({ hasKey: true, version: 1 }));
    vi.spyOn(axiosClient, "post").mockRejectedValue(
      pinProblem("INVALID_VAULT_PIN", { attemptsRemaining: 2 }),
    );
    renderCard();

    await userEvent.click(await screen.findByRole("button", { name: "Đổi mã mới" }));
    const dialog = await screen.findByRole("dialog");
    const input = within(dialog).getByLabelText(/Nhập mã PIN của kho/);
    await userEvent.type(input, PIN);
    await userEvent.click(within(dialog).getByRole("button", { name: "Đổi mã mới" }));

    expect(await within(dialog).findByText("Mã PIN không đúng. Còn 2 lần thử.")).toBeVisible();
    expect(input).toHaveValue("");
  });

  it("PIN bị khóa: hiện thông báo khóa và khóa ô nhập", async () => {
    vi.spyOn(axiosClient, "get").mockResolvedValue(status({ hasKey: true, version: 1 }));
    vi.spyOn(axiosClient, "post").mockRejectedValue(pinProblem("VAULT_PIN_LOCKED", {}, 423));
    renderCard();

    await userEvent.click(await screen.findByRole("button", { name: "Đổi mã mới" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText(/Nhập mã PIN của kho/), PIN);
    await userEvent.click(within(dialog).getByRole("button", { name: "Đổi mã mới" }));

    expect(await within(dialog).findByText(/Mã PIN đang bị khóa tạm/)).toBeVisible();
    expect(within(dialog).getByLabelText(/Nhập mã PIN của kho/)).toBeDisabled();
  });

  it("kế hoạch đã khóa: ẩn nút đổi mã và có lời giải thích", async () => {
    vi.spyOn(axiosClient, "get").mockResolvedValue(
      status({ hasKey: true, version: 1, canIssue: false }),
    );
    renderCard();

    expect(await screen.findByText(/Kế hoạch đang bị khóa nên không đổi mã được/)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Đổi mã mới" })).not.toBeInTheDocument();
  });

  it("lỗi tải trạng thái hiện thử lại thay vì thẻ rỗng", async () => {
    vi.spyOn(axiosClient, "get").mockRejectedValue(new Error("down"));
    renderCard();

    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});
