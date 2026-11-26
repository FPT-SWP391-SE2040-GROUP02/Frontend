import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { RecordFileList } from "../RecordFileList";

const file = (fileName: string, contentType: string) => ({
  id: "11111111-1111-4111-8111-111111111111",
  kind: "",
  fileName,
  contentType,
  sizeBytes: 1024,
  createdAt: "2026-11-20T03:00:00+00:00",
});

afterEach(() => {
  cleanup();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

describe("Xem trước giấy tờ", () => {
  it("bấm Xem thì mở tệp PDF ngay trong trang, đóng hộp thì thu hồi địa chỉ tạm", async () => {
    accessTokenMemory.set("file-preview-fixture");
    const user = userEvent.setup();
    URL.createObjectURL = vi.fn(() => "blob:preview");
    URL.revokeObjectURL = vi.fn();
    const download = vi.fn().mockResolvedValue(new Blob(["%PDF"]));
    render(<RecordFileList files={[file("a.pdf", "application/pdf")]} download={download} />);

    await user.click(screen.getByRole("button", { name: "Xem a.pdf" }));
    expect(await screen.findByTitle("Nội dung a.pdf")).toHaveAttribute("src", "blob:preview");
    expect(download).toHaveBeenCalledTimes(1);

    await user.keyboard("{Escape}");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });

  it("gắn nhãn cho biết đâu là di chúc, đâu là giấy tờ chưa chia loại", () => {
    const will = { ...file("a.pdf", "application/pdf"), kind: "WILL" };
    const other = {
      ...file("b.pdf", "application/pdf"),
      id: "22222222-2222-4222-8222-222222222222",
      kind: "CLAIM_DOCUMENT",
    };
    render(<RecordFileList files={[will, other]} download={vi.fn()} />);

    expect(screen.getByText("Di chúc")).toBeInTheDocument();
    expect(screen.getByText("Giấy tờ")).toBeInTheDocument();
  });

  it("loại tệp ngoài danh sách cho phép thì chỉ tải về, không có nút Xem", () => {
    render(<RecordFileList files={[file("a.html", "text/html")]} download={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Xem a.html" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tải về a.html" })).toBeInTheDocument();
  });
});
