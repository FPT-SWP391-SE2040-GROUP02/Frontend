import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useOwnerPackages } from "@/features/vault-management/model/useOwnerVault";
import { usePlanSetup } from "@/features/plan-setup/model/usePlanSetup";
import { VAULT_ID, CONTAINER_ID, containerFixture } from "@/shared/api/__tests__/backend.fixtures";
import { OwnerGroups } from "../OwnerGroups";

vi.mock("@/features/vault-management/model/useOwnerVault", () => ({ useOwnerPackages: vi.fn() }));
vi.mock("@/features/plan-setup/model/usePlanSetup", () => ({ usePlanSetup: vi.fn() }));
vi.mock("../PackageDialog", () => ({
  PackageDialog: ({ existing }: { existing?: { name: string } }) => (
    <div role="dialog">{existing ? `Chỉnh sửa ${existing.name}` : "Tạo gói bàn giao"}</div>
  ),
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

function planResult(outside: number, containers: unknown[] = [], planStatus = "ACTIVE") {
  const assets = [];
  for (let index = 0; index < outside; index += 1) {
    assets.push({ id: `a${index}`, name: "Mục", kind: "TEXT" });
  }
  return { data: { assetsOutsideContainer: assets, containers, planStatus } };
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

describe("tab Gói bàn giao trong Kho của tôi", () => {
  it("chưa có gói bàn giao thì mời tạo gói bàn giao đầu tiên", () => {
    vi.mocked(useOwnerPackages).mockReturnValue(listResult([]) as never);
    vi.mocked(usePlanSetup).mockReturnValue(planResult(0) as never);
    const onCreateOpenChange = vi.fn();
    renderGroups(false, onCreateOpenChange);
    expect(screen.getByText("Bạn chưa có gói bàn giao nào.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tạo gói bàn giao đầu tiên" }));
    expect(onCreateOpenChange).toHaveBeenCalledWith(true);
  });

  it("liệt kê gói bàn giao với trạng thái, số mục, số người nhận và đường vào chi tiết", () => {
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
    expect(screen.queryByRole("link", { name: /Mở gói bàn giao/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: `Chỉnh sửa bàn giao ${containerFixture.name}` }),
    );
    expect(screen.getByRole("dialog")).toHaveTextContent(`Chỉnh sửa ${containerFixture.name}`);
  });

  it("gói chưa sẵn sàng hiện lý do còn thiếu, gói sẵn sàng thì không", () => {
    vi.mocked(useOwnerPackages).mockReturnValue(
      listResult([
        { ...containerFixture, status: "READY" },
        { ...containerFixture, id: VAULT_ID, name: "Nhóm nháp", status: "DRAFT" },
      ]) as never,
    );
    vi.mocked(usePlanSetup).mockReturnValue(
      planResult(0, [
        { id: CONTAINER_ID, status: "READY", missingRequirements: [] },
        {
          id: VAULT_ID,
          status: "DRAFT",
          missingRequirements: ["NO_ASSET", "NO_DESIGNATION", "CODE_LA"],
        },
      ]) as never,
    );
    renderGroups();
    expect(
      screen.getByText("Chưa sẵn sàng: chưa có mục nào, chưa có người nhận, còn thiếu điều kiện."),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Chưa sẵn sàng:/)).toHaveLength(1);
  });

  it("kế hoạch còn nháp: một lối vào bước kích hoạt; đã kích hoạt thì không có", () => {
    vi.mocked(useOwnerPackages).mockReturnValue(listResult([containerFixture]) as never);
    vi.mocked(usePlanSetup).mockReturnValue(planResult(0, [], "DRAFT") as never);
    renderGroups();
    expect(screen.getAllByRole("link", { name: "Kích hoạt kế hoạch" })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Kích hoạt kế hoạch" })).toHaveAttribute(
      "href",
      "/setup?step=activate",
    );
    cleanup();
    vi.mocked(usePlanSetup).mockReturnValue(planResult(0, [], "ACTIVE") as never);
    renderGroups();
    expect(screen.queryByRole("link", { name: "Kích hoạt kế hoạch" })).not.toBeInTheDocument();
  });

  it("nhắc có mục chưa thuộc gói bàn giao nào", () => {
    vi.mocked(useOwnerPackages).mockReturnValue(listResult([containerFixture]) as never);
    vi.mocked(usePlanSetup).mockReturnValue(planResult(2) as never);
    renderGroups();
    expect(screen.getByRole("status")).toHaveTextContent("Có 2 mục chưa thuộc gói bàn giao nào");
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
    expect(screen.getByRole("alert")).toHaveTextContent("Không tải được danh sách gói bàn giao");
    expect(screen.queryByText("Bạn chưa có gói bàn giao nào.")).not.toBeInTheDocument();
  });

  it("hiện hộp thoại tạo gói bàn giao khi trang cha yêu cầu", () => {
    vi.mocked(useOwnerPackages).mockReturnValue(listResult([containerFixture]) as never);
    vi.mocked(usePlanSetup).mockReturnValue(planResult(0) as never);
    renderGroups(true);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
