import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataTable, type DataTableColumn } from "../DataTable";

interface Person {
  id: string;
  name: string;
}
const columns: DataTableColumn<Person>[] = [
  { id: "name", header: "Họ tên", cell: (row) => row.name },
  { id: "actions", header: "Thao tác", srOnlyHeader: true, cell: () => <button>Sửa</button> },
];

describe("DataTable", () => {
  it("có caption, tiêu đề cột và một dòng mỗi bản ghi", () => {
    render(
      <DataTable
        caption="Danh sách người nhận"
        columns={columns}
        rows={[
          { id: "1", name: "An" },
          { id: "2", name: "Bình" },
        ]}
        rowKey={(row) => row.id}
      />,
    );
    expect(screen.getByRole("table", { name: "Danh sách người nhận" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Họ tên" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Thao tác" })).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: "Sửa" })).toHaveLength(2);
  });

  it("đang tải thì hiện 'Đang tải…' và không hiện dòng dữ liệu", () => {
    render(
      <DataTable
        caption="Bảng"
        columns={columns}
        rows={[{ id: "1", name: "An" }]}
        rowKey={(row) => row.id}
        loading
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Đang tải…");
    expect(screen.queryByText("An")).not.toBeInTheDocument();
  });

  it("rỗng thì hiện nội dung empty, hoặc câu mặc định", () => {
    const { rerender } = render(
      <DataTable caption="Bảng" columns={columns} rows={[]} rowKey={(row) => row.id} />,
    );
    expect(screen.getByText("Chưa có dữ liệu.")).toBeInTheDocument();
    rerender(
      <DataTable
        caption="Bảng"
        columns={columns}
        rows={[]}
        rowKey={(row) => row.id}
        empty={<p>Chưa có người nhận nào.</p>}
      />,
    );
    expect(screen.getByText("Chưa có người nhận nào.")).toBeInTheDocument();
  });
});
