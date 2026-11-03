import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Stepper, type StepperStep } from "../Stepper";

const steps: StepperStep[] = [
  { id: "a", label: "Thêm tài sản", state: "done" },
  { id: "b", label: "Xác minh", state: "current" },
  { id: "c", label: "Chọn hạng", state: "blocked" },
  { id: "d", label: "Kích hoạt", state: "unknown" },
];

describe("Stepper", () => {
  it("kiểu ngang: đánh dấu bước hiện tại và đọc được trạng thái từng bước", () => {
    render(<Stepper steps={steps} ariaLabel="Các bước" />);
    const list = screen.getByRole("list", { name: "Các bước" });
    expect(list.querySelectorAll("li")).toHaveLength(4);
    expect(screen.getByText("Xác minh").closest("li")).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("Thêm tài sản").closest("li")).not.toHaveAttribute("aria-current");
    expect(screen.getByText("Xong")).toBeInTheDocument();
    expect(screen.getByText("Bị chặn")).toBeInTheDocument();
    expect(screen.getByText("Chưa kiểm tra được")).toBeInTheDocument();
  });

  it("kiểu ngang: hiện chữ trạng thái đổi theo màn khi showState bật", () => {
    render(
      <Stepper
        steps={steps}
        ariaLabel="Tiến trình"
        showState
        stateLabels={{ current: "Đang ở đây" }}
      />,
    );
    expect(screen.getByText("Đang ở đây")).toBeVisible();
  });

  it("kiểu dọc: mỗi bước là nút, bấm gọi onSelect và bước đang mở có aria-current", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <Stepper
        steps={steps}
        ariaLabel="Các bước"
        orientation="vertical"
        activeId="b"
        onSelect={onSelect}
      />,
    );
    const active = screen.getByRole("button", { name: /Xác minh/ });
    expect(active).toHaveAttribute("aria-current", "step");
    await user.click(screen.getByRole("button", { name: /Kích hoạt/ }));
    expect(onSelect).toHaveBeenCalledWith("d");
  });

  it("kiểu dọc không có onSelect thì không có nút", () => {
    render(<Stepper steps={steps} ariaLabel="Các bước" orientation="vertical" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("danh sách rỗng vẫn render, không lỗi", () => {
    render(<Stepper steps={[]} ariaLabel="Trống" />);
    expect(screen.getByRole("list", { name: "Trống" })).toBeEmptyDOMElement();
  });
});
