import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError, AxiosHeaders } from "axios";
import { apiClient } from "@/shared/api/axiosClient";
import { DemoClockCard } from "../DemoClockCard";

let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => {
  cleanup();
  client.clear();
  vi.restoreAllMocks();
});

function status(offsetDays: number) {
  const real = new Date();
  const system = new Date(real.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  return {
    nowUtc: system.toISOString(),
    realNowUtc: real.toISOString(),
    offsetSeconds: offsetDays * 24 * 60 * 60,
    isSimulated: offsetDays !== 0,
  };
}

/** Ngày yyyy-MM-dd cách hôm nay (theo máy) đúng `days` ngày. */
function dateInput(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function problem(statusCode: number, data: Record<string, unknown>) {
  return new AxiosError("failed", undefined, undefined, undefined, {
    status: statusCode,
    statusText: "Error",
    config: { headers: new AxiosHeaders() },
    headers: {},
    data,
  });
}

function renderCard() {
  return render(
    <QueryClientProvider client={client}>
      <DemoClockCard />
    </QueryClientProvider>,
  );
}

async function pickDate(value: string): Promise<void> {
  const input = await screen.findByLabelText("Tua tới ngày");
  fireEvent.change(input, { target: { value } });
}

describe("DemoClockCard", () => {
  it("hiện giờ hệ thống và ngày thật", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(status(0));
    renderCard();

    expect(await screen.findByText("Hôm nay theo hệ thống")).toBeInTheDocument();
    expect(screen.getByText("Ngày thật")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tua tới ngày này" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Về ngày thật" })).toBeDisabled();
  });

  it("ngày hợp lệ: gọi travel và hiện các bước đã chạy", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(status(0));
    const target = dateInput(10);
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({
      clock: status(10),
      steps: [
        {
          at: "2026-11-17T01:00:01Z",
          kind: "CHECK_IN_REMINDER",
          itemsProcessed: 1,
          emailsSent: 1,
          failures: 0,
        },
        {
          at: "2026-11-20T02:00:00Z",
          kind: "TARGET_DAY",
          itemsProcessed: 0,
          emailsSent: 0,
          failures: 0,
        },
      ],
    });
    renderCard();

    await pickDate(target);
    await userEvent.click(screen.getByRole("button", { name: "Tua tới ngày này" }));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        "/dev/clock/travel",
        { targetDate: target },
        expect.objectContaining({ timeout: expect.any(Number) }),
      ),
    );
    const list = await screen.findByRole("list", { name: "Các bước đã chạy" });
    expect(within(list).getByText("Gửi thư nhắc điểm danh")).toBeInTheDocument();
    expect(within(list).getByText(/1 email đã gửi/)).toBeInTheDocument();
    expect(within(list).getByText("Tới ngày đã chọn")).toBeInTheDocument();
    expect(screen.getByText("2 bước")).toBeInTheDocument();
  });

  it("đang chạy: khóa nút và hiện Đang chạy…", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(status(0));
    vi.spyOn(apiClient, "post").mockReturnValue(new Promise(() => undefined));
    renderCard();

    await pickDate(dateInput(5));
    await userEvent.click(screen.getByRole("button", { name: "Tua tới ngày này" }));

    const running = await screen.findByRole("button", { name: "Đang chạy…" });
    expect(running).toBeDisabled();
  });

  it("ngày hôm nay hoặc quá khứ bị chặn, không gọi travel", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(status(0));
    const post = vi.spyOn(apiClient, "post");
    renderCard();

    await pickDate(dateInput(0));
    await userEvent.click(screen.getByRole("button", { name: "Tua tới ngày này" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Chỉ chọn được ngày sau hôm nay theo hệ thống.",
    );

    await pickDate(dateInput(-3));
    await userEvent.click(screen.getByRole("button", { name: "Tua tới ngày này" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Chỉ chọn được ngày sau hôm nay");
    expect(post).not.toHaveBeenCalled();
  });

  it("chưa chọn ngày: nhắc chọn ngày", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(status(0));
    const post = vi.spyOn(apiClient, "post");
    renderCard();

    await userEvent.click(await screen.findByRole("button", { name: "Tua tới ngày này" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Hãy chọn ngày cần tua tới.");
    expect(post).not.toHaveBeenCalled();
  });

  it("ô chọn ngày chỉ cho ngày sau hôm nay theo hệ thống (đang giả lập thì tính từ ngày giả lập)", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(status(20));
    renderCard();

    const input = await screen.findByLabelText("Tua tới ngày");
    await waitFor(() => expect(input).toHaveAttribute("min", dateInput(21)));
  });

  it("lỗi từ Backend hiện ngay dưới ô ngày bằng chữ dễ hiểu", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(status(0));
    vi.spyOn(apiClient, "post").mockRejectedValue(
      problem(400, {
        code: "VALIDATION_ERROR",
        errors: { targetDate: ["Mỗi lần chỉ tua tối đa 400 ngày."] },
      }),
    );
    renderCard();

    await pickDate(dateInput(7));
    await userEvent.click(screen.getByRole("button", { name: "Tua tới ngày này" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Mỗi lần chỉ tua tối đa 400 ngày.");
  });

  it("đang có lần tua khác chạy: báo bằng câu riêng", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(status(0));
    vi.spyOn(apiClient, "post").mockRejectedValue(problem(409, { code: "DEMO_CLOCK_BUSY" }));
    renderCard();

    await pickDate(dateInput(7));
    await userEvent.click(screen.getByRole("button", { name: "Tua tới ngày này" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Đang có một lần tua khác chạy");
  });

  it("Về ngày thật: có hộp xác nhận ngắn rồi mới gọi reset", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(status(12));
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(status(0));
    renderCard();

    await userEvent.click(await screen.findByRole("button", { name: "Về ngày thật" }));
    const dialog = await screen.findByRole("dialog");
    expect(post).not.toHaveBeenCalled();
    await userEvent.click(within(dialog).getByRole("button", { name: "Về ngày thật" }));

    await waitFor(() => expect(post).toHaveBeenCalledWith("/dev/clock/reset"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("Về ngày thật: bấm Giữ nguyên thì không gọi gì", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(status(12));
    const post = vi.spyOn(apiClient, "post");
    renderCard();

    await userEvent.click(await screen.findByRole("button", { name: "Về ngày thật" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Giữ nguyên" }));

    expect(post).not.toHaveBeenCalled();
  });

  it("Backend không bật chế độ này (404): báo rõ, không có ô chọn ngày", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(problem(404, {}));
    renderCard();

    expect(await screen.findByText(/không bật chế độ tua thời gian/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Tua tới ngày")).not.toBeInTheDocument();
  });

  it("lỗi tải đồng hồ: có nút Thử lại", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("down"));
    renderCard();

    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được đồng hồ hệ thống");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});
