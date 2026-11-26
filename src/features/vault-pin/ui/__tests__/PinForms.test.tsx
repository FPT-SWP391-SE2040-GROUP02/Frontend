import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { vaultPinService } from "../../api/vaultPinService";
import { ChangePinForm, ForgotPinForm, SetPinForm } from "../PinForms";

vi.mock("../../api/vaultPinService", () => ({
  vaultPinService: { set: vi.fn(), change: vi.fn(), reset: vi.fn() },
}));

const VAULT = "11111111-1111-4111-8111-111111111111";
const STATUS = { isSet: true, isRequired: true, lockedUntil: null, attemptsRemaining: 5 };

beforeEach(() => {
  accessTokenMemory.set("test-token");
  vi.mocked(vaultPinService.set).mockResolvedValue(STATUS);
  vi.mocked(vaultPinService.change).mockResolvedValue(STATUS);
  vi.mocked(vaultPinService.reset).mockResolvedValue(STATUS);
});
afterEach(() => {
  cleanup();
  accessTokenMemory.clear();
  vi.clearAllMocks();
});

describe("SetPinForm", () => {
  it("rời ô trống thì chưa báo lỗi, không có bàn phím trên màn hình", async () => {
    const user = userEvent.setup();
    render(<SetPinForm vaultId={VAULT} onDone={vi.fn()} />);

    await user.click(screen.getByLabelText("Mã PIN mới"));
    await user.click(screen.getByLabelText("Nhập lại mã PIN"));
    await user.tab();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "1" })).not.toBeInTheDocument();
  });

  it("gõ liền 12 số: tự sang ô nhập lại, báo khớp rồi lưu", async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<SetPinForm vaultId={VAULT} onDone={onDone} />);

    await user.type(screen.getByLabelText("Mã PIN mới"), "482913");
    expect(screen.getByLabelText("Nhập lại mã PIN")).toHaveFocus();
    await user.keyboard("482913");
    expect(screen.getByText("Hai mã đã khớp.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Đặt mã PIN" }));

    await waitFor(() => expect(onDone).toHaveBeenCalledWith("482913", STATUS));
    expect(vaultPinService.set).toHaveBeenCalledWith(VAULT, {
      pin: "482913",
      confirmPin: "482913",
    });
  });

  it("mã dễ đoán báo ngay khi đủ số và con trỏ ở lại; sửa thì hết báo", async () => {
    const user = userEvent.setup();
    render(<SetPinForm vaultId={VAULT} onDone={vi.fn()} />);
    const pin = screen.getByLabelText("Mã PIN mới");

    await user.type(pin, "123456");
    expect(screen.getByRole("alert")).toHaveTextContent("Mã PIN quá dễ đoán.");
    expect(pin).toHaveFocus();
    await user.keyboard("{Backspace}");

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("nhập lại chưa khớp thì báo ngay và không gửi; đổi mã mới thì xóa ô nhập lại", async () => {
    const user = userEvent.setup();
    render(<SetPinForm vaultId={VAULT} onDone={vi.fn()} />);

    await user.type(screen.getByLabelText("Mã PIN mới"), "482913");
    await user.keyboard("482914");
    expect(screen.getByRole("alert")).toHaveTextContent("Mã PIN nhập lại chưa khớp.");
    await user.click(screen.getByRole("button", { name: "Đặt mã PIN" }));
    expect(vaultPinService.set).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Mã PIN mới"), "{Backspace}");
    expect(screen.getByLabelText("Nhập lại mã PIN")).toHaveValue("");
  });

  it("bấm gửi khi còn trống thì báo đúng 6 chữ số; chữ cái bị bỏ", async () => {
    const user = userEvent.setup();
    render(<SetPinForm vaultId={VAULT} onDone={vi.fn()} />);

    await user.type(screen.getByLabelText("Mã PIN mới"), "4a8");
    expect(screen.getByLabelText("Mã PIN mới")).toHaveValue("48");
    await user.click(screen.getByRole("button", { name: "Đặt mã PIN" }));

    expect(await screen.findByText("Mã PIN gồm đúng 6 chữ số.")).toBeInTheDocument();
    expect(vaultPinService.set).not.toHaveBeenCalled();
  });
});

describe("ChangePinForm và ForgotPinForm", () => {
  it("đổi PIN: gõ một mạch qua cả ba ô rồi lưu", async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<ChangePinForm vaultId={VAULT} onDone={onDone} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText("Mã PIN hiện tại"), "719305");
    expect(screen.getByLabelText("Mã PIN mới")).toHaveFocus();
    await user.keyboard("482913482913");
    await user.click(screen.getByRole("button", { name: "Đổi mã PIN" }));

    await waitFor(() => expect(onDone).toHaveBeenCalledWith(STATUS));
    expect(vaultPinService.change).toHaveBeenCalledWith(VAULT, {
      currentPin: "719305",
      newPin: "482913",
      confirmPin: "482913",
    });
  });

  it("quên PIN: thiếu mật khẩu thì báo, đủ thì đặt lại", async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<ForgotPinForm vaultId={VAULT} onDone={onDone} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText("Mã PIN mới"), "482913");
    await user.keyboard("482913");
    await user.click(screen.getByRole("button", { name: "Đặt lại mã PIN" }));
    expect(await screen.findByText("Vui lòng nhập mật khẩu tài khoản.")).toBeInTheDocument();
    expect(vaultPinService.reset).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Mật khẩu tài khoản"), "mat-khau-thu");
    await user.click(screen.getByRole("button", { name: "Đặt lại mã PIN" }));

    await waitFor(() => expect(onDone).toHaveBeenCalledWith("482913", STATUS));
  });
});
