import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api/axiosClient";
import { RecipientGuide } from "../RecipientGuide";

function renderGuide(defaultOpen: boolean) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <RecipientGuide defaultOpen={defaultOpen} />
    </QueryClientProvider>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("RecipientGuide", () => {
  it("nêu đủ 5 bước theo đúng thứ tự từ nhận lời mời tới tải nội dung", () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({});
    renderGuide(true);

    const titles = [
      "Nhận lời mời",
      "Xác minh danh tính",
      "Nhập khóa mở gói (nếu được yêu cầu)",
      "Đồng ý hoặc từ chối",
      "Xem và tải nội dung",
    ];
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(5);
    titles.forEach((title, index) => expect(items[index]).toHaveTextContent(title));
  });

  it("mốc thời gian lấy từ tham số Admin đã đặt", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      "Handover.ResponseWindowDays": 9,
      "Handover.DecisionWindowDays": 3,
      "Handover.GrantWindowDays": 45,
    });
    renderGuide(true);

    expect(await screen.findByText(/trong 9 ngày kể từ lúc được mời/)).toBeInTheDocument();
    expect(screen.getByText(/có 3 ngày để quyết định/)).toBeInTheDocument();
    expect(screen.getByText(/trong 45 ngày/)).toBeInTheDocument();
  });

  it("mặc định thu gọn ở cổng nhận, mở sẵn ở trang lời mời", () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({});
    const closed = renderGuide(false);
    expect(closed.container.querySelector("details")).not.toHaveAttribute("open");
    closed.unmount();

    const opened = renderGuide(true);
    expect(opened.container.querySelector("details")).toHaveAttribute("open");
  });
});
