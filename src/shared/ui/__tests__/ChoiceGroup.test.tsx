import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChoiceGroup, type ChoiceOption } from "../ChoiceGroup";

type Kind = "crypto" | "account" | "document";
const options: ChoiceOption<Kind>[] = [
  { value: "crypto", label: "Ví tiền mã hóa", description: "Cụm từ khôi phục" },
  { value: "account", label: "Tài khoản số" },
  { value: "document", label: "Tài liệu", disabled: true },
];

describe("ChoiceGroup", () => {
  it("là radiogroup, đánh dấu lựa chọn hiện tại và chỉ một nút nằm trong thứ tự Tab", () => {
    render(<ChoiceGroup options={options} value="account" onChange={() => {}} ariaLabel="Loại" />);
    expect(screen.getByRole("radiogroup", { name: "Loại" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Tài khoản số/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: /Ví tiền mã hóa/ })).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("radio", { name: /Tài khoản số/ })).toHaveAttribute("tabindex", "0");
  });

  it("chưa chọn gì thì lựa chọn bật đầu tiên nhận Tab", () => {
    render(<ChoiceGroup options={options} value={null} onChange={() => {}} ariaLabel="Loại" />);
    expect(screen.getByRole("radio", { name: /Ví tiền mã hóa/ })).toHaveAttribute("tabindex", "0");
  });

  it("bấm chọn gọi onChange; mũi tên đi tới lựa chọn kế và bỏ qua lựa chọn bị khóa", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ChoiceGroup options={options} value="crypto" onChange={onChange} ariaLabel="Loại" />);
    await user.click(screen.getByRole("radio", { name: /Tài khoản số/ }));
    expect(onChange).toHaveBeenLastCalledWith("account");

    screen.getByRole("radio", { name: /Tài khoản số/ }).focus();
    await user.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith("crypto");
    expect(screen.getByRole("radio", { name: /Tài liệu/ })).toBeDisabled();
  });

  it("kiểu phân đoạn không hiện mô tả; kiểu thẻ hiện mô tả", () => {
    const { rerender } = render(
      <ChoiceGroup options={options} value="crypto" onChange={() => {}} ariaLabel="Loại" />,
    );
    expect(screen.getByText("Cụm từ khôi phục")).toBeInTheDocument();
    rerender(
      <ChoiceGroup
        options={options}
        value="crypto"
        onChange={() => {}}
        ariaLabel="Loại"
        variant="segmented"
      />,
    );
    expect(screen.queryByText("Cụm từ khôi phục")).not.toBeInTheDocument();
  });

  it("disabled khóa toàn nhóm", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ChoiceGroup
        options={options}
        value="crypto"
        onChange={onChange}
        ariaLabel="Loại"
        disabled
      />,
    );
    await user.click(screen.getByRole("radio", { name: /Tài khoản số/ }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
