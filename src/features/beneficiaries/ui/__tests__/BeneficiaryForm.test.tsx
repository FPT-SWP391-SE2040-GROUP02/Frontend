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

function renderForm() {
  const store = configureStore({ reducer: { auth: authReducer } });
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
    fireEvent.click(screen.getByRole("button", { name: "Tạo hồ sơ người nhận" }));
    expect(await screen.findByText("Vui lòng nhập họ tên.")).toBeInTheDocument();
    expect(screen.getByText("Vui lòng chọn ngày sinh.")).toBeInTheDocument();
    expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("hiện lỗi ngay dưới ô tương ứng", async () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: "Tạo hồ sơ người nhận" }));
    const nameLabel = (await screen.findByLabelText("Họ tên")).closest("label") as HTMLElement;
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
    fireEvent.change(screen.getByLabelText("Số CCCD"), { target: { value: "083206000699" } });
    fireEvent.change(screen.getByLabelText("Họ tên"), { target: { value: "Quan" } });
    fireEvent.change(screen.getByLabelText("Ngày sinh"), { target: { value: "2000-02-16" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "quan@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Tạo hồ sơ người nhận" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("gói dịch vụ trả phí");
    expect(screen.getByRole("link", { name: "Xem gói dịch vụ" })).toHaveAttribute(
      "href",
      "/pricing",
    );
  });
});
