import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Inbox } from "lucide-react";
import { EmptyState } from "../EmptyState";

describe("EmptyState", () => {
  it("hiện tiêu đề, mô tả và việc nên làm tiếp", () => {
    render(
      <EmptyState
        icon={Inbox}
        title="Chưa có tài sản"
        description="Thêm tài sản đầu tiên để bắt đầu."
        action={<button type="button">Thêm tài sản</button>}
      />,
    );
    expect(screen.getByText("Chưa có tài sản")).toBeInTheDocument();
    expect(screen.getByText("Thêm tài sản đầu tiên để bắt đầu.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thêm tài sản" })).toBeInTheDocument();
  });

  it("chỉ có tiêu đề thì không vẽ mô tả hay nút", () => {
    render(<EmptyState title="Chưa có hồ sơ" />);
    expect(screen.getByText("Chưa có hồ sơ")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
