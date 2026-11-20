import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { devToolsService } from "../../api/devToolsService";
import { AdminDevTools } from "../AdminDevTools";

const VAULT_ID = "11111111-1111-4111-8111-111111111111";
let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.spyOn(devToolsService, "listVaults").mockResolvedValue([
    { vaultId: VAULT_ID, vaultName: "Kho thử", ownerName: "Chủ kho", planStatus: "ACTIVE" },
  ]);
  vi.spyOn(devToolsService, "getClock").mockResolvedValue({
    vaultId: VAULT_ID,
    planStatus: "ACTIVE",
    clockState: "SHIFTED",
    milestones: [
      { key: "SERVICE_EXPIRED", state: "PASSED", note: "" },
      { key: "RECIPIENT_DECISION_ENDED", state: "AVAILABLE", note: "" },
    ],
  });
});
afterEach(() => {
  cleanup();
  client.clear();
  vi.restoreAllMocks();
});

function renderTools() {
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/admin?vault=${VAULT_ID}`]}>
        <AdminDevTools />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Công cụ thử nghiệm: chuyển trạng thái theo từng bước", () => {
  it("chia nhóm Dịch vụ và Bàn giao, chỉ bước kế tiếp bấm được", async () => {
    renderTools();

    const list = await screen.findByRole("list", { name: "Các bước chuyển trạng thái" });
    expect(within(list).getByRole("heading", { name: "Dịch vụ" })).toBeInTheDocument();
    expect(within(list).getByRole("heading", { name: "Bàn giao" })).toBeInTheDocument();
    expect(within(list).queryByText(/điểm danh/i)).not.toBeInTheDocument();

    const next = within(list)
      .getAllByRole("listitem")
      .find((item) => item.getAttribute("aria-current") === "step");
    expect(next).toBeDefined();
    expect(
      within(next as HTMLElement).getByText("Hết 7 ngày quyết định của người nhận"),
    ).toBeInTheDocument();

    const buttons = within(list).getAllByRole("button", { name: "Chuyển sang trạng thái này" });
    const enabled = buttons.filter((button) => !button.hasAttribute("disabled"));
    expect(enabled).toHaveLength(1);
  });
});
