import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExecutorEmailPreviewPanel } from "../ExecutorEmailPreviewPanel";

describe("ExecutorEmailPreviewPanel", () => {
  it("renders email preview panel with default overdue template", () => {
    render(<ExecutorEmailPreviewPanel />);

    expect(screen.getByText("Mẫu Email thông báo Executor")).toBeInTheDocument();
    expect(screen.getByText("Chủ kho quá hạn điểm danh — Cần bạn kiểm tra")).toBeInTheDocument();
    expect(screen.getByText(/Nguyễn Văn Thực Hiện/)).toBeInTheDocument();
    expect(screen.getByText("Mở trang người thực hiện")).toBeInTheDocument();
  });

  it("switches to death case supplement template when clicked", () => {
    render(<ExecutorEmailPreviewPanel />);

    const supplementTab = screen.getByRole("button", {
      name: /2\. Hồ sơ chứng tử cần bổ sung/i,
    });
    fireEvent.click(supplementTab);

    expect(screen.getByText("Hồ sơ chứng tử cần bổ sung")).toBeInTheDocument();
    expect(screen.getByText(/Trần Thi Hành/)).toBeInTheDocument();
    expect(screen.getByText("Mở trang Executor")).toBeInTheDocument();
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
