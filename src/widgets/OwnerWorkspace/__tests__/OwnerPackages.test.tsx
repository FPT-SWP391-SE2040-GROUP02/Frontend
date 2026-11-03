import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { useVaultAssets } from "@/features/assets/model/useVaultAssets";
import { useBeneficiaries } from "@/features/beneficiaries/model/useBeneficiaries";
import { usePlanSetup } from "@/features/plan-setup/model/usePlanSetup";
import { useOwnerPackages } from "@/features/vault-management/model/useOwnerVault";
import { ownerVaultService } from "@/features/vault-management/api/ownerVaultService";
import { OwnerPackages } from "../OwnerPackages";

vi.mock("@/features/assets/model/useVaultAssets", () => ({ useVaultAssets: vi.fn() }));
vi.mock("@/features/beneficiaries/model/useBeneficiaries", () => ({ useBeneficiaries: vi.fn() }));
vi.mock("@/features/plan-setup/model/usePlanSetup", () => ({ usePlanSetup: vi.fn() }));
vi.mock("@/features/vault-management/model/useOwnerVault", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/vault-management/model/useOwnerVault")>()),
  useOwnerPackages: vi.fn(),
}));
vi.mock("../PackageDialog", () => ({
  PackageDialog: ({ existing }: { existing?: { name: string } }) => (
    <div role="dialog">{existing ? `Hộp thoại sửa ${existing.name}` : "Hộp thoại tạo gói"}</div>
  ),
}));

const VAULT_ID = "11111111-1111-4111-8111-111111111111";
const PERSON = "b0000000-0000-4000-8000-000000000001";

function ids(count: number, prefix = "a"): string[] {
  const list: string[] = [];
  for (let n = 1; n <= count; n += 1) {
    list.push(`${prefix}0000000-0000-4000-8000-${String(n).padStart(12, "0")}`);
  }
  return list;
}

const ASSETS = ids(7);
const READY = {
  id: "c0000000-0000-4000-8000-000000000001",
  vaultId: VAULT_ID,
  name: "Gói cho vợ",
  description: null,
  status: "READY",
  assetIds: ASSETS,
  beneficiaryIds: [PERSON],
  etag: "etag-ready",
  missingRequirements: [],
};
const NO_PERSON = {
  id: "c0000000-0000-4000-8000-000000000002",
  vaultId: VAULT_ID,
  name: "Gói cho các con",
  description: null,
  status: "DRAFT",
  assetIds: [ASSETS[0]],
  beneficiaryIds: [],
  etag: "etag-2",
  missingRequirements: ["NO_DESIGNATION"],
};
const EMPTY = {
  id: "c0000000-0000-4000-8000-000000000003",
  vaultId: VAULT_ID,
  name: "Gói trống",
  description: null,
  status: "DRAFT",
  assetIds: [],
  beneficiaryIds: [],
  etag: "etag-3",
  missingRequirements: ["NO_ASSET", "NO_DESIGNATION"],
};

function listResult(items: unknown[]) {
  return {
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
    data: { items, hasNextPage: false },
  };
}

let client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  accessTokenMemory.set("owner-packages-fixture");
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.mocked(useOwnerPackages).mockReturnValue(listResult([READY, NO_PERSON, EMPTY]) as never);
  vi.mocked(useVaultAssets).mockReturnValue(
    listResult(
      ASSETS.map((id, index) => ({ id, name: `Tài sản ${index + 1}`, kind: "TEXT" })),
    ) as never,
  );
  vi.mocked(useBeneficiaries).mockReturnValue(
    listResult([
      {
        id: PERSON,
        fullName: "Nguyễn Thị Lan",
        citizenIdLast4: "4821",
        dateOfBirth: "1990-05-20",
        email: "lan@example.test",
        phone: "0901234567",
      },
    ]) as never,
  );
  vi.mocked(usePlanSetup).mockReturnValue({ data: { planStatus: "ACTIVE" } } as never);
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function renderPackages() {
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <OwnerPackages vaultId={VAULT_ID} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("màn Gói bàn giao", () => {
  it("thẻ gói sẵn sàng: ba tên tài sản đầu, số còn lại, người nhận và lối sang màn Tài sản", () => {
    renderPackages();
    const card = screen.getByRole("region", { name: "Gói cho vợ" });
    expect(card).toHaveTextContent("Sẵn sàng");
    expect(card).toHaveTextContent("7 tài sản trong gói");
    expect(card).toHaveTextContent("Tài sản 1");
    expect(card).toHaveTextContent("Tài sản 3");
    expect(card).not.toHaveTextContent("Tài sản 4");
    expect(card).toHaveTextContent("và 4 tài sản khác");
    // Người nhận chỉ hiện thành chồng ô tròn chữ cái đầu; tên và thông tin chỉ hiện khi bấm vào chồng đó.
    expect(
      screen.getByRole("button", { name: "Xem thông tin 1 người nhận của Gói cho vợ" }),
    ).toHaveTextContent("N");
    expect(card).not.toHaveTextContent("Nguyễn Thị Lan");
    expect(
      screen.getByRole("link", { name: "Mở màn Tài sản, lọc sẵn Gói cho vợ" }),
    ).toHaveAttribute("href", `/dashboard/assets?package=${READY.id}`);
  });

  it("mỗi thẻ có ba nút Sửa, Đổi tên và Xóa", () => {
    renderPackages();
    for (const name of ["Gói cho vợ", "Gói cho các con", "Gói trống"]) {
      expect(screen.getByRole("button", { name: `Sửa ${name}` })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: `Đổi tên ${name}` })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: `Xóa ${name}` })).toBeInTheDocument();
    }
  });

  it("gói thiếu gì thì nói rõ và có nút làm tiếp", () => {
    renderPackages();
    const noPerson = screen.getByRole("region", { name: "Gói cho các con" });
    expect(noPerson).toHaveTextContent("Chưa sẵn sàng");
    expect(noPerson).toHaveTextContent("Còn thiếu người nhận");
    expect(noPerson).toHaveTextContent("Chưa có ai");
    const empty = screen.getByRole("region", { name: "Gói trống" });
    expect(empty).toHaveTextContent("Gói này còn trống");
    expect(screen.getAllByRole("button", { name: "Chọn người nhận" })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Thêm tài sản" })).toBeInTheDocument();
  });

  it("Sửa, Chọn người nhận và Tạo gói bàn giao mở hộp thoại tick chọn", () => {
    renderPackages();
    fireEvent.click(screen.getByRole("button", { name: "Sửa Gói cho vợ" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Hộp thoại sửa Gói cho vợ");
    cleanup();
    renderPackages();
    fireEvent.click(screen.getAllByRole("button", { name: "Chọn người nhận" })[0]);
    expect(screen.getByRole("dialog")).toHaveTextContent("Hộp thoại sửa Gói cho các con");
    cleanup();
    renderPackages();
    fireEvent.click(screen.getByRole("button", { name: "Tạo gói bàn giao" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Hộp thoại tạo gói");
  });

  it("đổi tên chỉ gửi tên mới kèm etag hiện tại", async () => {
    const update = vi
      .spyOn(ownerVaultService, "updatePackage")
      .mockResolvedValue({ id: READY.id } as never);
    renderPackages();
    fireEvent.click(screen.getByRole("button", { name: "Đổi tên Gói cho vợ" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Đổi tên gói bàn giao");
    fireEvent.change(screen.getByLabelText("Tên gói bàn giao"), {
      target: { value: "Gói vợ yêu" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(VAULT_ID, READY.id, {
        name: "Gói vợ yêu",
        etag: "etag-ready",
      }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("xóa gói: hỏi lại rồi mới gọi Backend", async () => {
    const remove = vi
      .spyOn(ownerVaultService, "removePackage")
      .mockResolvedValue({ id: EMPTY.id } as never);
    renderPackages();
    fireEvent.click(screen.getByRole("button", { name: "Xóa Gói trống" }));
    expect(remove).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toHaveTextContent("không khôi phục được");
    fireEvent.click(screen.getByRole("button", { name: "Xóa gói" }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith(VAULT_ID, EMPTY.id, false));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("xóa làm kế hoạch về Nháp: hỏi đồng ý rồi mới gửi lại kèm xác nhận", async () => {
    const remove = vi
      .spyOn(ownerVaultService, "removePackage")
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 409, data: { code: "PLAN_DEACTIVATION_CONFIRMATION_REQUIRED" } },
      })
      .mockResolvedValue({ id: READY.id } as never);
    renderPackages();
    fireEvent.click(screen.getByRole("button", { name: "Xóa Gói cho vợ" }));
    fireEvent.click(screen.getByRole("button", { name: "Xóa gói" }));
    expect(await screen.findByText(/kế hoạch sẽ quay về Nháp/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Đồng ý, xóa gói" }));
    await waitFor(() => expect(remove).toHaveBeenLastCalledWith(VAULT_ID, READY.id, true));
  });

  it("bấm dấu + của gói rồi bấm một người là thêm ngay vào gói", async () => {
    const change = vi.spyOn(ownerVaultService, "changeMember").mockResolvedValue({} as never);
    renderPackages();
    fireEvent.click(screen.getByRole("button", { name: "Thêm người nhận vào Gói cho các con" }));
    expect(await screen.findByText("CCCD ****4821")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /Thêm Nguyễn Thị Lan vào Gói cho các con/ }),
    );
    await waitFor(() =>
      expect(change).toHaveBeenCalledWith(VAULT_ID, NO_PERSON.id, "beneficiaries", PERSON, true),
    );
  });

  it("bấm vào chồng ô tròn thì hiện thông tin các người nhận và nút Gỡ từng người", async () => {
    const change = vi.spyOn(ownerVaultService, "changeMember").mockResolvedValue({} as never);
    renderPackages();
    fireEvent.click(
      screen.getByRole("button", { name: "Xem thông tin 1 người nhận của Gói cho vợ" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Người nhận của Gói cho vợ" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Nguyễn Thị Lan")).toBeInTheDocument();
    expect(screen.getByText(/CCCD \*\*\*\*4821 · Sinh 20\/05\/1990/)).toBeInTheDocument();
    expect(screen.getByText("lan@example.test")).toBeInTheDocument();
    expect(screen.getByText("0901234567")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Gỡ Nguyễn Thị Lan khỏi Gói cho vợ" }));
    await waitFor(() =>
      expect(change).toHaveBeenCalledWith(
        VAULT_ID,
        READY.id,
        "beneficiaries",
        PERSON,
        false,
        false,
      ),
    );
  });

  it("nhiều người nhận thì chồng ô tròn chỉ hiện bốn ô rồi gộp phần còn lại thành +N", () => {
    const crowd = ids(6, "b");
    vi.mocked(useOwnerPackages).mockReturnValue(
      listResult([{ ...READY, beneficiaryIds: crowd }]) as never,
    );
    vi.mocked(useBeneficiaries).mockReturnValue(
      listResult(
        crowd.map((id, index) => ({
          id,
          fullName: `Người nhận ${index + 1}`,
          citizenIdLast4: "1000",
          dateOfBirth: "1990-01-01",
          email: null,
          phone: null,
        })),
      ) as never,
    );
    renderPackages();
    const stack = screen.getByRole("button", { name: "Xem thông tin 6 người nhận của Gói cho vợ" });
    expect(stack).toHaveTextContent("+2");
  });

  it("gỡ người nhận làm kế hoạch về Nháp: hỏi đồng ý rồi gửi lại kèm xác nhận", async () => {
    const change = vi
      .spyOn(ownerVaultService, "changeMember")
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 409, data: { code: "PLAN_DEACTIVATION_CONFIRMATION_REQUIRED" } },
      })
      .mockResolvedValue({} as never);
    renderPackages();
    fireEvent.click(
      screen.getByRole("button", { name: "Xem thông tin 1 người nhận của Gói cho vợ" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Gỡ Nguyễn Thị Lan khỏi Gói cho vợ" }),
    );
    expect(await screen.findByText(/kế hoạch sẽ quay về Nháp/)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Đồng ý, gỡ Nguyễn Thị Lan khỏi Gói cho vợ" }),
    );
    await waitFor(() =>
      expect(change).toHaveBeenLastCalledWith(
        VAULT_ID,
        READY.id,
        "beneficiaries",
        PERSON,
        false,
        true,
      ),
    );
  });

  it("kế hoạch còn nháp thì có lối sang bước kích hoạt", () => {
    vi.mocked(usePlanSetup).mockReturnValue({ data: { planStatus: "DRAFT" } } as never);
    renderPackages();
    expect(screen.getByRole("link", { name: "Kích hoạt kế hoạch" })).toHaveAttribute(
      "href",
      "/setup?step=activate",
    );
  });

  it("chưa có gói nào thì mời tạo gói đầu tiên", () => {
    vi.mocked(useOwnerPackages).mockReturnValue(listResult([]) as never);
    renderPackages();
    expect(screen.getByText("Bạn chưa có gói bàn giao nào")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tạo gói bàn giao đầu tiên" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Hộp thoại tạo gói");
  });
});
