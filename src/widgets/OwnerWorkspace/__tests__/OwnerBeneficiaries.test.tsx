import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import authReducer from "@/entities/user/model/authSlice";
import { useBeneficiaries } from "@/features/beneficiaries/model/useBeneficiaries";
import { useOwnerPackages, useOwnerVault } from "@/features/vault-management/model/useOwnerVault";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { VAULT_ID } from "@/shared/api/__tests__/backend.fixtures";
import { OwnerBeneficiaries } from "../OwnerBeneficiaries";

vi.mock("@/features/vault-management/model/useOwnerVault", () => ({
  useOwnerVault: vi.fn(),
  useOwnerPackages: vi.fn(),
  isOwnerVaultMissing: () => false,
}));
vi.mock("@/features/beneficiaries/model/useBeneficiaries", () => ({ useBeneficiaries: vi.fn() }));

function mockVault(overrides: Record<string, unknown>) {
  vi.mocked(useOwnerVault).mockReturnValue({
    isError: false,
    isPending: false,
    data: {
      id: VAULT_ID,
      serviceTier: "XS",
      serviceStatus: "ACTIVE",
      usedBeneficiarySlots: 0,
      beneficiarySlots: 5,
      ...overrides,
    },
  } as never);
}

beforeEach(() => {
  vi.resetAllMocks();
  accessTokenMemory.set("owner-beneficiaries-fixture");
  vi.mocked(useOwnerPackages).mockReturnValue({ data: { items: [] } } as never);
  vi.mocked(useBeneficiaries).mockReturnValue({
    isError: false,
    isPending: false,
    isFetching: false,
    data: { items: [], totalCount: 0, hasNextPage: false },
  } as never);
});
afterEach(() => {
  cleanup();
  accessTokenMemory.clear();
});

function renderPage() {
  const store = configureStore({ reducer: { auth: authReducer } });
  render(
    <Provider store={store}>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <OwnerBeneficiaries />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe("trang người nhận của Chủ kho", () => {
  it("gói Miễn phí: Thêm người nhận mở hộp thoại cần gói trả phí thay cho form", async () => {
    mockVault({ serviceTier: "FREE", beneficiarySlots: 0 });
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Thêm người nhận" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Cần gói trả phí");
    expect(dialog).toHaveTextContent("Kho và nội dung hiện có vẫn giữ nguyên.");
    expect(screen.getByRole("link", { name: "Xem gói dịch vụ" })).toHaveAttribute(
      "href",
      "/pricing",
    );
    expect(screen.queryByLabelText(/^Họ và tên/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Để sau" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("gói trả phí: mở form thêm và Hủy đóng hộp thoại", async () => {
    mockVault({});
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Thêm người nhận" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Nhập thông tin để đối chiếu khi bàn giao.");
    expect(screen.getByLabelText(/^Họ và tên/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Hủy" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("đang gia hạn: báo trên đầu và khóa nút Thêm", () => {
    mockVault({ serviceStatus: "GRACE_READ_ONLY" });
    renderPage();
    expect(
      screen.getByText(/Bạn chưa thêm hoặc sửa được người nhận, nhưng\s+vẫn xóa được\./),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thêm người nhận" })).toBeDisabled();
  });
});
