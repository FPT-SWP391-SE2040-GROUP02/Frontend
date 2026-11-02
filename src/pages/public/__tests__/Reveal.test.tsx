import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Reveal } from "../ui/Reveal";

type ObserverCallback = (entries: { isIntersecting: boolean }[]) => void;

function installObserver(): { fire: (isIntersecting: boolean) => void; disconnect: () => void } {
  let callback: ObserverCallback = () => {};
  const disconnect = vi.fn();
  class FakeObserver {
    constructor(cb: ObserverCallback) {
      callback = cb;
    }
    observe() {}
    disconnect = disconnect;
  }
  vi.stubGlobal("IntersectionObserver", FakeObserver);
  return {
    fire: (isIntersecting) => callback([{ isIntersecting }]),
    disconnect,
  };
}

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", () => ({ matches: reduce }));
}

describe("Reveal", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ẩn cho tới khi cuộn tới, rồi hiện một lần và ngừng quan sát", () => {
    stubReducedMotion(false);
    const observer = installObserver();
    render(<Reveal>Nội dung</Reveal>);
    const block = screen.getByText("Nội dung");
    expect(block.className).not.toContain("is-visible");

    act(() => observer.fire(false));
    expect(block.className).not.toContain("is-visible");

    act(() => observer.fire(true));
    expect(block.className).toContain("is-visible");
    expect(observer.disconnect).toHaveBeenCalled();
  });

  it("hiện ngay khi người dùng bật giảm chuyển động", () => {
    stubReducedMotion(true);
    installObserver();
    render(<Reveal>Nội dung</Reveal>);
    expect(screen.getByText("Nội dung").className).toContain("is-visible");
  });

  it("hiện ngay khi trình duyệt không có IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    render(<Reveal>Nội dung</Reveal>);
    expect(screen.getByText("Nội dung").className).toContain("is-visible");
  });

  it("đặt độ trễ chuyển động và render đúng thẻ được chọn", () => {
    stubReducedMotion(true);
    render(
      <ul>
        <Reveal as="li" delay={200}>
          Mục
        </Reveal>
      </ul>,
    );
    const item = screen.getByText("Mục");
    expect(item.tagName).toBe("LI");
    expect(item.style.transitionDelay).toBe("200ms");
  });
});
