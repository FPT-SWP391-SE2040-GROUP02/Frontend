import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api/axiosClient";
import { RECEIVE_STEP_TITLES } from "../../model/receiveSteps";
import { ReceiveGuide } from "../ReceiveGuide";

function renderGuide(current: number | null, defaultOpen = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ReceiveGuide current={current} defaultOpen={defaultOpen} />
    </QueryClientProvider>,
  );
}

function stepItems() {
  const list = screen.getByRole("list", { name: "Các bước nhận tài sản" });
  return within(list).getAllByRole("listitem");
}

afterEach(() => vi.restoreAllMocks());

describe("ReceiveGuide", () => {
  it("nêu đủ 6 bước, bắt đầu bằng việc người nhận tự gửi yêu cầu", () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({});
    renderGuide(null);

    const items = stepItems();
    expect(items).toHaveLength(6);
    RECEIVE_STEP_TITLES.forEach((title, index) => expect(items[index]).toHaveTextContent(title));
    expect(screen.getByText(/không tự biết khi nào Chủ tài sản qua đời/)).toBeInTheDocument();
    expect(screen.queryByText("Bạn đang ở đây")).not.toBeInTheDocument();
  });

  it("tô bước đang làm, các bước trước ghi đã xong", () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({});
    renderGuide(3);

    const items = stepItems();
    expect(items[2]).toHaveAttribute("aria-current", "step");
    expect(items[2]).toHaveTextContent("Bạn đang ở đây");
    expect(screen.getAllByText("Đã xong")).toHaveLength(2);
  });

  it("ghi ai làm ở từng bước; bấm một bước thì mở lời giải thích, bấm lại thì đóng", async () => {
    // Chuẩn bị
    vi.spyOn(apiClient, "get").mockResolvedValue({});
    renderGuide(null);
    const items = stepItems();
    expect(items[1]).toHaveTextContent("Luật sư");
    expect(items[4]).toHaveTextContent("Ba bên cùng ký");
    expect(items[5]).toHaveTextContent("Bạn và Người thực thi");
    const button = within(items[0]).getByRole("button");
    expect(button).toHaveAttribute("aria-expanded", "false");

    // Hành động, Kiểm tra
    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("bước đang làm tự mở sẵn lời giải thích", () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({});
    renderGuide(3);

    const items = stepItems();
    expect(within(items[2]).getByRole("button")).toHaveAttribute("aria-expanded", "true");
    expect(within(items[0]).getByRole("button")).toHaveAttribute("aria-expanded", "false");
  });

  it("số ngày tải lấy từ tham số Admin đã đặt", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({ "Handover.GrantWindowDays": 45 });
    renderGuide(null);

    expect(await screen.findByText(/trong 45 ngày/)).toBeInTheDocument();
  });

  it("thu gọn hoặc mở sẵn theo nơi dùng", () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({});
    const closed = renderGuide(null, false);
    expect(closed.container.querySelector("details")).not.toHaveAttribute("open");
    closed.unmount();

    const opened = renderGuide(null, true);
    expect(opened.container.querySelector("details")).toHaveAttribute("open");
  });
});
