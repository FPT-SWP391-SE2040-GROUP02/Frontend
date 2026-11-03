import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CitizenIdDiffGrid } from "../CitizenIdDiffGrid";

describe("CitizenIdDiffGrid", () => {
  it("hiển thị khớp tuyệt đối khi đủ 12 số và trùng nhau hoàn toàn", () => {
    render(<CitizenIdDiffGrid declaredId="079190012345" verifiedId="079190012345" />);

    expect(screen.getByText("12/12 số khớp tuyệt đối")).toBeInTheDocument();
    expect(screen.queryByText(/Phát hiện số không khớp/)).not.toBeInTheDocument();
    expect(screen.getAllByLabelText("Khớp")).toHaveLength(12);
  });

  it("phát hiện sai lệch khi có ký tự khác biệt", () => {
    render(<CitizenIdDiffGrid declaredId="079190012345" verifiedId="079190099945" />);

    expect(screen.getByText("Phát hiện số không khớp")).toBeInTheDocument();
    expect(screen.getByText(/Lưu ý: Có sự sai lệch giữa số CCCD/)).toBeInTheDocument();
    expect(screen.getAllByLabelText("Sai lệch").length).toBeGreaterThan(0);
  });

  it("xử lý khi dữ liệu bị thiếu hoặc rỗng", () => {
    render(<CitizenIdDiffGrid declaredId="" verifiedId={null} />);

    expect(screen.getByText("Thiếu dữ liệu đối chiếu")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Chưa xác minh")).toHaveLength(12);
  });
});
