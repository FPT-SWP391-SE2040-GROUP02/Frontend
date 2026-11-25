import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ExecutorVaultCard } from "../ExecutorVaultCard";
import * as useExecutorVaultsModule from "@/features/death-case/model/useExecutorVaults";
import type { ExecutorVault } from "@/features/death-case/model/deathCase.schema";

vi.mock("@/features/death-case/model/useExecutorVaults");

const handoverVault: ExecutorVault = {
  vaultId: "550e8400-e29b-41d4-a716-446655440002",
  ownerFullName: "Nguyễn Thị Mai",
  planStatus: "HANDOVER_IN_PROGRESS",
  handoverRecordId: "550e8400-e29b-41d4-a716-446655440009",
  handoverRecordStatus: "SIGNING",
};

function mockState(selected: ExecutorVault | null, pending = false) {
  const select = vi.fn();
  vi.spyOn(useExecutorVaultsModule, "useSelectedExecutorVault").mockReturnValue({
    query: { isPending: pending } as never,
    vaults: selected ? [selected] : [],
    selected,
    select,
    clear: vi.fn(),
    open: vi.fn(),
  });
  return { select };
}

function renderCard() {
  return render(
    <MemoryRouter initialEntries={["/executor/report"]}>
      <Routes>
        <Route path="/executor/report" element={<ExecutorVaultCard />} />
        <Route path="/executor/invitations" element={<p>Trang lời mời và kho</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ExecutorVaultCard", () => {
  it("chỉ hiển thị kho đang chọn: chữ cái đầu, tên Chủ kho, trạng thái, không bấm được", () => {
    const { select } = mockState(handoverVault);
    renderCard();
    expect(screen.getByRole("heading", { name: "Đang làm việc với kho" })).toBeInTheDocument();
    const card = screen.getByRole("group", { name: "Kho đang làm việc: Nguyễn Thị Mai" });
    expect(card).toHaveTextContent("N");
    expect(card).toHaveTextContent("Nguyễn Thị Mai");
    expect(card).toHaveTextContent("Đang ký biên bản");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    fireEvent.click(card);
    expect(select).not.toHaveBeenCalled();
  });

  it("có liên kết Đổi kho → dẫn tới trang lời mời và các kho", async () => {
    mockState(handoverVault);
    renderCard();
    const link = screen.getByRole("link", { name: "Đổi kho →" });
    expect(link).toHaveAttribute("href", "/executor/invitations");
    fireEvent.click(link);
    expect(await screen.findByText("Trang lời mời và kho")).toBeInTheDocument();
  });

  it("chưa giữ kho nào thì không hiện khối kho", () => {
    mockState(null);
    renderCard();
    expect(
      screen.queryByRole("heading", { name: "Đang làm việc với kho" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("đang tải danh sách kho thì chỉ báo đang tải, chưa có liên kết đổi kho", () => {
    mockState(null, true);
    renderCard();
    expect(screen.getByRole("status")).toHaveTextContent("Đang tải kho…");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
