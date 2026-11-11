import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { VerifierSettingsPage } from "../VerifierSettingsPage";

vi.mock("@/features/auth", () => ({ LoginMethodsPanel: () => <p>Phương thức đăng nhập</p> }));

afterEach(cleanup);

function renderPage(extra: Record<string, string>) {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(
    setCredentials({
      user: {
        id: "11111111-1111-4111-8111-111111111111",
        email: "tung@example.test",
        fullName: "LS. Võ Thanh Tùng",
        role: "VERIFIER",
        status: "ACTIVE",
        emailVerified: true,
        hasPassword: true,
        createdAt: "2026-10-01T00:00:00Z",
        ...extra,
      },
    }),
  );
  return render(
    <Provider store={store}>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <MemoryRouter>
          <VerifierSettingsPage />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe("trang Tài khoản của Người xét duyệt", () => {
  it("chỉ hiện tên và vai trò, không hiện chứng chỉ hành nghề, thẻ luật sư, email hay số điện thoại", () => {
    renderPage({ practiceCertificateNumber: "CCHN-4521", lawyerCardNumber: "12854/LS" });

    const section = screen.getByRole("region", { name: "Hồ sơ Người xét duyệt" });
    expect(section).toHaveTextContent("LS. Võ Thanh Tùng");
    expect(section).toHaveTextContent("Người xét duyệt");
    expect(section).not.toHaveTextContent("tung@example.test");
    expect(screen.queryByText("Chứng chỉ hành nghề")).not.toBeInTheDocument();
    expect(screen.queryByText("Thẻ luật sư")).not.toBeInTheDocument();
    expect(screen.queryByText("CCHN-4521")).not.toBeInTheDocument();
    expect(screen.queryByText("Quản trị viên chưa nhập")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Tài khoản" })).toBeInTheDocument();
    expect(screen.queryByText("Số điện thoại")).not.toBeInTheDocument();
    expect(screen.getByText("Phương thức đăng nhập")).toBeInTheDocument();
  });
});
