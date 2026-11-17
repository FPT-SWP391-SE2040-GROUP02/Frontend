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
    checkInState: "ON_TIME",
    clockState: "SHIFTED",
    maxLateReminders: 3,
    lateReminderGapDays: 1,
    milestones: [
      { key: "DUE_REMINDER_1", state: "PASSED", note: "", daysBeforeDue: 7 },
      { key: "DUE_REMINDER_2", state: "AVAILABLE", note: "", daysBeforeDue: 1 },
      { key: "CHECKIN_OVERDUE", state: "AVAILABLE", note: "", daysBeforeDue: null },
      { key: "LATE_REMINDER_2", state: "AVAILABLE", note: "", daysBeforeDue: null },
      { key: "LATE_REMINDER_3", state: "AVAILABLE", note: "", daysBeforeDue: null },
      { key: "GRACE_ENDED", state: "AVAILABLE", note: "", daysBeforeDue: null },
      { key: "SERVICE_EXPIRED", state: "AVAILABLE", note: "", daysBeforeDue: null },
      {
        key: "RECIPIENT_DECISION_ENDED",
        state: "NOT_APPLICABLE",
        note: "Chưa có người nhận.",
        daysBeforeDue: null,
      },
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
  it("chia nhóm, hiện thư nhắc trước hạn và nhắc trễ, chỉ bước kế tiếp bấm được", async () => {
    renderTools();

    const list = await screen.findByRole("list", { name: "Các bước chuyển trạng thái" });
    expect(within(list).getByRole("heading", { name: "Trước hạn điểm danh" })).toBeInTheDocument();
    expect(within(list).getByRole("heading", { name: "Quá hạn điểm danh" })).toBeInTheDocument();
    expect(within(list).getByRole("heading", { name: "Sau thời gian chờ" })).toBeInTheDocument();

    expect(within(list).getByText("Còn 7 ngày tới hạn")).toBeInTheDocument();
    // Tên bước và chip thư cùng chữ "Nhắc trễ lần 3".
    expect(within(list).getAllByText("Nhắc trễ lần 3")).toHaveLength(2);
    expect(
      within(list).getByText(
        "Thư nhắc cuối cùng trước khi hết thời gian chờ. Gửi sau thư trước 1 ngày.",
      ),
    ).toBeInTheDocument();

    const next = within(list)
      .getAllByRole("listitem")
      .find((item) => item.getAttribute("aria-current") === "step");
    expect(next).toBeDefined();
    expect(within(next as HTMLElement).getByText("Còn 1 ngày tới hạn")).toBeInTheDocument();

    const buttons = within(list).getAllByRole("button", { name: "Chuyển sang trạng thái này" });
    const enabled = buttons.filter((button) => !button.hasAttribute("disabled"));
    expect(enabled).toHaveLength(1);

    expect(screen.getByText("Nhắc trước hạn: 1/2")).toBeInTheDocument();
    expect(screen.getByText("Nhắc trễ: 0/3")).toBeInTheDocument();
  });
});
