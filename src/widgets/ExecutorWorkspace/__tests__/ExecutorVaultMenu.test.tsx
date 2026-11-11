import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ExecutorVaultMenu } from "../ExecutorVaultMenu";
import * as useExecutorVaultsModule from "@/features/death-case/model/useExecutorVaults";
import type { ExecutorVault } from "@/features/death-case/model/deathCase.schema";

vi.mock("@/features/death-case/model/useExecutorVaults");

const safeVault: ExecutorVault = {
  vaultId: "550e8400-e29b-41d4-a716-446655440001",
  ownerFullName: "Trần Văn A",
  planStatus: "ACTIVE",
  checkInOverdue: false,
  openDeathCaseId: null,
};

const handoverVault: ExecutorVault = {
  vaultId: "550e8400-e29b-41d4-a716-446655440002",
  ownerFullName: "Nguyễn Thị Mai",
  planStatus: "HANDOVER_IN_PROGRESS",
  checkInOverdue: false,
  openDeathCaseId: "550e8400-e29b-41d4-a716-446655440009",
};

function mockState(vaults: ExecutorVault[], selected: ExecutorVault | null) {
  const select = vi.fn();
  vi.spyOn(useExecutorVaultsModule, "useSelectedExecutorVault").mockReturnValue({
    query: {} as never,
    vaults,
    selected,
    select,
    clear: vi.fn(),
    open: vi.fn(),
  });
  return { select };
}

function renderMenu() {
  return render(
    <MemoryRouter>
      <ExecutorVaultMenu />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ExecutorVaultMenu", () => {
  it("không hiển thị gì khi chưa có kho nào", () => {
    mockState([], null);
    const { container } = renderMenu();
    expect(container.firstChild).toBeNull();
  });

  it("liệt kê mọi kho: chữ cái đầu, tên Chủ kho và trạng thái gọn", () => {
    mockState([safeVault, handoverVault], safeVault);
    renderMenu();
    expect(screen.getByRole("heading", { name: "Kho bạn đang giữ" })).toBeInTheDocument();
    const first = screen.getByRole("button", { name: "Kho của Trần Văn A" });
    const second = screen.getByRole("button", { name: "Kho của Nguyễn Thị Mai" });
    expect(first).toHaveTextContent("T");
    expect(first).toHaveTextContent("Kế hoạch đang chạy");
    expect(second).toHaveTextContent("N");
    expect(second).toHaveTextContent("Đang bàn giao");
  });

  it("kho đang chọn có viền vàng và aria-pressed; bấm kho khác gọi select", () => {
    const { select } = mockState([safeVault, handoverVault], safeVault);
    renderMenu();
    const first = screen.getByRole("button", { name: "Kho của Trần Văn A" });
    const second = screen.getByRole("button", { name: "Kho của Nguyễn Thị Mai" });
    expect(first).toHaveAttribute("aria-pressed", "true");
    expect(first).toHaveClass("border-[#C9A45C]");
    expect(second).toHaveAttribute("aria-pressed", "false");
    expect(second).not.toHaveClass("border-[#C9A45C]");
    fireEvent.click(second);
    expect(select).toHaveBeenCalledWith(handoverVault.vaultId);
  });
});
