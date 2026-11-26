import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocumentPicker } from "../DocumentPicker";

afterEach(cleanup);

function Harness({ reserved, disabled }: { reserved?: number; disabled?: boolean }) {
  const [files, setFiles] = useState<File[]>([]);
  return (
    <DocumentPicker
      label="Di chúc (bắt buộc)"
      files={files}
      onChange={setFiles}
      reserved={reserved}
      disabled={disabled}
    />
  );
}

function pdf(name = "di-chuc.pdf", size?: number) {
  const file = new File(["%PDF"], name, { type: "application/pdf" });
  if (size !== undefined) Object.defineProperty(file, "size", { value: size });
  return file;
}

function input() {
  return screen.getByLabelText(/^Di chúc/);
}

function drop(files: File[]) {
  fireEvent.drop(input().closest("label") as HTMLLabelElement, {
    dataTransfer: { files, types: ["Files"] },
  });
}

describe("DocumentPicker", () => {
  it("kéo thả thêm tệp thành thẻ, bỏ được bằng nút", async () => {
    render(<Harness />);
    expect(screen.getByText("Chưa có tệp")).toBeInTheDocument();

    drop([pdf()]);

    expect(screen.getByText("1 tệp")).toBeInTheDocument();
    expect(screen.getByText("Sẵn sàng gửi")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Đã chọn di-chuc.pdf");

    await userEvent.click(screen.getByRole("button", { name: "Bỏ tệp di-chuc.pdf" }));
    expect(screen.getByText("Chưa có tệp")).toBeInTheDocument();
  });

  it("tệp quá 10 MB hoặc sai loại bị chặn ngay, tệp hợp lệ vẫn được thêm", () => {
    render(<Harness />);

    drop([
      pdf("lon.pdf", 11 * 1024 * 1024),
      new File(["a"], "ghi-chu.txt", { type: "text/plain" }),
      pdf(),
    ]);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Tệp lon.pdf lớn hơn 10 MB.");
    expect(alert).toHaveTextContent("Tệp ghi-chu.txt không phải PDF hoặc ảnh.");
    expect(screen.getByText("1 tệp")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bỏ tệp lon.pdf" })).not.toBeInTheDocument();
  });

  it("tổng số tệp tính cả các ô khác, không vượt 10", () => {
    render(<Harness reserved={9} />);

    drop([pdf("mot.pdf"), pdf("hai.pdf")]);

    expect(screen.getByText("1 tệp")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Mỗi lần nộp tối đa 10 tệp.");
  });

  it("đang gửi thì không nhận tệp thả vào", () => {
    render(<Harness disabled />);

    drop([pdf()]);

    expect(screen.getByText("Chưa có tệp")).toBeInTheDocument();
  });

  it("nút xem trước mở hộp thoại của đúng tệp và đóng được", async () => {
    render(<Harness />);
    await userEvent.upload(input(), pdf());

    await userEvent.click(screen.getByRole("button", { name: "Xem trước di-chuc.pdf" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("di-chuc.pdf")).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole("button", { name: "Đóng" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
