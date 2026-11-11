import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { documentFixture } from "@/entities/handoverDocument/testing/documentFixture";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { apiClient } from "@/shared/api/axiosClient";
import { ExecutorDocuments } from "../ExecutorDocuments";

const WAITING_ID = "0199e7a4-5555-7c3e-9a51-3f0f5d2b8a10";

const waiting = () =>
  documentFixture({
    id: WAITING_ID,
    status: "WAIT_VERIFIER",
    verifier: { signedByName: "", checks: [], signedAt: null },
    completedAt: null,
  });

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ExecutorDocuments />
    </QueryClientProvider>,
  );
}

beforeEach(() => accessTokenMemory.set("fixture-token"));
afterEach(() => {
  vi.restoreAllMocks();
  accessTokenMemory.clear();
});

describe("ExecutorDocuments", () => {
  it("chưa có biên bản nào thì nói rõ, và nói Người thực thi không phải điền hay ký", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText(/Chưa có biên bản nào trong các kho/)).toBeInTheDocument();
    expect(screen.getByText(/bạn không cần điền hay ký/)).toBeInTheDocument();
  });

  it("chỉ xem lại: biên bản chưa xong ghi Chưa xong, biên bản đã hoàn tất ghi Hoàn tất, không có nút điền hay ký", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([waiting(), documentFixture()]);
    const post = vi.spyOn(apiClient, "post");
    renderPage();

    expect(await screen.findByText("Hoàn tất")).toBeInTheDocument();
    expect(screen.getByText("Chưa xong")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Điền thông tin|Ký và gửi/ }),
    ).not.toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("mở một biên bản thì thấy Phần 1 đã chép từ hồ sơ chứng tử", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue([documentFixture()]);
    renderPage();

    await user.click(await screen.findByRole("button", { name: /Biên bản đồng ý nhận/ }));
    await user.click(screen.getByRole("button", { name: "Xem toàn văn biên bản" }));

    const text = screen.getByRole("article", { name: "Biên bản đồng ý nhận di sản thừa kế" });
    expect(text).toHaveTextContent("Chủ kho Nguyễn Văn A");
    expect(text).toHaveTextContent("do UBND phường Bến Thành, Thành phố Hồ Chí Minh đăng ký khai tử");
    expect(text).not.toHaveTextContent("0456/2026");
  });

  it("không tải được thì báo lỗi và cho thử lại", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("mất mạng"));
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được các biên bản");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});
