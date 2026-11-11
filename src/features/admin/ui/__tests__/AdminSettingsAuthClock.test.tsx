import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { adminSettingsService } from "../../api/adminSettingsService";
import { AdminSettings } from "../AdminSettings";

let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.spyOn(adminSettingsService, "getAll").mockResolvedValue([]);
});
afterEach(() => {
  cleanup();
  client.clear();
  vi.restoreAllMocks();
});

describe("trang Cấu hình: công tắc phiên đăng nhập theo giờ đã tua", () => {
  it("hiện công tắc kèm giải thích, mặc định chạy theo giờ thật", async () => {
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <AdminSettings section="params" />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // Nhóm "Bảo mật & Tính năng" đóng sẵn: mở ra để thấy công tắc.
    fireEvent.click(await screen.findByRole("button", { name: /Bảo mật & Tính năng/ }));

    expect(await screen.findByText("Phiên đăng nhập theo giờ đã tua")).toBeInTheDocument();
    expect(screen.getByText(/không làm ai bị đăng xuất/)).toBeInTheDocument();
  });
});
