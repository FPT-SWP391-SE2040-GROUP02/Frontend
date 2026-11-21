import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { adminSettingsService } from "../../api/adminSettingsService";
import { AdminSettings } from "../AdminSettings";

let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // Chưa có dòng nào trên máy chủ: màn hình dùng giá trị mặc định của từng tham số.
  vi.spyOn(adminSettingsService, "getAll").mockResolvedValue([]);
});
afterEach(() => {
  cleanup();
  client.clear();
  vi.restoreAllMocks();
});

function renderSettings() {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AdminSettings section="params" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** Ô "Hạn người nhận phản hồi lời mời" (nhóm Bàn giao mở sẵn), mặc định 5 ngày, khoảng hợp lệ 1 đến 60. */
async function responseWindowInput(): Promise<HTMLElement> {
  await screen.findByText("Hạn người nhận phản hồi lời mời");
  return screen.getByDisplayValue("5");
}

describe("trang Cấu hình: kiểm giá trị trước khi lưu", () => {
  it("ngoài khoảng cho phép: nói rõ khoảng hợp lệ và khóa nút lưu", async () => {
    renderSettings();
    fireEvent.change(await responseWindowInput(), { target: { value: "99" } });

    expect(await screen.findByText("Phải từ 1 đến 60.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Xem thay đổi và lưu/ })).toBeDisabled();
  });

  it("giá trị hợp lệ: không có lỗi và nút lưu dùng được", async () => {
    renderSettings();
    fireEvent.change(await responseWindowInput(), { target: { value: "10" } });

    const save = await screen.findByRole("button", { name: /Xem thay đổi và lưu/ });
    expect(save).toBeEnabled();
    expect(screen.queryByText(/chưa hợp lệ/)).not.toBeInTheDocument();
  });

  it("không còn nhóm điểm danh hay hồ sơ chứng tử", async () => {
    renderSettings();
    await responseWindowInput();
    expect(screen.queryByText(/điểm danh/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/chứng tử/i)).not.toBeInTheDocument();
  });
});
