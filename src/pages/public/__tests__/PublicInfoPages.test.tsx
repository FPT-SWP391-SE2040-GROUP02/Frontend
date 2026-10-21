import { configureStore } from "@reduxjs/toolkit";
import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import authReducer from "@/entities/user/model/authSlice";
import { ROUTES } from "@/shared/config/routes.config";
import { ContactPage } from "../ContactPage";
import { FaqPage } from "../FaqPage";
import { PrivacyPage } from "../PrivacyPage";
import { TermsPage } from "../TermsPage";

function renderPage(page: ReactNode) {
  const store = configureStore({ reducer: { auth: authReducer } });
  return render(
    <Provider store={store}>
      <MemoryRouter>{page}</MemoryRouter>
    </Provider>,
  );
}

describe("Trang thông tin công khai", () => {
  it("Hỏi đáp có tiêu đề, nhóm câu hỏi và liên kết sang Liên hệ", () => {
    renderPage(<FaqPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Câu hỏi thường gặp" })).toBeTruthy();
    expect(screen.getByText("LegacyVault là gì?")).toBeTruthy();
    const contact = screen.getByRole("link", { name: "Liên hệ hỗ trợ" });
    expect(contact.getAttribute("href")).toBe(ROUTES.PUBLIC.CONTACT);
  });

  it("Liên hệ hiển thị kênh hỗ trợ và đường về Hỏi đáp", () => {
    renderPage(<ContactPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Liên hệ LegacyVault" })).toBeTruthy();
    expect(screen.getByText("Hỗ trợ chung")).toBeTruthy();
    const faq = screen.getByRole("link", { name: "Xem câu hỏi thường gặp" });
    expect(faq.getAttribute("href")).toBe(ROUTES.PUBLIC.FAQ);
  });

  it("Điều khoản báo rõ đây là bản nháp", () => {
    renderPage(<TermsPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Điều khoản sử dụng" })).toBeTruthy();
    expect(screen.getByRole("note").textContent).toContain("bản nháp");
  });

  it("Quyền riêng tư báo rõ đây là bản nháp và có mục eKYC", () => {
    renderPage(<PrivacyPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Chính sách quyền riêng tư" }),
    ).toBeTruthy();
    expect(screen.getByRole("note").textContent).toContain("bản nháp");
    expect(screen.getByRole("heading", { name: "2. Dữ liệu eKYC" })).toBeTruthy();
  });

  it("Thanh điều hướng của trang đánh dấu trang hiện tại", () => {
    renderPage(<TermsPage />);
    const nav = screen.getByRole("navigation", { name: "Trang thông tin" });
    const current = within(nav).getByRole("link", { name: "Điều khoản" });
    expect(current.getAttribute("aria-current")).toBe("page");
  });

  it("Dùng chung đầu trang và chân trang với landing, kèm đủ liên kết hỗ trợ và pháp lý", () => {
    renderPage(<FaqPage />);
    const header = screen.getByRole("navigation", { name: "Điều hướng chính" });
    expect(within(header).getByRole("link", { name: "Gói dịch vụ" }).getAttribute("href")).toBe(
      "/#goi",
    );
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByRole("link", { name: "Quyền riêng tư" }).getAttribute("href")).toBe(
      ROUTES.PUBLIC.PRIVACY,
    );
    expect(within(footer).getByRole("link", { name: "Hỏi đáp" }).getAttribute("href")).toBe(
      ROUTES.PUBLIC.FAQ,
    );
  });
});
