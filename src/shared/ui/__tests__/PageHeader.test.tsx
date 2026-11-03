import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Vault } from "lucide-react";
import { PageHeader } from "../PageHeader";

describe("PageHeader", () => {
  it("có đúng một h1 với tiêu đề và câu giải thích", () => {
    render(
      <MemoryRouter>
        <PageHeader title="Kho của tôi" description="Nơi giữ tài sản số." />
      </MemoryRouter>,
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Kho của tôi" })).toBeInTheDocument();
    expect(screen.getByText("Nơi giữ tài sản số.")).toBeInTheDocument();
  });

  it("nút quay lại là liên kết có tên đọc được", () => {
    render(
      <MemoryRouter>
        <PageHeader title="Chi tiết" backHref="/dashboard/assets" />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Quay lại" })).toHaveAttribute(
      "href",
      "/dashboard/assets",
    );
  });

  it("không có backHref, icon, actions thì không vẽ chúng; có thì hiện nút chính", () => {
    const { rerender } = render(
      <MemoryRouter>
        <PageHeader title="Tổng quan" />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    rerender(
      <MemoryRouter>
        <PageHeader
          title="Tổng quan"
          icon={Vault}
          eyebrow="Kho"
          actions={<button type="button">Thêm tài sản</button>}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole("button", { name: "Thêm tài sản" })).toBeInTheDocument();
    expect(screen.getByText("Kho")).toBeInTheDocument();
  });
});
