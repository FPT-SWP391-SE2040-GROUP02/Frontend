import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LegalDropzone } from "../LegalDropzone";
afterEach(cleanup);
describe("LegalDropzone", () => {
  it("khóa cả drop và input khi disabled", () => {
    const select = vi.fn();
    const { container } = render(<LegalDropzone disabled onFileSelect={select} />);
    const file = new File(["content"], "evidence.pdf", { type: "application/pdf" });
    fireEvent.drop(container.firstChild!, { dataTransfer: { files: [file] } });
    fireEvent.change(screen.getByLabelText("Chọn tài liệu pháp lý"), { target: { files: [file] } });
    expect(select).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).toBeDisabled();
  });
  it("chọn tệp và reset input để chọn lại cùng tệp", () => {
    const select = vi.fn();
    render(<LegalDropzone onFileSelect={select} />);
    const input = screen.getByLabelText("Chọn tài liệu pháp lý");
    const file = new File(["content"], "evidence.pdf");
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.change(input, { target: { files: [file] } });
    expect(select).toHaveBeenCalledTimes(2);
    expect(input).toHaveValue("");
  });
});
