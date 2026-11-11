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

/** Ô số của thư nhắc trước hạn: mặc định 7 (thứ nhất) và 1 (thứ hai); các ô thứ ba đến thứ năm cũng là 1 nhưng nằm sau. */
async function firstReminderInput(): Promise<HTMLElement> {
  await screen.findByText("Thư nhắc trước hạn thứ nhất");
  return screen.getByDisplayValue("7");
}

function secondReminderInput(): HTMLElement {
  return screen.getAllByDisplayValue("1")[0];
}

describe("trang Cấu hình: kiểm giá trị trước khi lưu", () => {
  it("thư thứ hai trùng hoặc xa hạn hơn thư thứ nhất: báo lỗi cả hai ô và khóa nút lưu", async () => {
    renderSettings();
    await firstReminderInput();

    fireEvent.change(secondReminderInput(), { target: { value: "9" } });

    const alerts = await screen.findAllByRole("alert");
    const text = alerts.map((alert) => alert.textContent).join(" | ");
    expect(text).toContain("Phải xa hạn hơn thư thứ hai");
    expect(text).toContain("Phải gần hạn hơn thư thứ nhất");
    expect(text).toContain("Còn 2 giá trị chưa hợp lệ");
    expect(screen.getByRole("button", { name: /Xem thay đổi và lưu/ })).toBeDisabled();
  });

  it("hai ngày bằng nhau cũng bị chặn", async () => {
    renderSettings();
    await firstReminderInput();

    fireEvent.change(secondReminderInput(), { target: { value: "7" } });

    expect(await screen.findAllByRole("alert")).not.toHaveLength(0);
    expect(screen.getByRole("button", { name: /Xem thay đổi và lưu/ })).toBeDisabled();
  });

  it("ngoài khoảng cho phép: nói rõ khoảng hợp lệ", async () => {
    renderSettings();
    await firstReminderInput();

    fireEvent.change(secondReminderInput(), { target: { value: "99" } });

    expect(await screen.findByText("Phải từ 1 đến 30.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Xem thay đổi và lưu/ })).toBeDisabled();
  });

  it("giá trị hợp lệ: không có lỗi và nút lưu dùng được", async () => {
    renderSettings();
    await firstReminderInput();

    fireEvent.change(secondReminderInput(), { target: { value: "3" } });

    const save = await screen.findByRole("button", { name: /Xem thay đổi và lưu/ });
    expect(save).toBeEnabled();
    expect(screen.queryByText(/chưa hợp lệ/)).not.toBeInTheDocument();
  });

  it("sửa lại cho đúng thì lỗi biến mất", async () => {
    renderSettings();
    const first = await firstReminderInput();

    fireEvent.change(secondReminderInput(), { target: { value: "9" } });
    expect(await screen.findAllByRole("alert")).not.toHaveLength(0);
    fireEvent.change(first, { target: { value: "20" } });

    const save = await screen.findByRole("button", { name: /Xem thay đổi và lưu/ });
    expect(save).toBeEnabled();
    expect(screen.queryByText(/chưa hợp lệ/)).not.toBeInTheDocument();
  });
});
