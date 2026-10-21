import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useOwnerPackages } from "@/features/vault-management/model/useOwnerVault";
import { usePlanSetup } from "@/features/plan-setup/model/usePlanSetup";
import { VAULT_ID, CONTAINER_ID, containerFixture } from "@/shared/api/__tests__/backend.fixtures";
import { OwnerGroups } from "../OwnerGroups";

vi.mock("@/features/vault-management/model/useOwnerVault", () => ({ useOwnerPackages: vi.fn() }));
vi.mock("@/features/plan-setup/model/usePlanSetup", () => ({ usePlanSetup: vi.fn() }));
vi.mock("@/features/vault-management/ui/CreateGroupDialog", () => ({
  CreateGroupDialog: () => <div role="dialog">Tạo nhóm</div>,
}));

function listResult(items: unknown[], hasNextPage = false) {
  return {
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
    data: { items, totalCount: items.length, hasNextPage },
  };
}

function planResult(outside: number) {
  const assets = [];
  for (let index = 0; index < outside; index += 1) {
    assets.push({ id: `a${index}`, name: "Mục", kind: "TEXT" });
  }
  return { data: { assetsOutsideContainer: assets } };
}

beforeEach(() => {
  vi.resetAllMocks();
});
afterEach(() => {
  cleanup();
});

function renderGroups(createOpen = false, onCreateOpenChange = vi.fn()) {
  return render(
    <MemoryRouter>
      <OwnerGroups
        vaultId={VAULT_ID}
        createOpen={createOpen}
        onCreateOpenChange={onCreateOpenChange}
      />
    </MemoryRouter>,
  );
}

describe("tab Nhóm trong Kho của tôi", () => {
  it("chưa có nhóm thì mời tạo nhóm đầu tiên", () => {
    vi.mocked(useOwnerPackages).mockReturnValue(listResult([]) as never);
    vi.mocked(usePlanSetup).mockReturnValue(planResult(0) as never);
    const onCreateOpenChange = vi.fn();
    renderGroups(false, onCreateOpenChange);
    expect(screen.getByText("Bạn chưa có nhóm nào.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tạo nhóm đầu tiên" }));
    expect(onCreateOpenChange).toHaveBeenCalledWith(true);
  });

  it("liệt kê nhóm với trạng thái, số mục, số người nhận và đường vào chi tiết", () => {
    vi.mocked(useOwnerPackages).mockReturnValue(
      listResult([
        { ...containerFixture, assetIds: ["x", "y"], beneficiaryIds: ["z"], status: "READY" },
        { ...containerFixture, id: VAULT_ID, name: "Nhóm nháp" },
      ]) as never,
    );
    vi.mocked(usePlanSetup).mockReturnValue(planResult(0) as never);
    renderGroups();
    expect(screen.getByText("2 mục · 1 người nhận")).toBeInTheDocument();
    expect(screen.getByText("Sẵn sàng")).toBeInTheDocument();
    expect(screen.getByText("Chưa sẵn sàng")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: `Mở nhóm ${containerFixture.name}` })).toHaveAttribute(
      "href",
      `/dashboard/assets/groups/${CONTAINER_ID}`,
    );
  });

  it("nhắc có mục chưa thuộc nhóm nào", () => {
    vi.mocked(useOwnerPackages).mockReturnValue(listResult([containerFixture]) as never);
    vi.mocked(usePlanSetup).mockReturnValue(planResult(2) as never);
    renderGroups();
    expect(screen.getByRole("status")).toHaveTextContent("Có 2 mục chưa thuộc nhóm nào");
  });

  it("giữ lỗi và cho thử lại thay vì hiện danh sách rỗng", () => {
    vi.mocked(useOwnerPackages).mockReturnValue({
      isPending: false,
      isError: true,
      isFetching: false,
      refetch: vi.fn(),
    } as never);
    vi.mocked(usePlanSetup).mockReturnValue(planResult(0) as never);
    renderGroups();
    expect(screen.getByRole("alert")).toHaveTextContent("Không tải được danh sách nhóm");
    expect(screen.queryByText("Bạn chưa có nhóm nào.")).not.toBeInTheDocument();
  });

  it("hiện hộp thoại tạo nhóm khi trang cha yêu cầu", () => {
    vi.mocked(useOwnerPackages).mockReturnValue(listResult([containerFixture]) as never);
    vi.mocked(usePlanSetup).mockReturnValue(planResult(0) as never);
    renderGroups(true);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
