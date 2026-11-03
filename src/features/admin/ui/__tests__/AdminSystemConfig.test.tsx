import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { AdminSystemConfig } from "../AdminSystemConfig";

const settings = { model: "gemini-flash-lite-latest", timeoutSeconds: "20" };
const status = { activeSlot: null, lastOutcome: null, lastAt: null, lastErrorCode: null };

function primarySlot(source: "DATABASE" | "APPSETTINGS" = "DATABASE") {
  return {
    slot: "PRIMARY",
    enabled: true,
    source,
    settings,
    secrets: [{ name: "apiKey", hasValue: true, last4: source === "DATABASE" ? "1a2b" : null }],
    version: source === "DATABASE" ? 1 : 0,
    updatedAt: source === "DATABASE" ? "2026-11-03T10:00:00+00:00" : null,
    updatedBy: source === "DATABASE" ? "Cô Lan" : null,
  };
}
const fallbackSlot = {
  slot: "FALLBACK",
  enabled: false,
  source: "APPSETTINGS",
  settings,
  secrets: [{ name: "apiKey", hasValue: false, last4: null }],
  version: 0,
  updatedAt: null,
  updatedBy: null,
};

function listOf(source: "DATABASE" | "APPSETTINGS" = "DATABASE") {
  return {
    services: [
      {
        serviceKey: "GEMINI",
        supportsFallback: true,
        slots: [primarySlot(source), fallbackSlot],
        status,
      },
    ],
  };
}

afterEach(() => {
  cleanup();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function renderPage() {
  accessTokenMemory.set("fixture");
  const client = new QueryClient();
  render(
    <QueryClientProvider client={client}>
      <AdminSystemConfig />
    </QueryClientProvider>,
  );
  return client;
}

describe("AdminSystemConfig", () => {
  it("hiện khung chờ trong lúc tải", () => {
    vi.spyOn(apiClient, "get").mockReturnValue(new Promise(() => undefined));
    renderPage();
    expect(document.querySelector('[data-slot="skeleton"]')).not.toBeNull();
  });

  it("hiện lỗi có nút thử lại khi không tải được danh sách", async () => {
    const get = vi.spyOn(apiClient, "get").mockRejectedValue(new Error("boom"));
    renderPage();
    const retry = await screen.findByRole("button", { name: "Thử lại" });
    get.mockResolvedValue(listOf());
    fireEvent.click(retry);
    expect(await screen.findByText("Gemini (AI nhận diện giấy chứng tử)")).toBeInTheDocument();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("hiện thông báo khi chưa có dịch vụ nào để cấu hình", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({ services: [] });
    renderPage();
    expect(await screen.findByText("Chưa có dịch vụ nào để cấu hình.")).toBeInTheDocument();
  });

  it("hiện thẻ Gemini với nhãn trạng thái, khóa che và người sửa cuối", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(listOf());
    renderPage();
    expect(await screen.findByText("Gemini (AI nhận diện giấy chứng tử)")).toBeInTheDocument();
    expect(screen.getByText("Đang dùng cấu hình chính")).toBeInTheDocument();
    expect(screen.getByText("•••• 1a2b")).toBeInTheDocument();
    expect(screen.getByText(/Cô Lan/)).toBeInTheDocument();
    // Mỗi ô (chính và dự phòng) hiện model của riêng nó.
    expect(screen.getAllByText("gemini-flash-lite-latest")).toHaveLength(2);
  });

  it("nút Sửa mở hộp thoại của đúng ô", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(listOf());
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Sửa dịch vụ dự phòng" }));
    expect(await screen.findByText(/Dịch vụ dự phòng · Gemini/)).toBeInTheDocument();
    expect(screen.getByLabelText("Bật dịch vụ dự phòng")).toBeInTheDocument();
  });

  it("lưu xong thì hiện thông báo thành công và tải lại danh sách", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(listOf());
    vi.spyOn(apiClient, "put").mockResolvedValue({ ...primarySlot(), version: 2 });
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Sửa cấu hình chính" }));
    fireEvent.change(await screen.findByLabelText("Lý do thay đổi"), { target: { value: "đổi" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(await screen.findByText("Đã lưu cấu hình.")).toBeInTheDocument();
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  });

  it("khôi phục mặc định hỏi lý do, gọi API rồi tải lại danh sách", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(listOf());
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(undefined);
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Khôi phục mặc định" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Lý do"), { target: { value: "quay về" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Khôi phục mặc định" }));
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/admin/system-config/GEMINI/PRIMARY/reset", {
        reason: "quay về",
      }),
    );
    expect(
      await screen.findByText("Đã khôi phục về cấu hình mặc định của máy chủ."),
    ).toBeInTheDocument();
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  });

  it("hiện SePay với nhãn môi trường tiếng Việt, khóa che và không có ô dự phòng", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      services: [
        {
          serviceKey: "SEPAY",
          supportsFallback: false,
          slots: [
            {
              slot: "PRIMARY",
              enabled: true,
              source: "DATABASE",
              settings: {
                environment: "Live",
                bankCode: "MBBank",
                accountNumber: "1234567890",
                accountName: "CONG TY A",
              },
              secrets: [{ name: "webhookApiKey", hasValue: true, last4: "9z8y" }],
              version: 1,
              updatedAt: "2026-11-03T10:00:00+00:00",
              updatedBy: "Cô Lan",
            },
          ],
          status,
        },
      ],
    });
    renderPage();
    expect(await screen.findByText("SePay (nhận tiền thanh toán)")).toBeInTheDocument();
    expect(screen.getByText("Thật (Live)")).toBeInTheDocument();
    expect(screen.getByText("1234567890")).toBeInTheDocument();
    expect(screen.getByText("•••• 9z8y")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sửa dịch vụ dự phòng" })).not.toBeInTheDocument();
  });

  it("ẩn nút khôi phục khi ô chính đang dùng cấu hình của máy chủ", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(listOf("APPSETTINGS"));
    renderPage();
    expect(await screen.findByText("Gemini (AI nhận diện giấy chứng tử)")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Khôi phục mặc định" })).not.toBeInTheDocument();
    expect(screen.getByText("Đang dùng cấu hình mặc định của máy chủ")).toBeInTheDocument();
  });
});
