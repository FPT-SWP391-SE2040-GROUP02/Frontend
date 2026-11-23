import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { RollingNumber, VaultDial, VaultMeter } from "../VaultFx";

afterEach(() => {
  cleanup();
});

describe("RollingNumber", () => {
  it("trình đọc màn hình đọc đúng chuỗi, phần cuộn bị ẩn", () => {
    const { container } = render(<RollingNumber value="5,82" />);
    expect(screen.getByText("5,82")).toBeInTheDocument();
    expect(container.querySelectorAll(".rn-digit")).toHaveLength(3);
    expect(container.querySelectorAll(".rn-sep")).toHaveLength(1);
    for (const cell of Array.from(container.querySelectorAll(".rn-digit, .rn-sep"))) {
      expect(cell).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("mỗi chữ số trỏ tới đúng vị trí cuộn và lệch thời gian theo thứ tự", () => {
    const { container } = render(<RollingNumber value="4/6" />);
    const reels = Array.from(container.querySelectorAll<HTMLElement>(".rn-reel"));
    expect(reels.map((reel) => reel.style.getPropertyValue("--v"))).toEqual(["4", "6"]);
    expect(reels.map((reel) => reel.style.getPropertyValue("--i"))).toEqual(["0", "1"]);
  });
});

describe("VaultMeter", () => {
  it("sáng số ngăn theo tỉ lệ đã dùng và đánh dấu ngăn cuối", () => {
    const { container } = render(
      <VaultMeter usedBytes={20} quotaBytes={100} label="Dung lượng đã dùng" />,
    );
    const bar = screen.getByRole("progressbar", { name: "Dung lượng đã dùng" });
    expect(bar).toHaveAttribute("aria-valuenow", "20");
    expect(container.querySelectorAll(".vm-on")).toHaveLength(10);
    expect(container.querySelectorAll(".vm-tip")).toHaveLength(1);
  });

  it("kho có dữ liệu rất nhỏ vẫn sáng một ngăn, kho trống thì không sáng ngăn nào", () => {
    const { container, rerender } = render(
      <VaultMeter usedBytes={1} quotaBytes={1_000_000} label="Dung lượng đã dùng" />,
    );
    expect(container.querySelectorAll(".vm-on")).toHaveLength(1);
    rerender(<VaultMeter usedBytes={0} quotaBytes={1_000_000} label="Dung lượng đã dùng" />);
    expect(container.querySelectorAll(".vm-on")).toHaveLength(0);
  });
});

describe("VaultDial", () => {
  it("số vạch sáng theo tỉ lệ, đổi sang màu hoàn tất khi đã gán hết, và ẩn khỏi trình đọc màn hình", () => {
    const { container, rerender } = render(<VaultDial fraction={0.5} complete={false} />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll(".vd-on")).toHaveLength(14);
    expect(container.querySelector(".vd--done")).toBeNull();
    rerender(<VaultDial fraction={1} complete />);
    expect(container.querySelectorAll(".vd-on")).toHaveLength(28);
    expect(container.querySelector(".vd--done")).not.toBeNull();
  });

  it("tỉ lệ ngoài khoảng 0 đến 1 được kẹp lại", () => {
    const { container } = render(<VaultDial fraction={3} complete={false} />);
    expect(container.querySelectorAll(".vd-on")).toHaveLength(28);
  });
});
