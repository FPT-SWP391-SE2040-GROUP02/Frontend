import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SlidingTabs } from "../SlidingTabs";

const TABS = [
  { key: "items", label: "Mục tài sản" },
  { key: "groups", label: "Gói bàn giao" },
];
// Vị trí và bề rộng giả cho từng tab, vì jsdom không dàn trang.
const LAYOUT: Record<string, { left: number; width: number }> = {
  "Mục tài sản": { left: 4, width: 120 },
  "Gói bàn giao": { left: 128, width: 100 },
};

function textOf(element: HTMLElement): string {
  return element.textContent ?? "";
}

const original = {
  left: Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetLeft"),
  width: Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth"),
};

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetLeft", {
    configurable: true,
    get() {
      const found = LAYOUT[textOf(this as HTMLElement)];
      if (found === undefined) {
        return 0;
      }
      return found.left;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get() {
      const found = LAYOUT[textOf(this as HTMLElement)];
      if (found === undefined) {
        return 0;
      }
      return found.width;
    },
  });
});

afterEach(() => {
  cleanup();
  if (original.left) {
    Object.defineProperty(HTMLElement.prototype, "offsetLeft", original.left);
  }
  if (original.width) {
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", original.width);
  }
});

function Harness({ initial = "items" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <SlidingTabs label="Tài sản của tôi" tabs={TABS} value={value} onChange={setValue} />;
}

function pillOf(container: HTMLElement): HTMLElement {
  const pill = container.querySelector<HTMLElement>('span[aria-hidden="true"]');
  if (pill === null) {
    throw new Error("Không thấy khối trượt");
  }
  return pill;
}

describe("SlidingTabs", () => {
  it("có vai trò tablist và tab, đánh dấu tab đang chọn", () => {
    render(<Harness />);
    expect(screen.getByRole("tablist", { name: "Tài sản của tôi" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Mục tài sản" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Gói bàn giao" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("khối nền nằm đúng tab đang chọn lúc đầu", () => {
    const { container } = render(<Harness initial="groups" />);
    const pill = pillOf(container);
    expect(pill.style.transform).toBe("translateX(128px)");
    expect(pill.style.width).toBe("100px");
  });

  it("bấm tab khác thì gọi đổi tab và khối nền sang vị trí, bề rộng của tab đó", async () => {
    const { container } = render(<Harness />);
    const pill = pillOf(container);
    expect(pill.style.transform).toBe("translateX(4px)");
    expect(pill.style.width).toBe("120px");

    await userEvent.click(screen.getByRole("tab", { name: "Gói bàn giao" }));
    expect(screen.getByRole("tab", { name: "Gói bàn giao" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(pill.style.transform).toBe("translateX(128px)");
    expect(pill.style.width).toBe("100px");
    // Chuyển động do CSS lo: sau khi đặt chỗ, transition inline phải trả về rỗng.
    expect(pill.style.transition).toBe("");
  });

  it("khối nền không chặn bấm chuột vào tab", () => {
    const { container } = render(<Harness />);
    expect(pillOf(container).className).toContain("pointer-events-none");
  });
});
