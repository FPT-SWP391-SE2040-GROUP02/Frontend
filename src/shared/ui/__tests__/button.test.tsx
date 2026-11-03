import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../button";

describe("Button component", () => {
  it("renders correctly with children text", () => {
    render(<Button>Bấm vào đây</Button>);
    expect(screen.getByRole("button", { name: /bấm vào đây/i })).toBeInTheDocument();
  });

  it("handles click event properly", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click Me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });

    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies disabled state when disabled prop is set", () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole("button", { name: /disabled button/i });
    expect(button).toBeDisabled();
  });

  it.each([
    ["gold", "bg-heritage-gold-soft"],
    ["dark", "bg-heritage-sidebar"],
    ["danger", "text-heritage-danger"],
  ] as const)("variant %s dùng màu từ theme, không viết hex", (variant, themeClass) => {
    render(<Button variant={variant}>Nút</Button>);
    const button = screen.getByRole("button", { name: "Nút" });
    expect(button.className).toContain(themeClass);
    expect(button.className).not.toMatch(/#[0-9A-Fa-f]{6}/);
  });
});
