import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useOwnerPackages } from "@/features/vault-management/model/useOwnerVault";
import { usePlanSetup } from "@/features/plan-setup/model/usePlanSetup";
import { useVaultAssets } from "@/features/assets/model/useVaultAssets";
import { useBeneficiaries } from "@/features/beneficiaries/model/useBeneficiaries";
import { VAULT_ID, CONTAINER_ID, containerFixture } from "@/shared/api/__tests__/backend.fixtures";
import { OwnerGroups } from "../OwnerGroups";

vi.mock("@/features/vault-management/model/useOwnerVault", () => ({ useOwnerPackages: vi.fn() }));
vi.mock("@/features/plan-setup/model/usePlanSetup", () => ({ usePlanSetup: vi.fn() }));
vi.mock("@/features/assets/model/useVaultAssets", () => ({ useVaultAssets: vi.fn() }));
vi.mock("@/features/beneficiaries/model/useBeneficiaries", () => ({ useBeneficiaries: vi.fn() }));
vi.mock("@/features/vault-management/ui/CreateGroupDialog", () => ({
  CreateGroupDialog: () => <div role="dialog">Tạo gói bàn giao</div>,
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

const ASSETS = [
  { id: "a1", name: "Mật khẩu ngân hàng", kind: "TEXT" },
  { id: "a2", name: "Giấy chứng nhận nhà đất", kind: "FILE" },
  { id: "a3", name: "Sổ tiết kiệm", kind: "FILE" },
  { id: "a4", name: "Lời nhắn cho các con", kind: "TEXT" },
];
const PEOPLE = [
  { id: "p1", fullName: "Nguyễn Thị Lan", citizenIdLast4: "7756" },
  { id: "p2", fullName: "Nguyễn Minh Anh", citizenIdLast4: "4821" },
  { id: "p3", fullName: "Nguyễn Hoàng Nam", citizenIdLast4: "1093" },
];

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(useVaultAssets).mockReturnValue(listResult(ASSETS) as never);
  vi.mocked(useBeneficiaries).mockReturnValue(listResult(PEOPLE) as never);
});
afterEach(() => {
  cleanup();
});

function renderGroups(createOpen = false, onCreateOpenChange = vi.fn()) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <OwnerGroups
          vaultId={VAULT_ID}
          createOpen={createOpen}
          onCreateOpenChange={onCreateOpenChange}
        />
      </MemoryRouter>
    </QueryClientProvider>,
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

  it("hiện thẻ gói với trạng thái, chip tài sản, người nhận và đường vào chi tiết", () => {
    vi.mocked(useOwnerPackages).mockReturnValue(
      listResult([
        {
          ...containerFixture,
          assetIds: ["a1", "a2", "a3"],
          beneficiaryIds: ["p1"],
          status: "READY",
          missingRequirements: [],
        },
      ]) as never,
    );
    vi.mocked(usePlanSetup).mockReturnValue(planResult(0) as never);
    renderGroups();
    expect(screen.getByText("Sẵn sàng")).toBeInTheDocument();
    expect(screen.getByText("3 tài sản trong gói")).toBeInTheDocument();
    expect(screen.getByText("Mật khẩu ngân hàng")).toBeInTheDocument();
    expect(screen.getByText("Giấy chứng nhận nhà đất")).toBeInTheDocument();
    // Tài sản thứ ba được gom vào nút +1 để hàng chip không xuống dòng.
    expect(screen.queryByText("Sổ tiết kiệm")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Xem thêm 1 mục/ })).toHaveTextContent("+1");
    expect(screen.getByText("Nguyễn Thị Lan")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đổi tên" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: `Mở gói bàn giao ${containerFixture.name}` }),
    ).toHaveAttribute("href", `/dashboard/assets/groups/${CONTAINER_ID}`);
  });

  it("gói thiếu người nhận thì nhắc và cho chọn người nhận ngay", () => {
    vi.mocked(useOwnerPackages).mockReturnValue(
      listResult([
        {
          ...containerFixture,
          assetIds: ["a4"],
          beneficiaryIds: [],
          missingRequirements: ["NO_DESIGNATION"],
        },
      ]) as never,
    );
    vi.mocked(usePlanSetup).mockReturnValue(planResult(0) as never);
    renderGroups();
    expect(screen.getByText("Chưa sẵn sàng")).toBeInTheDocument();
    expect(screen.getByText(/Còn thiếu/)).toHaveTextContent("Còn thiếu người nhận");
    expect(screen.getByText("Chưa có ai")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Chọn người nhận" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Nguyễn Minh Anh");
    expect(screen.getByRole("dialog")).toHaveTextContent("CCCD ****4821");
  });

  it("gói trống thì cần cả tài sản và người nhận", () => {
    vi.mocked(useOwnerPackages).mockReturnValue(listResult([containerFixture]) as never);
    vi.mocked(usePlanSetup).mockReturnValue(planResult(0) as never);
    renderGroups();
    expect(screen.getByText(/Gói này còn trống/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thêm tài sản" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Chọn người nhận" })).toBeInTheDocument();
  });

  it("nhắc có mục chưa thuộc gói bàn giao nào", () => {
    vi.mocked(useOwnerPackages).mockReturnValue(listResult([containerFixture]) as never);
    vi.mocked(usePlanSetup).mockReturnValue(planResult(2) as never);
    renderGroups();
    expect(screen.getByText(/Có 2 mục chưa thuộc gói bàn giao nào/)).toBeInTheDocument();
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
