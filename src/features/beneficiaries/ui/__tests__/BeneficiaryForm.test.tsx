import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AxiosError, AxiosHeaders } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import authReducer from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { VAULT_ID } from "@/shared/api/__tests__/backend.fixtures";
import { BeneficiaryForm } from "../BeneficiaryForm";

let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("beneficiary-form-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function renderForm(currentUser?: { id: string; email: string; fullName: string }) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: currentUser
      ? {
          auth: {
            user: {
              ...currentUser,
              role: "OWNER" as const,
              status: "ACTIVE" as const,
              createdAt: "2026-01-01T00:00:00Z",
            },
            isAuthenticated: true,
            isHydrating: false,
          },
        }
      : undefined,
  });
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <BeneficiaryForm vaultId={VAULT_ID} />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe("form thêm người nhận", () => {
  it("bỏ trống họ tên và ngày sinh thì báo tiếng Việt, không hiện chữ Invalid", async () => {
    const post = vi.spyOn(apiClient, "post");
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: "Thêm người nhận" }));
    expect(await screen.findByText("Vui lòng nhập họ tên.")).toBeInTheDocument();
    expect(screen.getByText("Vui lòng chọn ngày sinh.")).toBeInTheDocument();
    expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("hiện lỗi ngay dưới ô tương ứng", async () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: "Thêm người nhận" }));
    const nameLabel = (await screen.findByLabelText(/^Họ và tên/)).closest("label") as HTMLElement;
    expect(nameLabel).toHaveTextContent("Vui lòng nhập họ tên.");
  });

  it("gói Free bị chặn thì báo nổi bật kèm đường nâng cấp", async () => {
    vi.spyOn(apiClient, "post").mockRejectedValue(
      new AxiosError("private", undefined, undefined, undefined, {
        status: 403,
        statusText: "Forbidden",
        config: { headers: new AxiosHeaders() },
        headers: {},
        data: { code: "PAID_TIER_REQUIRED" },
      }),
    );
    renderForm();
    fireEvent.change(screen.getByLabelText(/^Số CCCD/), { target: { value: "083206000699" } });
    fireEvent.change(screen.getByLabelText(/^Họ và tên/), { target: { value: "Quan" } });
    fireEvent.change(screen.getByLabelText(/^Ngày sinh/), { target: { value: "2000-02-16" } });
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "quan@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Thêm người nhận" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("gói dịch vụ trả phí");
    expect(screen.getByRole("link", { name: "Xem gói dịch vụ" })).toHaveAttribute(
      "href",
      "/pricing",
    );
  });

  it("kiểm tra CCCD không đủ 12 chữ số báo lỗi ngay dưới ô CCCD", async () => {
    const post = vi.spyOn(apiClient, "post");
    renderForm();
    fireEvent.change(screen.getByLabelText(/^Số CCCD/), { target: { value: "123456789" } });
    fireEvent.change(screen.getByLabelText(/^Họ và tên/), { target: { value: "Nguyễn Văn A" } });
    fireEvent.change(screen.getByLabelText(/^Ngày sinh/), { target: { value: "2000-01-01" } });
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "a@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Thêm người nhận" }));
    const citizenIdLabel = (await screen.findByLabelText(/^Số CCCD/)).closest(
      "label",
    ) as HTMLElement;
    expect(citizenIdLabel).toHaveTextContent("CCCD cần đủ 12 chữ số.");
    expect(post).not.toHaveBeenCalled();
  });

  it("chặn email trùng với email của Chủ kho ngay trên form", async () => {
    const post = vi.spyOn(apiClient, "post");
    renderForm({ id: "owner-1", email: "nthanhduy310@gmail.com", fullName: "Nguyễn Thanh Duy" });
    fireEvent.change(screen.getByLabelText(/^Số CCCD/), { target: { value: "087206004150" } });
    fireEvent.change(screen.getByLabelText(/^Họ và tên/), {
      target: { value: "Nguyễn Thanh Duy" },
    });
    fireEvent.change(screen.getByLabelText(/^Ngày sinh/), { target: { value: "2006-10-12" } });
    fireEvent.change(screen.getByLabelText(/^Email/), {
      target: { value: "nthanhduy310@gmail.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Thêm người nhận" }));
    const emailLabel = (await screen.findByLabelText(/^Email/)).closest("label") as HTMLElement;
    expect(emailLabel).toHaveTextContent(
      "Email người thụ hưởng không được trùng với email của Chủ kho.",
    );
    expect(post).not.toHaveBeenCalled();
  });

  it("chặn ngày sinh ở tương lai ngay trên form", async () => {
    const post = vi.spyOn(apiClient, "post");
    renderForm();
    fireEvent.change(screen.getByLabelText(/^Số CCCD/), { target: { value: "087206004150" } });
    fireEvent.change(screen.getByLabelText(/^Họ và tên/), {
      target: { value: "Nguyễn Thanh Duy" },
    });
    fireEvent.change(screen.getByLabelText(/^Ngày sinh/), { target: { value: "2099-01-01" } });
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "duy@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Thêm người nhận" }));
    const dobLabel = (await screen.findByLabelText(/^Ngày sinh/)).closest("label") as HTMLElement;
    expect(dobLabel).toHaveTextContent("Ngày sinh không được ở tương lai.");
    expect(post).not.toHaveBeenCalled();
  });

  it("ánh xạ lỗi validation từ máy chủ lên đúng ô input và hiển thị danh sách trường lỗi ở banner", async () => {
    vi.spyOn(apiClient, "post").mockRejectedValue(
      new AxiosError("Bad Request", undefined, undefined, undefined, {
        status: 400,
        statusText: "Bad Request",
        config: { headers: new AxiosHeaders() },
        headers: {},
        data: {
          code: "VALIDATION_ERROR",
          errors: {
            email: ["Email người thụ hưởng không được trùng với email của Chủ kho."],
            citizenId: ["Số CCCD người thụ hưởng không được trùng với CCCD của Chủ kho."],
          },
        },
      }),
    );
    renderForm();
    fireEvent.change(screen.getByLabelText(/^Số CCCD/), { target: { value: "087206004150" } });
    fireEvent.change(screen.getByLabelText(/^Họ và tên/), {
      target: { value: "Nguyễn Thanh Duy" },
    });
    fireEvent.change(screen.getByLabelText(/^Ngày sinh/), { target: { value: "2006-10-12" } });
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "other@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Thêm người nhận" }));

    const emailLabel = (await screen.findByLabelText(/^Email/)).closest("label") as HTMLElement;
    expect(emailLabel).toHaveTextContent(
      "Email người thụ hưởng không được trùng với email của Chủ kho.",
    );

    const citizenIdLabel = screen.getByLabelText(/^Số CCCD/).closest("label") as HTMLElement;
    expect(citizenIdLabel).toHaveTextContent(
      "Số CCCD người thụ hưởng không được trùng với CCCD của Chủ kho.",
    );

    // Banner hiển thị chỉ dẫn rõ ràng trường nào đang bị lỗi
    expect(
      screen.getByText(/Vui lòng kiểm tra và chỉnh sửa lại các ô có thông báo lỗi màu đỏ ở trên/),
    ).toBeInTheDocument();
  });
});
