import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SideDrawer } from "../SideDrawer";

describe("SideDrawer", () => {
  it("mở ra thì có tiêu đề, mô tả, nội dung và hàng nút cuối", () => {
    render(
      <SideDrawer
        open
        onOpenChange={() => {}}
        title="Thêm người nhận"
        description="Nhập thông tin để đối chiếu khi bàn giao."
        footer={<button type="button">Lưu</button>}
      >
        <p>Nội dung form</p>
      </SideDrawer>,
    );
    expect(screen.getByRole("dialog", { name: "Thêm người nhận" })).toBeInTheDocument();
    expect(screen.getByText("Nhập thông tin để đối chiếu khi bàn giao.")).toBeInTheDocument();
    expect(screen.getByText("Nội dung form")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lưu" })).toBeInTheDocument();
  });

  it("đóng bằng nút Đóng và bằng phím Esc", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SideDrawer open onOpenChange={onOpenChange} title="Chọn người nhận">
        <p>Danh sách</p>
      </SideDrawer>,
    );
    await user.click(screen.getByRole("button", { name: "Đóng" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    onOpenChange.mockClear();
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("đóng thì không vẽ gì", () => {
    render(
      <SideDrawer open={false} onOpenChange={() => {}} title="Ẩn">
        <p>Nội dung</p>
      </SideDrawer>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
