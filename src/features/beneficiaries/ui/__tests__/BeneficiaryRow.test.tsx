import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import authReducer from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { VAULT_ID, CONTAINER_ID, CREATED_AT } from "@/shared/api/__tests__/backend.fixtures";
import type { z } from "zod";
import type { beneficiaryResponseSchema } from "../../model/beneficiary.schema";
import { BeneficiaryRow } from "../BeneficiaryRow";

const record: z.infer<typeof beneficiaryResponseSchema> = {
  id: CONTAINER_ID,
  citizenIdLast4: "8901",
  fullName: "Nguyễn Văn An",
  dateOfBirth: "1990-05-20",
  email: "an@example.test",
  phone: null,
  isMinor: false,
  minorAcknowledgedAt: null,
  containerIds: [VAULT_ID, CONTAINER_ID],
  createdAt: CREATED_AT,
  updatedAt: null,
  etag: '"0"',
};

let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("beneficiary-row-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function renderRow(overrides: Partial<z.infer<typeof beneficiaryResponseSchema>> = {}) {
  const store = configureStore({ reducer: { auth: authReducer } });
  return render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <ul>
            <BeneficiaryRow vaultId={VAULT_ID} record={{ ...record, ...overrides }} />
          </ul>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe("hàng người nhận", () => {
  it("hiện tên, 4 số cuối CCCD, liên hệ và số nhóm đang gắn", () => {
    renderRow();
    expect(screen.getByText("Nguyễn Văn An")).toBeInTheDocument();
    expect(screen.getByText(/\*\*\*\*8901 · an@example.test/)).toBeInTheDocument();
    expect(screen.getByText("2 nhóm")).toBeInTheDocument();
  });

  it("báo chưa vào nhóm nào và rơi về số điện thoại khi không có email", () => {
    renderRow({ containerIds: [], email: null, phone: "0901234567" });
    expect(screen.getByText("Chưa vào nhóm nào")).toBeInTheDocument();
    expect(screen.getByText(/0901234567/)).toBeInTheDocument();
  });

  it("Sửa mở hộp thoại không cho đổi CCCD và gửi etag hiện tại khi lưu", async () => {
    const put = vi
      .spyOn(apiClient, "put")
      .mockResolvedValue({ ...record, fullName: "Nguyễn Văn Bình", etag: '"1"' });
    renderRow();
    fireEvent.click(screen.getByRole("button", { name: "Sửa hồ sơ Nguyễn Văn An" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByLabelText("Số CCCD")).not.toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText("Họ tên"), {
      target: { value: "Nguyễn Văn Bình" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu hồ sơ" }));
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put.mock.calls[0][1]).toMatchObject({ etag: '"0"', fullName: "Nguyễn Văn Bình" });
  });

  it("khóa nút xóa khi hồ sơ còn nằm trong nhóm", async () => {
    renderRow();
    fireEvent.click(screen.getByRole("button", { name: "Sửa hồ sơ Nguyễn Văn An" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("checkbox"));
    expect(within(dialog).getByRole("button", { name: "Xóa hồ sơ" })).toBeDisabled();
    expect(within(dialog).getByText(/Gỡ khỏi các nhóm trước khi xóa/)).toBeInTheDocument();
  });
});
