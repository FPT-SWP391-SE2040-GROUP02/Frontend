import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ChipOverflow, type ChipOverflowItem } from "../ChipOverflow";

function people(count: number): ChipOverflowItem[] {
  const items: ChipOverflowItem[] = [];
  for (let index = 1; index <= count; index += 1) {
    items.push({ id: `p${index}`, label: `Người ${index}`, detail: `CCCD ****000${index}` });
  }
  return items;
}

afterEach(() => {
  cleanup();
});

describe("ChipOverflow", () => {
  it("không có nút +N khi số mục không vượt số chip hiện trực tiếp", () => {
    render(<ChipOverflow items={people(2)} popupTitle="2 người nhận của gói" />);
    expect(screen.getByText("Người 1")).toBeInTheDocument();
    expect(screen.getByText("Người 2")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("gom phần còn lại vào +N và popup liệt kê đủ, chưa có ô tìm khi dưới 8 mục", async () => {
    render(
      <ChipOverflow
        items={people(5)}
        popupTitle="5 người nhận của gói"
        footer={<a href="/b">Quản lý người nhận</a>}
      />,
    );
    const toggle = screen.getByRole("button", { name: /Xem thêm 3 mục/ });
    expect(toggle).toHaveTextContent("+3");
    fireEvent.click(toggle);
    expect(await screen.findByText("5 người nhận của gói")).toBeInTheDocument();
    expect(screen.getByText("Người 5")).toBeInTheDocument();
    expect(screen.getByText("CCCD ****0005")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Quản lý người nhận" })).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("từ 8 mục trở lên popup có ô tìm", async () => {
    render(
      <ChipOverflow
        items={people(8)}
        popupTitle="8 tài sản"
        searchPlaceholder="Tìm trong 8 tài sản…"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Xem thêm 6 mục/ }));
    const search = await screen.findByRole("searchbox", { name: "Tìm trong 8 tài sản…" });
    fireEvent.change(search, { target: { value: "Người 7" } });
    expect(screen.getAllByText("Người 7").length).toBeGreaterThan(0);
    expect(screen.queryByText("Người 5")).not.toBeInTheDocument();
  });
});
