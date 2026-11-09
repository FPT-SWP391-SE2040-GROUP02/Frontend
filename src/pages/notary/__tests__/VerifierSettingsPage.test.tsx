import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
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
      <MemoryRouter>
        <VerifierSettingsPage />
      </MemoryRouter>
    </Provider>,
  );
}

describe("trang Tài khoản của tôi của Người xét duyệt", () => {
  it("chỉ hiện chứng chỉ hành nghề và thẻ luật sư, không hiện email hay số điện thoại", () => {
    renderPage({ practiceCertificateNumber: "CCHN-4521", lawyerCardNumber: "12854/LS" });

    const section = screen.getByRole("region", { name: "Hồ sơ hành nghề" });
    expect(section).toHaveTextContent("Chứng chỉ hành nghề");
    expect(section).toHaveTextContent("CCHN-4521");
    expect(section).toHaveTextContent("Thẻ luật sư");
    expect(section).toHaveTextContent("12854/LS");
    expect(section).not.toHaveTextContent("tung@example.test");
    expect(screen.queryByText("Số điện thoại")).not.toBeInTheDocument();
    expect(screen.getByText("Phương thức đăng nhập")).toBeInTheDocument();
  });

  it("chưa có dữ liệu thì báo quản trị viên chưa nhập", () => {
    renderPage({});

    expect(screen.getAllByText("Quản trị viên chưa nhập")).toHaveLength(2);
  });
});
