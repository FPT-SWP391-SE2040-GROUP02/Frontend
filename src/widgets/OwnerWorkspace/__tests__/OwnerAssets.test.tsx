import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vaultFixture } from "@/shared/api/__tests__/backend.fixtures";
import { useOwnerPackages } from "@/features/vault-management/model/useOwnerVault";
import { ownerVaultService } from "@/features/vault-management/api/ownerVaultService";
import { OwnerAssets } from "../OwnerAssets";

interface CapturedProps {
  packages: Array<{ id: string; name: string; assetIds: string[] }>;
  onMove: (assetIds: string[], packageId: string | null) => Promise<string | null>;
  packagesHref: string;
}
let captured: CapturedProps | null = null;

vi.mock("@/features/assets/ui/AssetList", () => ({
  AssetList: (props: CapturedProps) => {
    captured = props;
    return <div>Danh sách tài sản giả</div>;
  },
}));
vi.mock("../AddAssetDialog", () => ({
  AddAssetDialog: () => <div role="dialog">Thêm tài sản</div>,
}));
vi.mock("@/features/vault-management/model/useOwnerVault", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/vault-management/model/useOwnerVault")>()),
  useOwnerPackages: vi.fn(),
}));

const PACKAGE_A = "c0000000-0000-4000-8000-00000000000a";
const PACKAGE_B = "c0000000-0000-4000-8000-00000000000b";
const ASSET_IN_A = "a0000000-0000-4000-8000-000000000001";
const ASSET_FREE = "a0000000-0000-4000-8000-000000000002";

let client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  captured = null;
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.mocked(useOwnerPackages).mockReturnValue({
    isPending: false,
    isError: false,
    data: {
      items: [
        {
          id: PACKAGE_A,
          name: "Gói A",
          status: "READY",
          assetIds: [ASSET_IN_A],
          beneficiaryIds: [],
        },
        { id: PACKAGE_B, name: "Gói B", status: "DRAFT", assetIds: [], beneficiaryIds: [] },
        {
          id: "c0000000-0000-4000-8000-00000000000c",
          name: "Đã xóa",
          status: "REMOVED",
          assetIds: [],
          beneficiaryIds: [],
        },
      ],
    },
  } as never);
});
afterEach(() => {
  cleanup();
  client.clear();
  vi.restoreAllMocks();
});

function renderAssets() {
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <OwnerAssets vault={vaultFixture} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function props(): CapturedProps {
  if (captured === null) {
    throw new Error("AssetList chưa được render");
  }
  return captured;
}

describe("màn Tài sản", () => {
  it("chỉ đưa gói còn dùng vào danh sách và trỏ nút Quản lý sang màn Gói bàn giao", () => {
    renderAssets();
    expect(props().packages.map((item) => item.name)).toEqual(["Gói A", "Gói B"]);
    expect(props().packagesHref).toBe("/dashboard/packages");
  });

  it("đổi gói: gỡ khỏi gói cũ rồi mới gắn vào gói mới", async () => {
    const change = vi.spyOn(ownerVaultService, "changeMember").mockResolvedValue({} as never);
    renderAssets();
    let result: string | null = "chưa chạy";
    await act(async () => {
      result = await props().onMove([ASSET_IN_A], PACKAGE_B);
    });
    expect(result).toBeNull();
    expect(change).toHaveBeenNthCalledWith(
      1,
      vaultFixture.id,
      PACKAGE_A,
      "assets",
      ASSET_IN_A,
      false,
      false,
    );
    expect(change).toHaveBeenNthCalledWith(
      2,
      vaultFixture.id,
      PACKAGE_B,
      "assets",
      ASSET_IN_A,
      true,
    );
  });

  it("tài sản chưa có gói chỉ cần gắn; chọn 'chưa gán' thì chỉ gỡ", async () => {
    const change = vi.spyOn(ownerVaultService, "changeMember").mockResolvedValue({} as never);
    renderAssets();
    await act(async () => {
      await props().onMove([ASSET_FREE], PACKAGE_A);
    });
    expect(change).toHaveBeenCalledTimes(1);
    expect(change).toHaveBeenCalledWith(vaultFixture.id, PACKAGE_A, "assets", ASSET_FREE, true);
    change.mockClear();
    await act(async () => {
      await props().onMove([ASSET_IN_A], null);
    });
    expect(change).toHaveBeenCalledTimes(1);
    expect(change).toHaveBeenCalledWith(
      vaultFixture.id,
      PACKAGE_A,
      "assets",
      ASSET_IN_A,
      false,
      false,
    );
  });

  it("bỏ qua tài sản đã ở đúng gói", async () => {
    const change = vi.spyOn(ownerVaultService, "changeMember").mockResolvedValue({} as never);
    renderAssets();
    await act(async () => {
      await props().onMove([ASSET_IN_A], PACKAGE_A);
    });
    expect(change).not.toHaveBeenCalled();
  });

  it("gỡ làm kế hoạch về Nháp: hỏi đồng ý rồi gửi lại kèm xác nhận và gắn tiếp", async () => {
    const change = vi
      .spyOn(ownerVaultService, "changeMember")
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 409, data: { code: "PLAN_DEACTIVATION_CONFIRMATION_REQUIRED" } },
      })
      .mockResolvedValue({} as never);
    renderAssets();
    let pending: Promise<string | null> = Promise.resolve("chưa chạy");
    act(() => {
      pending = props().onMove([ASSET_IN_A], PACKAGE_B);
    });
    expect(await screen.findByText("Đưa kế hoạch về Nháp?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Đồng ý, tiếp tục" }));
    await expect(pending).resolves.toBeNull();
    expect(change).toHaveBeenNthCalledWith(
      2,
      vaultFixture.id,
      PACKAGE_A,
      "assets",
      ASSET_IN_A,
      false,
      true,
    );
    expect(change).toHaveBeenNthCalledWith(
      3,
      vaultFixture.id,
      PACKAGE_B,
      "assets",
      ASSET_IN_A,
      true,
    );
  });

  it("không đồng ý đưa kế hoạch về Nháp thì dừng, không gắn gói mới", async () => {
    const change = vi.spyOn(ownerVaultService, "changeMember").mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 409, data: { code: "PLAN_DEACTIVATION_CONFIRMATION_REQUIRED" } },
    });
    renderAssets();
    let pending: Promise<string | null> = Promise.resolve("chưa chạy");
    act(() => {
      pending = props().onMove([ASSET_IN_A], PACKAGE_B);
    });
    fireEvent.click(await screen.findByRole("button", { name: "Giữ nguyên" }));
    await expect(pending).resolves.toContain("không đồng ý");
    expect(change).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByText("Đưa kế hoạch về Nháp?")).not.toBeInTheDocument(),
    );
  });

  it("lỗi của Backend được trả về thành câu cho người dùng, không ném ra ngoài", async () => {
    vi.spyOn(ownerVaultService, "changeMember").mockRejectedValue({
      isAxiosError: true,
      response: { status: 403, data: { code: "PAID_TIER_REQUIRED" } },
    });
    renderAssets();
    let result: string | null = null;
    await act(async () => {
      result = await props().onMove([ASSET_FREE], PACKAGE_A);
    });
    expect(result).toContain("gói dịch vụ trả phí");
  });
});
