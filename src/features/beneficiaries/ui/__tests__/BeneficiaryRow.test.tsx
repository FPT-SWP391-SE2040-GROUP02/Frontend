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
  citizenId: "012345678901",
  fullName: "Nguyễn Văn An",
  dateOfBirth: "1990-05-20",
  email: "an@example.test",
  phone: null,
  message: null,
  assetIds: [VAULT_ID, CONTAINER_ID],
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
  assetNames: Record<string, string> = {},
  locked = false,
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
                assetNames={assetNames}
                locked={locked}
              />
            </tbody>
          </table>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe("hàng người nhận", () => {
  it("email bị báo không giao được thì hiện cảnh báo, ngược lại không hiện", () => {
    renderRow({ emailUndeliverable: true });
    expect(screen.getByRole("alert")).toHaveTextContent("Không gửi được thư tới email này");
    cleanup();
    renderRow({});
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("kho bị khóa thì khóa cả Sửa lẫn Xóa", () => {
    renderRow({}, {}, true);
    expect(screen.getByRole("button", { name: /Sửa hồ sơ/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Xóa hồ sơ/ })).toBeDisabled();
  });

  it("kho không bị khóa thì Sửa và Xóa bấm được", () => {
    renderRow();
    expect(screen.getByRole("button", { name: /Sửa hồ sơ/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Xóa hồ sơ/ })).toBeEnabled();
  });

  it("hiện tên, số CCCD đầy đủ, liên hệ và số tài sản được gán", () => {
    renderRow();
    expect(screen.getByText("Nguyễn Văn An")).toBeInTheDocument();
    expect(screen.getByText("Sinh 20/05/1990")).toBeInTheDocument();
    expect(screen.getByText("012345678901")).toBeInTheDocument();
    expect(screen.getByText("an@example.test")).toBeInTheDocument();
    expect(screen.getByText("2 tài sản")).toBeInTheDocument();
  });

  it("báo chưa được gán tài sản và rơi về số điện thoại khi không có email", () => {
    renderRow({ assetIds: [], email: null, phone: "0901234567" });
    expect(screen.getByText("Chưa được gán tài sản")).toBeInTheDocument();
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
    expect(within(dialog).getByText("012345678901")).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText(/^Họ và tên/), {
      target: { value: "Nguyễn Văn Bình" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu thay đổi" }));
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put.mock.calls[0][1]).toMatchObject({ etag: '"0"', fullName: "Nguyễn Văn Bình" });
  });

  it("hộp thoại sửa báo số tài sản bị ảnh hưởng và không còn nút xóa", async () => {
    renderRow();
    fireEvent.click(screen.getByRole("button", { name: "Sửa hồ sơ Nguyễn Văn An" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/Người này đang được gán 2 tài sản/)).toBeInTheDocument();
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

  it("Xóa mở hộp thoại xác nhận và gọi API xóa khi hồ sơ chưa được gán tài sản", async () => {
    const remove = vi.spyOn(apiClient, "delete").mockResolvedValue(undefined);
    renderRow({ assetIds: [] });
    fireEvent.click(screen.getByRole("button", { name: "Xóa hồ sơ Nguyễn Văn An" }));
    const dialog = await screen.findByRole("dialog");
    const confirm = within(dialog).getByRole("button", { name: "Xóa người nhận" });
    expect(confirm).toBeDisabled();
    fireEvent.click(within(dialog).getByRole("checkbox"));
    fireEvent.click(confirm);
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1));
  });

  it("Xóa báo không xóa được khi hồ sơ còn được gán tài sản", async () => {
    const remove = vi.spyOn(apiClient, "delete").mockResolvedValue(undefined);
    renderRow();
    fireEvent.click(screen.getByRole("button", { name: "Xóa hồ sơ Nguyễn Văn An" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Không xóa được người nhận")).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Xóa hồ sơ" })).not.toBeInTheDocument();
    expect(remove).not.toHaveBeenCalled();
  });

  it("chặn xóa nêu rõ tên tài sản, kèm lối mở phần phân chia", async () => {
    renderRow({}, { [VAULT_ID]: "Giấy tờ gia đình", [CONTAINER_ID]: "Tài khoản game" });
    fireEvent.click(screen.getByRole("button", { name: "Xóa hồ sơ Nguyễn Văn An" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Giấy tờ gia đình");
    expect(dialog).toHaveTextContent("Tài khoản game");
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Nguyễn Văn An đang được gán 2 tài sản. Hãy gỡ người nhận khỏi các tài sản trên, rồi xóa lại.",
    );
    expect(within(dialog).getByRole("button", { name: "Đóng" })).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Mở phần phân chia" })).toHaveAttribute(
      "href",
      "/dashboard/assets?tab=assignments",
    );
  });

  it("chưa tra được tên tài sản thì ghi chung", async () => {
    renderRow();
    fireEvent.click(screen.getByRole("button", { name: "Xóa hồ sơ Nguyễn Văn An" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("alert")).toHaveTextContent("đang được gán 2 tài sản.");
  });
});
