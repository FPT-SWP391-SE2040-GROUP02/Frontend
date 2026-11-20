import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExecutorEmailPreviewPanel } from "../ExecutorEmailPreviewPanel";

describe("ExecutorEmailPreviewPanel", () => {
  it("renders the death case supplement template by default", () => {
    render(<ExecutorEmailPreviewPanel />);

    expect(screen.getByText("Mẫu Email thông báo Executor")).toBeInTheDocument();
    expect(screen.getByText("Hồ sơ chứng tử cần bổ sung", { selector: "h2" })).toBeInTheDocument();
    expect(screen.getByText(/Trần Thi Hành/)).toBeInTheDocument();
    expect(screen.getByText("Mở trang Executor")).toBeInTheDocument();
    expect(screen.queryByText(/quá hạn điểm danh/i)).not.toBeInTheDocument();
  });

  it("switches viewport when clicking mobile and desktop buttons", () => {
    render(<ExecutorEmailPreviewPanel />);

    const mobileBtn = screen.getByLabelText("Xem cỡ điện thoại");
    fireEvent.click(mobileBtn);

    const desktopBtn = screen.getByLabelText("Xem cỡ máy tính");
    fireEvent.click(desktopBtn);
    expect(desktopBtn).toBeInTheDocument();
  });

  it("copies raw HTML when clicking copy button", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(<ExecutorEmailPreviewPanel />);

    const copyBtn = screen.getByRole("button", { name: /Sao chép HTML/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("<!DOCTYPE html>"));
  });
});
