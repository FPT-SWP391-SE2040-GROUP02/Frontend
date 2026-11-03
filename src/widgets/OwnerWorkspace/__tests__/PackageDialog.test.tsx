import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { useVaultAssets } from "@/features/assets/model/useVaultAssets";
import { useBeneficiaries } from "@/features/beneficiaries/model/useBeneficiaries";
import { useOwnerPackages } from "@/features/vault-management/model/useOwnerVault";
import { ownerVaultService } from "@/features/vault-management/api/ownerVaultService";
import { PackageDialog } from "../PackageDialog";

vi.mock("@/features/assets/model/useVaultAssets", () => ({ useVaultAssets: vi.fn() }));
vi.mock("@/features/beneficiaries/model/useBeneficiaries", () => ({ useBeneficiaries: vi.fn() }));
vi.mock("@/features/vault-management/model/useOwnerVault", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/vault-management/model/useOwnerVault")>()),
  useOwnerPackages: vi.fn(),
}));
vi.mock("@/features/beneficiaries/ui/BeneficiaryForm", () => ({
  BeneficiaryForm: () => <div>Form người nhận mới</div>,
}));

const VAULT_ID = "11111111-1111-4111-8111-111111111111";
const PACKAGE_ID = "99999999-9999-4999-8999-999999999999";
const ASSET_FILE = "a0000000-0000-4000-8000-000000000001";
const ASSET_TEXT = "a0000000-0000-4000-8000-000000000002";
const ASSET_TAKEN = "a0000000-0000-4000-8000-000000000003";
const PERSON_ANH = "b0000000-0000-4000-8000-000000000001";
const PERSON_NAM = "b0000000-0000-4000-8000-000000000002";

function listResult(items: unknown[]) {
  return { isPending: false, isError: false, refetch: vi.fn(), data: { items } };
}

let client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  accessTokenMemory.set("package-dialog-fixture");
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.mocked(useVaultAssets).mockReturnValue(
    listResult([
      { id: ASSET_TAKEN, name: "Lời nhắn cho các con", kind: "TEXT" },
      { id: ASSET_FILE, name: "Hợp đồng bảo hiểm", kind: "FILE" },
      { id: ASSET_TEXT, name: "Danh sách tài khoản", kind: "TEXT" },
    ]) as never,
  );
  vi.mocked(useBeneficiaries).mockReturnValue(
    listResult([
      { id: PERSON_ANH, fullName: "Nguyễn Minh Anh", citizenIdLast4: "4821" },
      { id: PERSON_NAM, fullName: "Nguyễn Hoàng Nam", citizenIdLast4: "1093" },
    ]) as never,
  );
  vi.mocked(useOwnerPackages).mockReturnValue(
    listResult([
      {
        id: "c0000000-0000-4000-8000-000000000001",
        name: "Gói cho vợ",
        status: "READY",
        assetIds: [ASSET_TAKEN],
        beneficiaryIds: [],
      },
    ]) as never,
  );
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function renderDialog(onClose = vi.fn()) {
  render(
    <QueryClientProvider client={client}>
      <PackageDialog vaultId={VAULT_ID} onClose={onClose} />
    </QueryClientProvider>,
  );
  return onClose;
}

function assetBox() {
  return within(screen.getByRole("region", { name: "Tài sản trong gói" }));
}

function personBox() {
  return within(screen.getByRole("region", { name: "Người nhận trong gói" }));
}

describe("hộp thoại tạo gói bàn giao", () => {
  it("xếp tài sản chưa thuộc gói lên đầu, khóa tài sản đang ở gói khác", () => {
    renderDialog();
    expect(screen.getByText("2 tài sản chưa thuộc gói nào — xếp lên đầu")).toBeInTheDocument();
    const boxes = assetBox().getAllByRole("checkbox");
    expect(boxes).toHaveLength(3);
    expect(boxes[0]).toBeEnabled();
    expect(boxes[1]).toBeEnabled();
    expect(boxes[2]).toBeDisabled();
    expect(assetBox().getByText("Đang ở Gói cho vợ")).toBeInTheDocument();
    expect(personBox().getByText("CCCD ****4821")).toBeInTheDocument();
  });

  it("chọn tất cả chỉ chọn tài sản còn trống, dòng tóm tắt đổi theo lựa chọn", () => {
    renderDialog();
    expect(screen.getByRole("status", { name: "" })).toHaveTextContent(
      "Gói sẽ ở trạng thái Nháp vì còn thiếu tài sản và người nhận",
    );
    fireEvent.click(screen.getByRole("button", { name: "Chọn tất cả" }));
    expect(screen.getByText(/đã chọn 2/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bỏ chọn tất cả" })).toBeInTheDocument();
    expect(screen.getByText(/còn thiếu người nhận/)).toBeInTheDocument();
    fireEvent.click(personBox().getByRole("checkbox", { name: /Nguyễn Minh Anh/ }));
    expect(
      screen.getByText(/Có 2 tài sản và 1 người nhận, nên gói sẽ ở trạng thái/),
    ).toBeInTheDocument();
  });

  it("tạo gói rồi gắn từng tài sản và người nhận đã chọn", async () => {
    const create = vi
      .spyOn(ownerVaultService, "createPackage")
      .mockResolvedValue({ id: PACKAGE_ID } as never);
    const attach = vi.spyOn(ownerVaultService, "changeMember").mockResolvedValue({} as never);
    const onClose = renderDialog();
    fireEvent.change(screen.getByLabelText("Tên gói bàn giao"), {
      target: { value: "Gói cho các con" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Chọn tất cả" }));
    fireEvent.click(personBox().getByRole("checkbox", { name: /Nguyễn Minh Anh/ }));
    fireEvent.click(screen.getByRole("button", { name: "Tạo gói" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(create).toHaveBeenCalledWith(VAULT_ID, { name: "Gói cho các con", description: "" });
    expect(attach).toHaveBeenCalledTimes(3);
    expect(attach).toHaveBeenCalledWith(VAULT_ID, PACKAGE_ID, "assets", ASSET_FILE, true);
    expect(attach).toHaveBeenCalledWith(VAULT_ID, PACKAGE_ID, "assets", ASSET_TEXT, true);
    expect(attach).toHaveBeenCalledWith(VAULT_ID, PACKAGE_ID, "beneficiaries", PERSON_ANH, true);
  });

  it("thiếu tên thì báo lỗi và không gọi Backend", () => {
    const create = vi.spyOn(ownerVaultService, "createPackage");
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Tạo gói" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it("lỗi giữa chừng giữ gói đã tạo, bấm lại chỉ gắn tiếp và không tạo gói thứ hai", async () => {
    const create = vi
      .spyOn(ownerVaultService, "createPackage")
      .mockResolvedValue({ id: PACKAGE_ID } as never);
    const attach = vi
      .spyOn(ownerVaultService, "changeMember")
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 409, data: { code: "ASSET_ALREADY_IN_CONTAINER" } },
      })
      .mockResolvedValue({} as never);
    const onClose = renderDialog();
    fireEvent.change(screen.getByLabelText("Tên gói bàn giao"), { target: { value: "Gói mới" } });
    fireEvent.click(assetBox().getAllByRole("checkbox")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Tạo gói" }));
    expect(await screen.findByText(/Gói đã được tạo/)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Tạo gói" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(create).toHaveBeenCalledTimes(1);
    expect(attach).toHaveBeenCalledTimes(2);
  });

  describe("chỉnh sửa gói có sẵn", () => {
    const EXISTING = {
      id: "c0000000-0000-4000-8000-000000000009",
      vaultId: VAULT_ID,
      name: "Gói cho các con",
      description: "Mô tả cũ",
      status: "READY",
      assetIds: [ASSET_FILE],
      beneficiaryIds: [PERSON_ANH],
      etag: "etag-1",
      missingRequirements: [],
    };

    function renderEditing(onClose = vi.fn()) {
      // Danh sách gói của kho gồm cả gói đang sửa và gói khác đang giữ một tài sản.
      vi.mocked(useOwnerPackages).mockReturnValue(
        listResult([
          EXISTING,
          {
            id: "c0000000-0000-4000-8000-000000000001",
            name: "Gói cho vợ",
            status: "READY",
            assetIds: [ASSET_TAKEN],
            beneficiaryIds: [],
          },
        ]) as never,
      );
      render(
        <QueryClientProvider client={client}>
          <PackageDialog vaultId={VAULT_ID} existing={EXISTING as never} onClose={onClose} />
        </QueryClientProvider>,
      );
      return onClose;
    }

    it("nạp sẵn tên, mục và người nhận của gói; chỉ cho Lưu khi có thay đổi", () => {
      renderEditing();
      expect(screen.getByRole("heading", { name: "Chỉnh sửa bàn giao" })).toBeInTheDocument();
      expect(screen.getByLabelText("Tên gói bàn giao")).toHaveValue("Gói cho các con");
      const boxes = assetBox().getAllByRole("checkbox");
      expect(boxes[0]).toBeChecked();
      expect(boxes[1]).not.toBeChecked();
      expect(boxes[2]).toBeDisabled();
      expect(personBox().getByRole("checkbox", { name: /Nguyễn Minh Anh/ })).toBeChecked();
      expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled();
      fireEvent.click(boxes[1]);
      expect(screen.getByRole("button", { name: "Lưu" })).toBeEnabled();
    });

    it("lưu: đổi tên, gắn mục mới rồi mới gỡ mục bỏ tick", async () => {
      const update = vi
        .spyOn(ownerVaultService, "updatePackage")
        .mockResolvedValue({ id: EXISTING.id } as never);
      const attach = vi.spyOn(ownerVaultService, "changeMember").mockResolvedValue({} as never);
      const onClose = renderEditing();
      fireEvent.change(screen.getByLabelText("Tên gói bàn giao"), {
        target: { value: "Gói mới tên" },
      });
      fireEvent.click(assetBox().getAllByRole("checkbox")[0]);
      fireEvent.click(assetBox().getAllByRole("checkbox")[1]);
      fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
      expect(update).toHaveBeenCalledWith(VAULT_ID, EXISTING.id, {
        name: "Gói mới tên",
        description: "Mô tả cũ",
        etag: "etag-1",
      });
      expect(attach).toHaveBeenNthCalledWith(1, VAULT_ID, EXISTING.id, "assets", ASSET_TEXT, true);
      expect(attach).toHaveBeenNthCalledWith(
        2,
        VAULT_ID,
        EXISTING.id,
        "assets",
        ASSET_FILE,
        false,
        false,
      );
    });

    it("gỡ mục làm kế hoạch về Nháp: hỏi đồng ý rồi mới gửi lại kèm xác nhận", async () => {
      const attach = vi
        .spyOn(ownerVaultService, "changeMember")
        .mockRejectedValueOnce({
          isAxiosError: true,
          response: { status: 409, data: { code: "PLAN_DEACTIVATION_CONFIRMATION_REQUIRED" } },
        })
        .mockResolvedValue({} as never);
      const onClose = renderEditing();
      fireEvent.click(personBox().getByRole("checkbox", { name: /Nguyễn Minh Anh/ }));
      fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
      expect(await screen.findByText(/kế hoạch sẽ quay về Nháp/)).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Đồng ý, tiếp tục" }));
      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
      expect(attach).toHaveBeenLastCalledWith(
        VAULT_ID,
        EXISTING.id,
        "beneficiaries",
        PERSON_ANH,
        false,
        true,
      );
    });

    it("xóa gói: hỏi lại rồi mới gọi Backend", async () => {
      const remove = vi
        .spyOn(ownerVaultService, "removePackage")
        .mockResolvedValue({ id: EXISTING.id } as never);
      const onClose = renderEditing();
      fireEvent.click(screen.getByRole("button", { name: "Xóa gói bàn giao" }));
      expect(remove).not.toHaveBeenCalled();
      expect(screen.getByText(/không khôi phục được/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Xóa gói" }));
      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
      expect(remove).toHaveBeenCalledWith(VAULT_ID, EXISTING.id, false);
    });
  });

  it("Thêm người nhận mới mở form tạo hồ sơ ngay trong hộp thoại", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Thêm người nhận mới" }));
    expect(screen.getByText("Form người nhận mới")).toBeInTheDocument();
  });
});
