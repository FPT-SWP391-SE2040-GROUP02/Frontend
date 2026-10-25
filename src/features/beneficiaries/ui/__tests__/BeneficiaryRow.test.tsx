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

function renderRow(
  overrides: Partial<z.infer<typeof beneficiaryResponseSchema>> = {},
  groupNames: Record<string, string> = {},
) {
  const store = configureStore({ reducer: { auth: authReducer } });
  return render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <table>
            <tbody>
              <BeneficiaryRow
                vaultId={VAULT_ID}
                record={{ ...record, ...overrides }}
                groupNames={groupNames}
              />
            </tbody>
          </table>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe("hàng người nhận", () => {
  it("hiện tên, 4 số cuối CCCD, liên hệ và số gói bàn giao đang gắn", () => {
    renderRow();
    expect(screen.getByText("Nguyễn Văn An")).toBeInTheDocument();
    expect(screen.getByText("Sinh 20/05/1990")).toBeInTheDocument();
    expect(screen.getByText(/•••• 8901/)).toBeInTheDocument();
    expect(screen.getByText("an@example.test")).toBeInTheDocument();
    expect(screen.getByText("2 gói bàn giao · đang dùng 1 suất")).toBeInTheDocument();
  });

  it("báo chưa vào gói bàn giao nào và rơi về số điện thoại khi không có email", () => {
    renderRow({ containerIds: [], email: null, phone: "0901234567" });
    expect(screen.getByText("Chưa vào gói bàn giao nào · chưa dùng suất")).toBeInTheDocument();
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
    expect(within(dialog).getByText("•••••••• 8901")).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText(/^Họ và tên/), {
      target: { value: "Nguyễn Văn Bình" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu thay đổi" }));
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put.mock.calls[0][1]).toMatchObject({ etag: '"0"', fullName: "Nguyễn Văn Bình" });
  });

  it("hộp thoại sửa báo số gói bàn giao bị ảnh hưởng và không còn nút xóa", async () => {
    renderRow();
    fireEvent.click(screen.getByRole("button", { name: "Sửa hồ sơ Nguyễn Văn An" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/Người này đang thuộc 2 gói bàn giao/)).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /Xóa/ })).not.toBeInTheDocument();
  });

  it("khóa Sửa khi gói dịch vụ đang gia hạn nhưng vẫn cho Xóa", () => {
    const store = configureStore({ reducer: { auth: authReducer } });
    render(
      <Provider store={store}>
        <QueryClientProvider client={client}>
          <MemoryRouter>
            <table>
              <tbody>
                <BeneficiaryRow vaultId={VAULT_ID} record={record} readOnly />
              </tbody>
            </table>
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>,
    );
    expect(screen.getByRole("button", { name: "Sửa hồ sơ Nguyễn Văn An" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Xóa hồ sơ Nguyễn Văn An" })).toBeEnabled();
  });

  it("Xóa mở hộp thoại xác nhận và gọi API xóa khi hồ sơ chưa vào gói bàn giao", async () => {
    const remove = vi.spyOn(apiClient, "delete").mockResolvedValue(undefined);
    renderRow({ containerIds: [] });
    fireEvent.click(screen.getByRole("button", { name: "Xóa hồ sơ Nguyễn Văn An" }));
    const dialog = await screen.findByRole("dialog");
    const confirm = within(dialog).getByRole("button", { name: "Xóa người nhận" });
    expect(confirm).toBeDisabled();
    fireEvent.click(within(dialog).getByRole("checkbox"));
    fireEvent.click(confirm);
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1));
  });

  it("Xóa báo không xóa được khi hồ sơ còn nằm trong gói bàn giao", async () => {
    const remove = vi.spyOn(apiClient, "delete").mockResolvedValue(undefined);
    renderRow();
    fireEvent.click(screen.getByRole("button", { name: "Xóa hồ sơ Nguyễn Văn An" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Không xóa được người nhận")).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Xóa hồ sơ" })).not.toBeInTheDocument();
    expect(remove).not.toHaveBeenCalled();
  });

  it("chặn xóa nêu rõ tên gói bàn giao, kèm lối mở gói bàn giao", async () => {
    renderRow({}, { [VAULT_ID]: "Giấy tờ gia đình", [CONTAINER_ID]: "Tài khoản game" });
    fireEvent.click(screen.getByRole("button", { name: "Xóa hồ sơ Nguyễn Văn An" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Giấy tờ gia đình");
    expect(dialog).toHaveTextContent("Tài khoản game");
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Nguyễn Văn An đang ở trong 2 gói bàn giao. Hãy gỡ người nhận khỏi các gói trên, rồi xóa lại.",
    );
    expect(within(dialog).getByRole("button", { name: "Đóng" })).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Mở gói bàn giao" })).toHaveAttribute(
      "href",
      "/dashboard/assets?tab=groups",
    );
  });

  it("chưa tra được tên gói bàn giao thì chỉ nêu số gói bàn giao", async () => {
    renderRow();
    fireEvent.click(screen.getByRole("button", { name: "Xóa hồ sơ Nguyễn Văn An" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("alert")).toHaveTextContent("đang ở trong 2 gói bàn giao.");
  });
});
