import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { BeneficiaryForm } from "../BeneficiaryForm";

const VAULT_ID = "11111111-1111-4111-8111-111111111111";
const RECORD_ID = "22222222-2222-4222-8222-222222222222";

const saved = {
  id: RECORD_ID,
  citizenIdLast4: "8901",
  fullName: "Nguyễn Văn An",
  dateOfBirth: "1990-05-20",
  email: "an@example.com",
  phone: null,
  message: "Con ơi, bố để lại phần này cho con.",
  minorAcknowledgedAt: null,
  containerIds: [],
  createdAt: "2026-11-08T08:00:00+00:00",
  updatedAt: null,
  etag: '"0"',
};

let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("form-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function renderForm(record?: typeof saved) {
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <BeneficiaryForm vaultId={VAULT_ID} record={record} />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

it("có ô lời nhắn không bắt buộc kèm lời dặn không ghi bí mật", () => {
  renderForm();
  expect(screen.getByLabelText(/Lời nhắn gửi người nhận/)).toBeInTheDocument();
  expect(screen.getByText(/đừng ghi mật khẩu, số tài khoản/)).toBeInTheDocument();
});

it("tạo người nhận gửi kèm lời nhắn đã cắt khoảng trắng", async () => {
  const user = userEvent.setup();
  const post = vi.spyOn(apiClient, "post").mockResolvedValue(saved);
  renderForm();
  await user.type(screen.getByLabelText(/Họ và tên/), "Nguyễn Văn An");
  await user.type(screen.getByLabelText(/Ngày sinh/), "1990-05-20");
  await user.type(screen.getByLabelText(/Số CCCD/), "012345678901");
  await user.type(screen.getByLabelText(/^Email/), "an@example.com");
  await user.type(
    screen.getByLabelText(/Lời nhắn gửi người nhận/),
    "  Con ơi, bố để lại phần này cho con.  ",
  );
  await user.click(screen.getByRole("button", { name: "Thêm người nhận" }));

  await screen.findByText(/Đã lưu thay đổi/);
  const body = post.mock.calls[0][1] as { message: string | null };
  expect(body.message).toBe("Con ơi, bố để lại phần này cho con.");
});

it("không viết lời nhắn thì gửi null", async () => {
  const user = userEvent.setup();
  const post = vi.spyOn(apiClient, "post").mockResolvedValue({ ...saved, message: null });
  renderForm();
  await user.type(screen.getByLabelText(/Họ và tên/), "Nguyễn Văn An");
  await user.type(screen.getByLabelText(/Ngày sinh/), "1990-05-20");
  await user.type(screen.getByLabelText(/Số CCCD/), "012345678901");
  await user.type(screen.getByLabelText(/^Email/), "an@example.com");
  await user.click(screen.getByRole("button", { name: "Thêm người nhận" }));

  await screen.findByText(/Đã lưu thay đổi/);
  const body = post.mock.calls[0][1] as { message: string | null };
  expect(body.message).toBeNull();
});

it("sửa hồ sơ hiện lời nhắn cũ và xóa trống thì gửi chuỗi rỗng", async () => {
  const user = userEvent.setup();
  const put = vi.spyOn(apiClient, "put").mockResolvedValue({ ...saved, message: null });
  renderForm(saved);
  const box = screen.getByLabelText(/Lời nhắn gửi người nhận/);
  expect(box).toHaveValue("Con ơi, bố để lại phần này cho con.");
  await user.clear(box);
  await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

  await screen.findByText(/Đã lưu thay đổi/);
  const body = put.mock.calls[0][1] as { message: string };
  expect(body.message).toBe("");
});
