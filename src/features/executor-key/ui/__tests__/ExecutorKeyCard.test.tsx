import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axiosClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { ExecutorKeyCard } from "../ExecutorKeyCard";

const VAULT_ID = "22222222-2222-4222-8222-222222222222";
const SHARD = "ABCD-EFGH-JKMN-PQRS-TVWX-YZ01-2345-6789-ABCD-EFGH-JKMN-PQRS-TVWX";
const SLIP = {
  ownerName: "Nguyễn Văn A",
  vaultName: "Kho gia đình",
  executorEmail: "thuc-thi@example.test",
};
const SLIP_NAME = "Phiếu bàn giao mã mở gói";

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
      <ExecutorKeyCard vaultId={VAULT_ID} slip={SLIP} />
    </QueryClientProvider>,
  );
}

describe("ExecutorKeyCard", () => {
  it("chưa cấp: hiện Tạo mã mở gói, chỉ gọi BE sau khi xác nhận, phiếu hiện một lần", async () => {
    vi.spyOn(axiosClient, "get").mockResolvedValue(status());
    const post = vi
      .spyOn(axiosClient, "post")
      .mockResolvedValue({ ...status({ hasKey: true, version: 1 }), shard: SHARD });
    renderCard();

    expect(await screen.findByRole("heading", { name: "Mã mở gói giao cho Người thực thi" }));
    await userEvent.click(await screen.findByRole("button", { name: "Tạo mã mở gói" }));
    expect(post).not.toHaveBeenCalled();
    const confirm = await screen.findByRole("dialog");
    await userEvent.click(within(confirm).getByRole("button", { name: "Tạo mã mở gói" }));

    await waitFor(() => expect(post).toHaveBeenCalledWith(`/vaults/${VAULT_ID}/executor-key`));
    const slip = await screen.findByRole("region", { name: SLIP_NAME });
    expect(within(slip).getByText(SHARD)).toBeInTheDocument();
    expect(within(slip).getByText("Nguyễn Văn A")).toBeInTheDocument();
    expect(within(slip).getByText("thuc-thi@example.test")).toBeInTheDocument();
    expect(within(slip).getByText("Kho gia đình")).toBeInTheDocument();

    const done = screen.getByRole("button", { name: "Hoàn tất" });
    expect(done).toBeDisabled();
    await userEvent.click(
      screen.getByRole("checkbox", { name: /đã tải phiếu hoặc chép mã ra nơi an toàn/ }),
    );
    expect(done).toBeEnabled();
    await userEvent.click(done);
    await waitFor(() => expect(screen.queryByText(SHARD)).not.toBeInTheDocument());
  });

  it("đã cấp: nút Mất mã gọi cấp lại và nói rõ mã cũ hết hiệu lực", async () => {
    vi.spyOn(axiosClient, "get").mockResolvedValue(
      status({ hasKey: true, version: 1, issuedAt: "2026-11-08T01:00:00Z" }),
    );
    const post = vi
      .spyOn(axiosClient, "post")
      .mockResolvedValue({ ...status({ hasKey: true, version: 2 }), shard: SHARD });
    renderCard();

    expect(await screen.findByText("Đã cấp · Bản 1")).toBeInTheDocument();
    await userEvent.click(await screen.findByRole("button", { name: "Mất mã? Cấp lại" }));
    const confirm = await screen.findByRole("dialog");
    expect(confirm).toHaveTextContent("Mã cũ hết hiệu lực ngay");
    await userEvent.click(within(confirm).getByRole("button", { name: "Cấp lại" }));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(`/vaults/${VAULT_ID}/executor-key/reissue`),
    );
    const slip = await screen.findByRole("region", { name: SLIP_NAME });
    expect(within(slip).getByText(SHARD)).toBeInTheDocument();
    expect(within(slip).getByText(/Bản 2/)).toBeInTheDocument();
  });

  it("kế hoạch đã khóa: ẩn nút cấp lại và có lời giải thích", async () => {
    vi.spyOn(axiosClient, "get").mockResolvedValue(
      status({ hasKey: true, version: 1, canIssue: false }),
    );
    renderCard();

    expect(await screen.findByText(/Kế hoạch đang bị khóa nên không cấp lại được/)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Mất mã? Cấp lại" })).not.toBeInTheDocument();
  });

  it("lỗi tải trạng thái hiện thử lại thay vì thẻ rỗng", async () => {
    vi.spyOn(axiosClient, "get").mockRejectedValue(new Error("down"));
    renderCard();

    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});
