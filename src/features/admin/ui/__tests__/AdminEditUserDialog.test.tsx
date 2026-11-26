import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { AdminUserDetail } from "../AdminUserDetail";

const USER_ID = "00000000-0000-4000-8000-000000000070";

function detail(over: Record<string, unknown> = {}) {
  return {
    id: USER_ID,
    email: "ha.le@example.test",
    fullName: "Lê Thu Hà",
    role: "VERIFIER",
    status: "ACTIVE",
    emailVerified: true,
    createdAt: "2026-10-01T02:00:00+00:00",
    lastLoginAt: null,
    etag: "e-1",
    phone: "0912345678",
    practiceCertificateNumber: "CC-123",
    lawyerCardNumber: null,
    assignedCases: [],
    recentDecisions: [],
    recentActivity: [],
    ...over,
  };
}

function renderDetail() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const store = configureStore({ reducer: { auth: () => ({ user: null }) } });
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <AdminUserDetail userId={USER_ID} onBack={() => {}} />
      </QueryClientProvider>
    </Provider>,
  );
}

function failure(data: unknown, status: number) {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
  return new AxiosError("x", "ERR", config, undefined, {
    config,
    data,
    status,
    statusText: "x",
    headers: new AxiosHeaders(),
  });
}

beforeEach(() => {
  accessTokenMemory.set("admin-fixture");
});
afterEach(() => {
  cleanup();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

describe("Admin sửa thông tin tài khoản nhân sự", () => {
  it("hiện thông tin hiện có và gửi đúng bốn trường khi lưu, rồi tải lại chi tiết", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(detail());
    const put = vi.spyOn(apiClient, "put").mockResolvedValue({ ...detail(), fullName: "Lê Hà" });
    renderDetail();
    expect(await screen.findByText("0912345678")).toBeInTheDocument();
    expect(screen.getByText("CC-123")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Sửa thông tin của Lê Thu Hà" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText(/Họ và tên/)).toHaveValue("Lê Thu Hà");
    expect(within(dialog).getByLabelText(/Số điện thoại/)).toHaveValue("0912345678");
    await user.clear(within(dialog).getByLabelText(/Họ và tên/));
    await user.type(within(dialog).getByLabelText(/Họ và tên/), "Lê Hà");
    await user.clear(within(dialog).getByLabelText(/Số điện thoại/));
    await user.type(within(dialog).getByLabelText(/Số điện thoại/), "098 765 4321");
    await user.type(within(dialog).getByLabelText(/Số thẻ luật sư/), "LS-678");
    await user.click(within(dialog).getByRole("button", { name: "Lưu thông tin" }));

    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put).toHaveBeenCalledWith(`/admin/users/${USER_ID}/profile`, {
      fullName: "Lê Hà",
      phone: "098 765 4321",
      practiceCertificateNumber: "CC-123",
      lawyerCardNumber: "LS-678",
    });
    expect(await screen.findByText("Đã lưu thông tin tài khoản.")).toBeInTheDocument();
    await waitFor(() => expect(get.mock.calls.length).toBeGreaterThan(1));
  });

  it("họ tên trống hoặc số điện thoại sai thì báo ngay dưới ô và không gửi", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(detail());
    const put = vi.spyOn(apiClient, "put");
    renderDetail();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /Sửa thông tin của/ }));
    const dialog = await screen.findByRole("dialog");
    await user.clear(within(dialog).getByLabelText(/Họ và tên/));
    await user.clear(within(dialog).getByLabelText(/Số điện thoại/));
    await user.type(within(dialog).getByLabelText(/Số điện thoại/), "3232");
    await user.click(within(dialog).getByRole("button", { name: "Lưu thông tin" }));

    expect(await within(dialog).findByText("Vui lòng nhập họ và tên.")).toBeInTheDocument();
    expect(within(dialog).getByText(/Số điện thoại không đúng định dạng/)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/Số điện thoại/)).toHaveAttribute("aria-invalid", "true");
    expect(put).not.toHaveBeenCalled();
  });

  it("số điện thoại đã thuộc tài khoản khác thì hiện lý do riêng của Backend", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(detail());
    vi.spyOn(apiClient, "put").mockRejectedValue(failure({ code: "PHONE_ALREADY_EXISTS" }, 409));
    renderDetail();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /Sửa thông tin của/ }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Lưu thông tin" }));
    expect(
      await within(dialog).findByText("Số điện thoại này đã thuộc một tài khoản khác."),
    ).toBeInTheDocument();
  });

  it("Quản trị viên không có ô chứng chỉ và thẻ luật sư; Chủ tài sản không có nút sửa", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(detail({ role: "ADMIN" }));
    renderDetail();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: /Sửa thông tin của/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByLabelText(/Số chứng chỉ hành nghề/)).not.toBeInTheDocument();
    expect(within(dialog).queryByLabelText(/Số thẻ luật sư/)).not.toBeInTheDocument();
    cleanup();

    vi.spyOn(apiClient, "get").mockResolvedValue(detail({ role: "USER" }));
    renderDetail();
    await screen.findByText("Lê Thu Hà");
    expect(screen.queryByRole("button", { name: /Sửa thông tin của/ })).not.toBeInTheDocument();
  });
});
