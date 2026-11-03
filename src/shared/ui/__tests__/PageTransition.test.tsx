import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { PageTransition } from "../PageTransition";

const cancel = vi.fn();
const animate = vi.fn(() => ({ cancel }));

function setReducedMotion(reduced: boolean): void {
  window.matchMedia = vi.fn().mockReturnValue({ matches: reduced }) as never;
}

function Mover() {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate("/b")}>
      Sang trang b
    </button>
  );
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <PageTransition className="khung">
        <p>Nội dung trang</p>
        <Mover />
      </PageTransition>
    </MemoryRouter>,
  );
}

describe("PageTransition", () => {
  beforeEach(() => {
    animate.mockClear();
    cancel.mockClear();
    HTMLElement.prototype.animate = animate as never;
    setReducedMotion(false);
  });
  afterEach(() => {
    delete (HTMLElement.prototype as { animate?: unknown }).animate;
  });

  it("vẫn hiện nội dung và giữ class của khung", () => {
    renderAt("/a");
    expect(screen.getByText("Nội dung trang").parentElement).toHaveClass("khung");
  });

  it("chạy hoạt ảnh lúc vừa hiện và chạy lại khi đổi đường dẫn", async () => {
    renderAt("/a");
    expect(animate).toHaveBeenCalledTimes(1);
    screen.getByRole("button", { name: "Sang trang b" }).click();
    await screen.findByText("Nội dung trang");
    expect(animate).toHaveBeenCalledTimes(2);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("máy bật giảm chuyển động thì không chạy hoạt ảnh", () => {
    setReducedMotion(true);
    renderAt("/a");
    expect(animate).not.toHaveBeenCalled();
    expect(screen.getByText("Nội dung trang")).toBeInTheDocument();
  });

  it("trình duyệt không có animate thì chỉ hiện nội dung", () => {
    delete (HTMLElement.prototype as { animate?: unknown }).animate;
    renderAt("/a");
    expect(screen.getByText("Nội dung trang")).toBeInTheDocument();
  });
});
