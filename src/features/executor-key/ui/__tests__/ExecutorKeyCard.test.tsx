import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axiosClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { ExecutorKeyCard } from "../ExecutorKeyCard";

const VAULT_ID = "22222222-2222-4222-8222-222222222222";
const SHARD = "ABCD-EFGH-JKMN-PQRS-TVWX-YZ01-2345-6789-ABCD-EFGH-JKMN-PQRS-TVWX";

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

describe("ExecutorKeyCard", () => {
  it("chưa cấp: hiện Tạo mảnh khóa, chỉ gọi BE sau khi xác nhận, mảnh hiện một lần", async () => {
    vi.spyOn(axiosClient, "get").mockResolvedValue(status());
    const post = vi
      .spyOn(axiosClient, "post")
      .mockResolvedValue({ ...status({ hasKey: true, version: 1 }), shard: SHARD });
    renderCard();

    await userEvent.click(await screen.findByRole("button", { name: "Tạo mảnh khóa" }));
    expect(post).not.toHaveBeenCalled();
    const confirm = await screen.findByRole("dialog");
    await userEvent.click(within(confirm).getByRole("button", { name: "Tạo mảnh khóa" }));

    await waitFor(() => expect(post).toHaveBeenCalledWith(`/vaults/${VAULT_ID}/executor-key`));
    expect(await screen.findByLabelText("Mảnh khóa")).toHaveTextContent(SHARD);
    const close = screen.getByRole("button", { name: "Đóng" });
    expect(close).toBeDisabled();
    await userEvent.click(screen.getByRole("checkbox", { name: /đã đưa mảnh khóa/ }));
    expect(close).toBeEnabled();
    await userEvent.click(close);
    await waitFor(() => expect(screen.queryByLabelText("Mảnh khóa")).not.toBeInTheDocument());
  });

  it("đã cấp: nút Quên khóa gọi cấp lại và nói rõ mảnh cũ hết hiệu lực", async () => {
    vi.spyOn(axiosClient, "get").mockResolvedValue(
      status({ hasKey: true, version: 1, issuedAt: "2026-11-08T01:00:00Z" }),
    );
    const post = vi
      .spyOn(axiosClient, "post")
      .mockResolvedValue({ ...status({ hasKey: true, version: 2 }), shard: SHARD });
    renderCard();

    await userEvent.click(await screen.findByRole("button", { name: "Quên khóa? Cấp lại" }));
    const confirm = await screen.findByRole("dialog");
    expect(confirm).toHaveTextContent("Mảnh cũ hết hiệu lực ngay");
    await userEvent.click(within(confirm).getByRole("button", { name: "Cấp lại" }));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(`/vaults/${VAULT_ID}/executor-key/reissue`),
    );
    expect(await screen.findByLabelText("Mảnh khóa")).toHaveTextContent(SHARD);
  });

  it("kế hoạch đã khóa: nút bị tắt và có lời giải thích", async () => {
    vi.spyOn(axiosClient, "get").mockResolvedValue(
      status({ hasKey: true, version: 1, canIssue: false }),
    );
    renderCard();

    expect(await screen.findByRole("button", { name: "Quên khóa? Cấp lại" })).toBeDisabled();
    expect(screen.getByText(/Kế hoạch đang bị khóa/)).toBeInTheDocument();
  });

  it("lỗi tải trạng thái hiện thử lại thay vì thẻ rỗng", async () => {
    vi.spyOn(axiosClient, "get").mockRejectedValue(new Error("down"));
    renderCard();

    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});
