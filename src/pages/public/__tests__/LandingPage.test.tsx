import { configureStore } from "@reduxjs/toolkit";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import authReducer from "@/entities/user/model/authSlice";
import { ROUTES } from "@/shared/config/routes.config";
import { LandingPage } from "../LandingPage";

function renderLanding() {
  const store = configureStore({ reducer: { auth: authReducer } });
  return render(
    <Provider store={store}>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe("Landing", () => {
  it("mỗi mục trên thanh điều hướng đều có đích neo trong trang", () => {
    const { container } = renderLanding();
    const nav = screen.getByRole("navigation", { name: "Điều hướng chính" });
    for (const link of within(nav).getAllByRole("link")) {
      const target = link.getAttribute("href")?.replace("#", "") ?? "";
      expect(container.querySelector(`[id="${target}"]`), target).not.toBeNull();
    }
  });

  it("có một tiêu đề cấp 1 và các mục thân trang theo thứ tự thông điệp", () => {
    renderLanding();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const titles = screen.getAllByRole("heading", { level: 2 }).map((node) => node.textContent);
    expect(titles[0]).toContain("Tài sản số của bạn nằm rải rác");
    expect(titles).toContain("Bắt đầu lập kho hôm nay.");
  });

  it("hỏi đáp có liên kết sang trang đầy đủ và nút kêu gọi dẫn tới đăng ký", () => {
    renderLanding();
    expect(screen.getByRole("link", { name: "Xem tất cả câu hỏi" }).getAttribute("href")).toBe(
      ROUTES.PUBLIC.FAQ,
    );
    expect(screen.getAllByRole("link", { name: "Tạo tài khoản" })[0].getAttribute("href")).toBe(
      ROUTES.AUTH.REGISTER,
    );
  });
});
