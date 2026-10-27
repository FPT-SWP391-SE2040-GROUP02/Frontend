import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { checkInService } from "../../api/checkInService";
import { SmartwatchCheckInButton } from "../SmartwatchCheckInButton";

beforeEach(() => {
  accessTokenMemory.set("owner-fixture");
});

afterEach(() => {
  accessTokenMemory.clear();
  cleanup();
  vi.restoreAllMocks();
});

describe("SmartwatchCheckInButton", () => {
  it("hiển thị danh sách phương thức và nút kết nối đồng hồ", () => {
    render(<SmartwatchCheckInButton />);
    expect(screen.getByText("Cách điểm danh")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kết nối đồng hồ" })).toBeInTheDocument();
  });

  it("mở hộp thoại mã PIN và tự động hiển thị thông báo thành công khi nhận trạng thái đã ghép", async () => {
    vi.spyOn(checkInService, "getSmartwatchPairingCode").mockResolvedValue({
      code: "123456",
      expiresInSeconds: 300,
    });

    vi.spyOn(checkInService, "getSmartwatchPairingStatus")
      .mockResolvedValueOnce({
        paired: false,
        status: "pending",
      })
      .mockResolvedValueOnce({
        paired: true,
        status: "paired",
        deviceName: "Samsung Galaxy Watch 6",
        pairedAt: "2026-10-27T17:00:00Z",
      });

    render(<SmartwatchCheckInButton />);

    const button = screen.getByRole("button", { name: "Kết nối đồng hồ" });
    await userEvent.click(button);

    // Hộp thoại mở với 6 số
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Kết nối đồng hồ thông minh")).toBeInTheDocument();

    // Chờ polling nhận diện pairing thành công
    await waitFor(
      () => {
        expect(screen.getByText("Đã kết nối đồng hồ thành công!")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    expect(screen.getByText("Samsung Galaxy Watch 6")).toBeInTheDocument();
    expect(
      screen.getByText(/Giờ đây bạn có thể mở ứng dụng trên đồng hồ để đo nhịp tim và điểm danh/),
    ).toBeInTheDocument();

    // Bấm Hoàn tất đóng hộp thoại
    const doneButton = screen.getByRole("button", { name: "Hoàn tất" });
    await userEvent.click(doneButton);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Thẻ ngoài hiển thị trạng thái Đã kết nối
    expect(screen.getByText("Đã kết nối")).toBeInTheDocument();
    expect(screen.getByText(/Đã liên kết thiết bị \(Samsung Galaxy Watch 6\)/)).toBeInTheDocument();
  });
});
