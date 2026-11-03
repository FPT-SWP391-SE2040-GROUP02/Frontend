import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CheckInRing } from "../CheckInRing";

const SERVER_TIME = "2026-11-02T00:00:00Z";
const DAY_MS = 24 * 60 * 60 * 1000;
const inDays = (days: number) =>
  new Date(new Date(SERVER_TIME).getTime() + days * DAY_MS).toISOString();
const offsetOf = () =>
  Number(document.querySelector(".overview-ring-value")?.getAttribute("stroke-dashoffset"));
const FULL = 2 * Math.PI * 70;

describe("CheckInRing", () => {
  it("đọc số ngày còn lại theo giờ máy chủ và vẽ phần vòng tỉ lệ với chu kỳ", () => {
    render(
      <CheckInRing
        serverTime={SERVER_TIME}
        nextCheckInDueAt={inDays(15)}
        cycleDays={30}
        overdue={false}
      />,
    );
    expect(screen.getByRole("img", { name: "Còn 15 ngày đến hạn điểm danh" })).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(offsetOf()).toBeCloseTo(FULL * 0.5, 3);
  });

  it("chưa có hạn (kỳ chưa bắt đầu) thì không bịa số ngày", () => {
    render(
      <CheckInRing
        serverTime={SERVER_TIME}
        nextCheckInDueAt={null}
        cycleDays={30}
        overdue={false}
      />,
    );
    expect(
      screen.getByRole("img", { name: "Chưa có kỳ điểm danh nào đang chạy" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Chưa bắt đầu")).toBeInTheDocument();
    expect(offsetOf()).toBeCloseTo(FULL, 3);
  });

  it("quá hạn theo giờ máy chủ hoặc máy chủ báo quá hạn: hiện 'Quá hạn' và đánh dấu cảnh báo", () => {
    const { container, rerender } = render(
      <CheckInRing
        serverTime={SERVER_TIME}
        nextCheckInDueAt={inDays(-2)}
        cycleDays={30}
        overdue={false}
      />,
    );
    expect(screen.getByRole("img", { name: "Đã quá hạn điểm danh" })).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass("is-overdue");
    expect(offsetOf()).toBeCloseTo(0, 3);
    rerender(
      <CheckInRing serverTime={SERVER_TIME} nextCheckInDueAt={inDays(5)} cycleDays={30} overdue />,
    );
    expect(screen.getByText("Quá hạn")).toBeInTheDocument();
  });

  it("hạn xa hơn chu kỳ thì vòng đầy, không vượt quá một vòng", () => {
    render(
      <CheckInRing
        serverTime={SERVER_TIME}
        nextCheckInDueAt={inDays(90)}
        cycleDays={30}
        overdue={false}
      />,
    );
    expect(offsetOf()).toBeCloseTo(0, 3);
  });
});
