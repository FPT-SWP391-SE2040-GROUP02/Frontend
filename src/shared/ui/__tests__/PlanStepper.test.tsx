import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanStepper, planStepIndex } from "../PlanStepper";

describe("planStepIndex", () => {
  it.each([
    ["DRAFT", 0],
    ["ACTIVE", 1],
    ["CHECKIN_OVERDUE", 2],
    ["AWAITING_CHECK", 3],
    ["BLOCKED", 3],
    ["DEATH_CASE_OPEN", 5],
    ["HANDOVER_IN_PROGRESS", 6],
    ["CLOSED", 7],
    ["KHONG_BIET", -1],
  ])("%s là bước %i", (status, expected) => {
    expect(planStepIndex(status)).toBe(expected);
  });
});

describe("PlanStepper", () => {
  it("đánh dấu bước hiện tại và các bước đã qua", () => {
    render(<PlanStepper planStatus="AWAITING_CHECK" />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(8);
    expect(items[3]).toHaveAttribute("aria-current", "step");
    expect(items[0]).not.toHaveAttribute("aria-current");
    expect(screen.getByText("Người thực thi vào cuộc")).toBeInTheDocument();
  });

  it("kho bị đóng băng báo rõ lý do ở bước Người thực thi", () => {
    render(<PlanStepper planStatus="BLOCKED" />);
    expect(screen.getByText("Đóng băng: hết gói")).toBeInTheDocument();
  });

  it("trạng thái lạ không đánh dấu bước nào", () => {
    render(<PlanStepper planStatus="KHONG_BIET" />);
    expect(
      screen.queryAllByRole("listitem").some((item) => item.getAttribute("aria-current")),
    ).toBe(false);
  });
});
