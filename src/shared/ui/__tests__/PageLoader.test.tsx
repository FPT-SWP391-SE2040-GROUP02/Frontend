import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageLoader } from "../PageLoader";

describe("PageLoader", () => {
  it("báo trạng thái đang tải với nhãn mặc định", () => {
    render(<PageLoader />);
    expect(screen.getByRole("status", { name: "Đang tải trang…" })).toBeInTheDocument();
  });

  it("dùng nhãn do nơi gọi truyền vào", () => {
    render(<PageLoader label="Đang đồng bộ phiên bảo mật…" />);
    expect(screen.getByRole("status", { name: "Đang đồng bộ phiên bảo mật…" })).toBeInTheDocument();
    expect(screen.getByText("Đang đồng bộ phiên bảo mật…")).toBeInTheDocument();
  });
});
