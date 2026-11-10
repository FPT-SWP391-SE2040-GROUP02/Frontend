import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { SlidePanel, SlideToggle } from "../SlidePanel";

function Demo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <SlideToggle controls="demo" open={open} onToggle={() => setOpen((value) => !value)}>
        {open ? "Thu gọn" : "Mở ra"}
      </SlideToggle>
      <SlidePanel id="demo" open={open}>
        <p>Nội dung dài</p>
      </SlidePanel>
    </>
  );
}

describe("SlidePanel", () => {
  it("đóng thì ẩn với trình đọc và bàn phím, mở thì hiện lại, nút báo đúng trạng thái", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    const panel = document.getElementById("demo") as HTMLElement;

    expect(panel).toHaveAttribute("aria-hidden", "true");
    expect(panel.firstElementChild).toHaveAttribute("inert");
    expect(screen.getByRole("button", { name: "Mở ra" })).toHaveAttribute("aria-expanded", "false");

    await user.click(screen.getByRole("button", { name: "Mở ra" }));

    expect(panel).toHaveAttribute("aria-hidden", "false");
    expect(panel.firstElementChild).not.toHaveAttribute("inert");
    expect(screen.getByRole("button", { name: "Thu gọn" })).toHaveAttribute(
      "aria-controls",
      "demo",
    );
    expect(screen.getByText("Nội dung dài")).toBeVisible();
  });
});
