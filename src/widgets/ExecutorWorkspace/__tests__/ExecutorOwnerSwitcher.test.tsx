import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExecutorOwnerSwitcher } from "../ExecutorOwnerSwitcher";
import * as useExecutorVaultsModule from "@/features/death-case/model/useExecutorVaults";

vi.mock("@/features/death-case/model/useExecutorVaults");

const mockVault1 = {
  vaultId: "550e8400-e29b-41d4-a716-446655440001",
  ownerFullName: "Trần Văn A",
  planStatus: "ACTIVE",
  checkInOverdue: false,
  openDeathCaseId: null,
};

const mockVault2 = {
  vaultId: "550e8400-e29b-41d4-a716-446655440002",
  ownerFullName: "Nguyễn Thị Mai",
  planStatus: "ACTIVE",
  checkInOverdue: true,
  openDeathCaseId: null,
};

describe("ExecutorOwnerSwitcher", () => {
  it("không hiển thị gì khi chưa có kho nào", () => {
    vi.spyOn(useExecutorVaultsModule, "useSelectedExecutorVault").mockReturnValue({
      query: {} as never,
      vaults: [],
      selected: null,
      select: vi.fn(),
      clear: vi.fn(),
    });

    const { container } = render(<ExecutorOwnerSwitcher />);
    expect(container.firstChild).toBeNull();
  });

  it("hiển thị thẻ tĩnh khi chỉ phụ trách 1 kho", () => {
    vi.spyOn(useExecutorVaultsModule, "useSelectedExecutorVault").mockReturnValue({
      query: {} as never,
      vaults: [mockVault1],
      selected: mockVault1,
      select: vi.fn(),
      clear: vi.fn(),
    });

    render(<ExecutorOwnerSwitcher />);
    expect(screen.getByText("Chủ kho phụ trách")).toBeInTheDocument();
    expect(screen.getByText("Trần Văn A")).toBeInTheDocument();
    expect(screen.getByText("Kho an toàn")).toBeInTheDocument();
  });

  it("mở danh sách và gọi select khi có nhiều kho", () => {
    const selectMock = vi.fn();
    vi.spyOn(useExecutorVaultsModule, "useSelectedExecutorVault").mockReturnValue({
      query: {} as never,
      vaults: [mockVault1, mockVault2],
      selected: mockVault1,
      select: selectMock,
      clear: vi.fn(),
    });

    render(<ExecutorOwnerSwitcher />);
    const toggleButton = screen.getByRole("button", { name: "Chọn chủ kho cần làm việc" });
    expect(toggleButton).toBeInTheDocument();
    expect(screen.getByText("Trần Văn A")).toBeInTheDocument();

    // Mở dropdown
    fireEvent.click(toggleButton);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByText("Nguyễn Thị Mai")).toBeInTheDocument();
    expect(screen.getByText("Quá hạn điểm danh")).toBeInTheDocument();

    // Chọn kho thứ hai
    fireEvent.click(screen.getByText("Nguyễn Thị Mai"));
    expect(selectMock).toHaveBeenCalledWith(mockVault2.vaultId);
  });
});
