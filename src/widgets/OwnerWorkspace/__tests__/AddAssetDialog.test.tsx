import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { confirmVaultPin } from "@/shared/api/vaultPin";
import { backendAssetService } from "@/features/assets/api/backendAssetService";
import { planSetupService } from "@/features/plan-setup/api/planSetupService";
import { AddAssetDialog } from "../AddAssetDialog";

vi.mock("@/shared/api/vaultPin", () => ({ confirmVaultPin: vi.fn() }));
vi.mock("@/features/assets/api/backendAssetService", () => ({
  backendAssetService: { createText: vi.fn(), upload: vi.fn() },
}));

const VAULT_ID = "11111111-1111-4111-8111-111111111111";

function renderDialog(onClose = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <AddAssetDialog
        vaultId={VAULT_ID}
        remainingBytes={1024 * 1024}
        packages={[{ id: "pkg-1", name: "Giấy tờ gia đình" }]}
        onClose={onClose}
      />
    </QueryClientProvider>,
  );
  return { onClose, user: userEvent.setup() };
}

const next = () => screen.getByRole("button", { name: "Tiếp tục" });

beforeEach(() => {
  accessTokenMemory.set("add-asset-fixture");
  vi.mocked(confirmVaultPin).mockReset();
  vi.mocked(backendAssetService.createText).mockReset();
});
afterEach(() => {
  cleanup();
  accessTokenMemory.clear();
});

describe("Thêm tài sản theo bốn bước", () => {
  it("mở ở bước chọn loại: có hai lựa chọn, chưa có ô nhập và chưa có nút Quay lại", () => {
    renderDialog();
    const group = screen.getByRole("radiogroup", { name: "Loại tài sản" });
    expect(within(group).getAllByRole("radio")).toHaveLength(2);
    expect(within(group).getByRole("radio", { name: /Ghi chú bí mật/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.queryByRole("textbox", { name: /Tên tài sản/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quay lại" })).not.toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Các bước thêm tài sản" })).toBeInTheDocument();
  });

  it("chưa nhập tên thì ở lại bước chi tiết và báo lỗi", async () => {
    const { user } = renderDialog();
    await user.click(next());
    expect(screen.getByRole("textbox", { name: /Tên tài sản/ })).toBeVisible();
    await user.click(next());
    expect(screen.getByRole("alert")).toHaveTextContent("Nhập tên tài sản.");
    expect(screen.queryByRole("combobox", { name: "Gói bàn giao" })).not.toBeInTheDocument();
  });

  it("chọn Tệp tải lên thì bước chi tiết hiện ô chọn tệp thay cho nội dung bí mật", async () => {
    const { user } = renderDialog();
    await user.click(screen.getByRole("radio", { name: /Tệp tải lên/ }));
    await user.click(next());
    expect(screen.getByLabelText(/Tệp tài sản/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Nội dung bí mật/)).not.toBeInTheDocument();
  });

  it("đi hết các bước: bước xem lại tóm tắt đúng, không lộ nội dung bí mật; quay lại vẫn giữ dữ liệu", async () => {
    const { user } = renderDialog();
    await user.click(next());
    await user.type(screen.getByRole("textbox", { name: /Tên tài sản/ }), "Ví MoMo");
    await user.type(screen.getByLabelText(/Nội dung bí mật/), "matkhau1");
    await user.click(next());
    await user.selectOptions(screen.getByRole("combobox", { name: "Gói bàn giao" }), "pkg-1");
    await user.click(next());

    const review = screen.getByRole("region", { name: "Xem lại" });
    expect(within(review).getByText("Ví MoMo")).toBeInTheDocument();
    expect(within(review).getByText("Giấy tờ gia đình")).toBeInTheDocument();
    expect(within(review).getByText("Đã nhập 8 ký tự, sẽ được mã hóa")).toBeInTheDocument();
    expect(within(review).queryByText(/matkhau1/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xác nhận PIN và lưu" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tiếp tục" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Quay lại" }));
    await user.click(screen.getByRole("button", { name: "Quay lại" }));
    expect(screen.getByRole("textbox", { name: /Tên tài sản/ })).toHaveValue("Ví MoMo");
  });

  it("huỷ ở bước PIN thì không lưu gì", async () => {
    vi.mocked(confirmVaultPin).mockResolvedValue({ confirmed: false } as never);
    const { user } = renderDialog();
    await user.click(next());
    await user.type(screen.getByRole("textbox", { name: /Tên tài sản/ }), "Sổ tiết kiệm");
    await user.type(screen.getByLabelText(/Nội dung bí mật/), "ghi chú");
    await user.click(next());
    await user.click(next());
    await user.click(screen.getByRole("button", { name: "Xác nhận PIN và lưu" }));
    await waitFor(() => expect(confirmVaultPin).toHaveBeenCalled());
    expect(backendAssetService.createText).not.toHaveBeenCalled();
  });

  it("nhập đúng PIN thì lưu tài sản đúng dữ liệu rồi đóng hộp thoại", async () => {
    vi.mocked(confirmVaultPin).mockResolvedValue({ confirmed: true } as never);
    vi.mocked(backendAssetService.createText).mockResolvedValue({ id: "asset-1" } as never);
    const { user, onClose } = renderDialog();
    await user.click(next());
    await user.type(screen.getByRole("textbox", { name: /Tên tài sản/ }), "Sổ tiết kiệm");
    await user.type(screen.getByLabelText(/Nội dung bí mật/), "ghi chú");
    await user.click(next());
    await user.click(next());
    await user.click(screen.getByRole("button", { name: "Xác nhận PIN và lưu" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(backendAssetService.createText).toHaveBeenCalledWith(VAULT_ID, {
      name: "Sổ tiết kiệm",
      description: "",
      content: "ghi chú",
    });
  });

  describe("người nhận và người thực hiện", () => {
    /** Đi tới bước "Gói và người" với một tài sản hợp lệ rồi thêm một người. */
    async function openPersonCard() {
      const rendered = renderDialog();
      const { user } = rendered;
      await user.click(next());
      await user.type(screen.getByRole("textbox", { name: /Tên tài sản/ }), "Sổ tiết kiệm");
      await user.type(screen.getByLabelText(/Nội dung bí mật/), "ghi chú");
      await user.click(next());
      await user.click(screen.getByRole("button", { name: "Thêm người" }));
      return rendered;
    }

    it("mỗi người chỉ chọn một vai, nút vai nằm trên ô họ tên", async () => {
      await openPersonCard();
      const group = screen.getByRole("group", { name: "Vai trò (chọn một)" });
      const beneficiary = within(group).getByRole("button", { name: "Người nhận" });
      const executor = within(group).getByRole("button", { name: "Người thực hiện (Executor)" });
      expect(beneficiary).toHaveAttribute("aria-pressed", "true");
      expect(executor).toHaveAttribute("aria-pressed", "false");
      const name = screen.getByRole("textbox", { name: "Họ và tên" });
      expect(group.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

      const user = userEvent.setup();
      await user.click(executor);
      expect(executor).toHaveAttribute("aria-pressed", "true");
      expect(beneficiary).toHaveAttribute("aria-pressed", "false");
    });

    it("người thực hiện không có ô họ tên, ngày sinh, CCCD; đổi lại người nhận thì hiện lại", async () => {
      await openPersonCard();
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "Người thực hiện (Executor)" }));
      expect(screen.queryByRole("textbox", { name: "Họ và tên" })).not.toBeInTheDocument();
      expect(screen.queryByRole("textbox", { name: "Số CCCD" })).not.toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "Email" })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Người nhận" }));
      expect(screen.getByRole("textbox", { name: "Họ và tên" })).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "Số CCCD" })).toBeInTheDocument();
    });

    it("lưu người thực hiện chỉ cần email: gửi lời mời không gắn hồ sơ người nhận", async () => {
      vi.mocked(confirmVaultPin).mockResolvedValue({ confirmed: true } as never);
      vi.mocked(backendAssetService.createText).mockResolvedValue({ id: "asset-1" } as never);
      vi.spyOn(planSetupService, "checkExecutorAccount").mockResolvedValue({
        accountExists: false,
      } as never);
      const invite = vi.spyOn(planSetupService, "invite").mockResolvedValue({} as never);
      const { onClose } = await openPersonCard();
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "Người thực hiện (Executor)" }));
      await user.type(screen.getByRole("textbox", { name: "Email" }), "executor@example.test");
      await user.click(next());
      await user.click(screen.getByRole("button", { name: "Xác nhận PIN và lưu" }));
      await waitFor(() => expect(onClose).toHaveBeenCalled());
      expect(invite).toHaveBeenCalledWith(VAULT_ID, {
        email: "executor@example.test",
        beneficiaryId: null,
      });
    });

    it("chưa nhập email thì ở lại bước và báo lỗi, không đòi họ tên của người thực hiện", async () => {
      const { user } = await openPersonCard();
      await user.click(screen.getByRole("button", { name: "Người thực hiện (Executor)" }));
      await user.click(next());
      expect(screen.getByRole("alert")).toHaveTextContent("Nhập email hợp lệ");
    });
  });
});
