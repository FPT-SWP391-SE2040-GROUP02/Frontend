import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EkycOcrProgress } from "../EkycOcrProgress";

function bar() {
  return screen.getByRole("progressbar", { name: "Tiến trình đọc giấy tờ" });
}

describe("EkycOcrProgress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("giai đoạn 1: % tải ảnh thật chiếm 40% đầu thanh", () => {
    render(<EkycOcrProgress uploadPercent={50} />);

    expect(screen.getByRole("status")).toHaveTextContent("Đang tải ảnh lên… 50%");
    expect(bar()).toHaveAttribute("aria-valuenow", "20");
  });

  it("giai đoạn 2: upload xong thì quét tăng dần nhưng không tự chạm 100%", () => {
    const { rerender } = render(<EkycOcrProgress uploadPercent={80} />);
    rerender(<EkycOcrProgress uploadPercent={100} />);

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByRole("status")).toHaveTextContent(/Đang quét căn cước… \d+%/);
    const early = Number(bar().getAttribute("aria-valuenow"));
    expect(early).toBeGreaterThanOrEqual(40);

    act(() => {
      vi.advanceTimersByTime(60000);
    });
    const late = Number(bar().getAttribute("aria-valuenow"));
    expect(late).toBeGreaterThan(early);
    expect(late).toBeLessThanOrEqual(95);
  });

  it("trình duyệt không báo tiến độ upload thì vào thẳng giai đoạn quét", () => {
    render(<EkycOcrProgress uploadPercent={null} />);

    expect(screen.getByRole("status")).toHaveTextContent(/Đang quét căn cước/);
  });

  it("ghi lại thời gian quét để lần sau ước lượng", () => {
    const { unmount } = render(<EkycOcrProgress uploadPercent={null} />);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    unmount();

    expect(Number(window.localStorage.getItem("lv.ekyc.ocrScanMs"))).toBeGreaterThanOrEqual(2900);
  });
});
