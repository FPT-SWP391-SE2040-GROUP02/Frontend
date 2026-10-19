import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DocumentCheckPanel } from "../DocumentCheckPanel";

afterEach(cleanup);

/** Render panel mẫu với router cục bộ; không tạo request hoặc tải dữ liệu thật. */
function setup() {
  render(
    <MemoryRouter>
      <DocumentCheckPanel />
    </MemoryRouter>,
  );
  return screen.getByLabelText("Chọn ảnh căn cước Mặt trước");
}

describe("Document preview file selection", () => {
  it("keeps the two document sides independent", () => {
    const front = setup();
    fireEvent.change(front, {
      target: { files: [new File(["sample"], "front.png", { type: "image/png" })] },
    });
    expect(screen.getByText(/front.png/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mặt sau" }));
    expect(screen.getByText("Chưa chọn ảnh")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mặt trước" }));
    expect(screen.getByText(/front.png/)).toBeInTheDocument();
  });
  it("rejects an invalid replacement and disables reading the previous image", () => {
    const input = setup();
    fireEvent.change(input, {
      target: { files: [new File(["sample"], "front.png", { type: "image/png" })] },
    });
    fireEvent.change(input, {
      target: { files: [new File(["sample"], "document.pdf", { type: "application/pdf" })] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("không quá 8 MB");
    expect(screen.getByRole("button", { name: "Đọc thông tin" })).toBeDisabled();
  });
  it("applies the same validation to dropped files", () => {
    const input = setup();
    const dropArea = input.closest("label")?.parentElement;
    if (!dropArea) throw new Error("Missing document drop area");
    fireEvent.drop(dropArea, {
      dataTransfer: { files: [new File(["sample"], "dropped.webp", { type: "image/webp" })] },
    });
    expect(screen.getByText(/dropped.webp/)).toBeInTheDocument();
    fireEvent.drop(dropArea, {
      dataTransfer: { files: [new File(["sample"], "invalid.txt", { type: "text/plain" })] },
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
  it("rejects images larger than the limit", () => {
    const input = setup();
    const file = new File([new Uint8Array(8 * 1024 * 1024 + 1)], "large.png", {
      type: "image/png",
    });
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đọc thông tin" })).toBeDisabled();
  });
});
