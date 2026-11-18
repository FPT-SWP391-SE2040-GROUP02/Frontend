import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { useNavIndicator } from "../useNavIndicator";

const ITEMS = [
  { key: "a", top: 0 },
  { key: "b", top: 46 },
  { key: "c", top: 92 },
];

function Menu({ active }: { active: string | undefined }) {
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  useNavIndicator(navRef, indicatorRef, active);
  return (
    <nav ref={navRef} aria-label="menu">
      <span ref={indicatorRef} data-testid="indicator" aria-hidden="true" />
      {ITEMS.map((item) => (
        <a
          key={item.key}
          href={`#${item.key}`}
          data-top={item.top}
          aria-current={active === item.key ? "page" : undefined}
        >
          {item.key}
        </a>
      ))}
    </nav>
  );
}

const original = {
  top: Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetTop"),
  height: Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight"),
};

beforeEach(() => {
  // jsdom không dàn trang nên offsetTop luôn 0; đọc từ data-top để kiểm vị trí vạch.
  Object.defineProperty(HTMLElement.prototype, "offsetTop", {
    configurable: true,
    get() {
      return Number((this as HTMLElement).dataset.top ?? 0);
    },
  });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get() {
      return 42;
    },
  });
});

afterEach(() => {
  cleanup();
  if (original.top) {
    Object.defineProperty(HTMLElement.prototype, "offsetTop", original.top);
  }
  if (original.height) {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", original.height);
  }
});

function indicatorOf(container: HTMLElement): HTMLElement {
  const found = container.querySelector<HTMLElement>('[data-testid="indicator"]');
  if (found === null) {
    throw new Error("Không thấy vạch chọn");
  }
  return found;
}

describe("useNavIndicator", () => {
  it("đặt vạch đúng vị trí và chiều cao của mục đang chọn", () => {
    const { container } = render(<Menu active="b" />);
    const indicator = indicatorOf(container);
    expect(indicator.style.transform).toBe("translateY(46px)");
    expect(indicator.style.height).toBe("42px");
    expect(indicator.style.visibility).toBe("visible");
  });

  it("đổi mục thì vạch chuyển sang vị trí mới, và trả lại transition cho CSS", () => {
    const { container, rerender } = render(<Menu active="a" />);
    expect(indicatorOf(container).style.transform).toBe("translateY(0px)");

    rerender(<Menu active="c" />);
    const indicator = indicatorOf(container);
    expect(indicator.style.transform).toBe("translateY(92px)");
    // Bước đặt vị trí cũ chạy với transition tắt; xong phải trả về rỗng để CSS có chuyển động.
    expect(indicator.style.transition).toBe("");
  });

  it("khung mới dựng lại (đổi trang) vẫn đặt đúng vị trí mục mới", () => {
    const first = render(<Menu active="a" />);
    first.unmount();
    const { container } = render(<Menu active="b" />);
    expect(indicatorOf(container).style.transform).toBe("translateY(46px)");
  });

  it("không có mục nào đang chọn thì ẩn vạch", () => {
    const { container } = render(<Menu active={undefined} />);
    expect(indicatorOf(container).style.visibility).toBe("hidden");
  });
});
