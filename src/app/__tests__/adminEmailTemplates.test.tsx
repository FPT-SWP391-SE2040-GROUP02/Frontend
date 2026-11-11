import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { CREATED_AT, VAULT_ID } from "@/shared/api/__tests__/backend.fixtures";
import { ROUTES } from "@/shared/config/routes.config";
import { AdminWorkspacePage } from "@/pages/admin/AdminWorkspacePage";

/** Trang Admin "Mẫu thư": xem từng loại thư, sửa chữ, bật tắt, về chữ gốc. */

interface Call {
  method: string;
  url: string;
  body: Record<string, unknown> | undefined;
}
const originalAdapter = apiClient.defaults.adapter;
let client: QueryClient;
let calls: Call[];

const emptyCustom = { subject: null, title: null, body: null, buttonText: null, note: null };
const overdue = {
  key: "EXECUTOR_OVERDUE",
  label: "Báo Người thực thi: Chủ kho quá hạn điểm danh",
  description: "Gửi Người thực thi khi Chủ kho hết thời gian chờ điểm danh.",
  canDisable: true,
  editableBody: true,
  enabled: true,
  tokens: [{ name: "TEN_NGUOI_NHAN", description: "Họ tên người nhận thư" }],
  default: {
    subject: "LegacyVault: chủ kho quá hạn điểm danh",
    title: "Chủ kho quá hạn điểm danh",
    body: "Chủ một kho đã quá hạn.",
    buttonText: "Mở trang người thực hiện",
    note: "Email không chứa tài sản.",
  },
  custom: emptyCustom,
  updatedAt: null,
  updatedByName: null,
};
const invitation = {
  ...overdue,
  key: "HANDOVER_INVITATION",
  label: "Thư mời nhận tài sản",
  canDisable: false,
  editableBody: true,
  requiredBodyTokens: ["HAN_PHAN_HOI"],
  tokens: [
    { name: "TEN_NGUOI_NHAN", description: "Họ tên người nhận thư" },
    { name: "HAN_PHAN_HOI", description: "Hạn phản hồi" },
  ],
  default: { ...overdue.default, body: "Bấm trước {HAN_PHAN_HOI}." },
};

let templates: Record<string, unknown>[];
let extraMails: Record<string, unknown>[];

const extraMail = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Nhắc trễ thêm",
  enabled: true,
  daysFromDue: 2,
  subject: "Bạn vẫn chưa điểm danh",
  title: "Hãy điểm danh",
  body: "Hạn của bạn là {HAN_DIEM_DANH}.",
  buttonText: "Điểm danh ngay",
  note: "Ghi chú",
  updatedAt: "2026-11-12T01:00:00Z",
  updatedByName: "Quản trị",
};

function backend() {
  calls = [];
  templates = [overdue, invitation];
  extraMails = [extraMail];
  apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const url = config.url ?? "";
    const method = config.method ?? "get";
    const body = typeof config.data === "string" ? JSON.parse(config.data) : undefined;
    calls.push({ method, url, body });
    let data: unknown;
    if (method === "get" && url === "/admin/extra-mails") {
      data = {
        items: extraMails,
        maxItems: 20,
        minDaysFromDue: -60,
        maxDaysFromDue: 30,
        tokens: [
          { name: "TEN_NGUOI_NHAN", description: "Họ tên Chủ kho" },
          { name: "HAN_DIEM_DANH", description: "Hạn điểm danh" },
        ],
      };
    } else if (method === "post" && url === "/admin/extra-mails") {
      data = { ...extraMail, ...body, id: "22222222-2222-4222-8222-222222222222" };
      extraMails = [...extraMails, data as Record<string, unknown>];
    } else if (method === "put" && url === `/admin/extra-mails/${extraMail.id}`) {
      data = { ...extraMail, ...body };
    } else if (method === "delete" && url === `/admin/extra-mails/${extraMail.id}`) {
      extraMails = [];
      data = "";
    } else if (method === "get" && url === "/admin/email-templates") {
      data = templates;
    } else if (method === "put" && url === "/admin/email-templates/EXECUTOR_OVERDUE") {
      const saved = {
        ...overdue,
        enabled: body?.enabled,
        custom: {
          subject: body?.subject,
          title: body?.title,
          body: body?.body,
          buttonText: body?.buttonText,
          note: body?.note,
        },
        updatedAt: "2026-11-12T01:00:00Z",
        updatedByName: "Quản trị",
      };
      templates = [saved, invitation];
      data = saved;
    } else if (method === "delete" && url === "/admin/email-templates/EXECUTOR_OVERDUE") {
      templates = [overdue, invitation];
      data = overdue;
    } else {
      throw new AxiosError("fail", "ERR_BAD_REQUEST", config, undefined, {
        config,
        data: {},
        status: 500,
        statusText: "Error",
        headers: new AxiosHeaders(),
      } as AxiosResponse);
    }
    return { data, status: 200, statusText: "OK", headers: {}, config };
  };
}

function setup() {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(
    setCredentials({
      user: {
        id: VAULT_ID,
        email: "admin@example.test",
        fullName: "Quản trị",
        role: "ADMIN",
        status: "ACTIVE",
        emailVerified: true,
        hasPassword: false,
        createdAt: CREATED_AT,
      },
    }),
  );
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`${ROUTES.ADMIN.ROOT}?view=email-templates`]}>
          <Routes>
            <Route path={ROUTES.ADMIN.ROOT} element={<AdminWorkspacePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

beforeEach(() => {
  accessTokenMemory.set("test-token");
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  apiClient.defaults.adapter = originalAdapter;
});

async function openOverdue() {
  const header = await screen.findByRole("button", { name: /Báo Người thực thi/ });
  fireEvent.click(header);
  return header;
}

describe("trang Mẫu thư của Admin", () => {
  it("có mục Mẫu thư trong menu và liệt kê các loại thư với nhãn chữ gốc", async () => {
    backend();
    setup();

    expect(await screen.findByRole("link", { name: /Mẫu thư/ })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /Báo Người thực thi/ })).toHaveTextContent(
      "Chữ gốc",
    );
    expect(screen.getByRole("button", { name: /Thư mời nhận tài sản/ })).toBeInTheDocument();
  });

  it("lưu chữ đã sửa, để trống ô nào thì gửi null cho ô đó", async () => {
    backend();
    setup();
    await openOverdue();

    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Tiêu đề thư/), {
      target: { value: "Chào {TEN_NGUOI_NHAN}" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));

    await waitFor(() => expect(calls.some((call) => call.method === "put")).toBe(true));
    const put = calls.find((call) => call.method === "put")!;
    expect(put.body).toEqual({
      enabled: true,
      subject: "Chào {TEN_NGUOI_NHAN}",
      title: null,
      body: null,
      buttonText: null,
      note: null,
    });
  });

  it("chặn lưu khi dùng biến không có trong loại thư", async () => {
    backend();
    setup();
    await openOverdue();

    fireEvent.change(screen.getByLabelText(/Nội dung/), { target: { value: "Xin chào {TEN_LA}" } });

    expect(await screen.findByRole("alert")).toHaveTextContent("{TEN_LA}");
    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled();
  });

  it("tắt loại thư cho phép tắt; thư mời không có ô tắt nhưng có ô nội dung", async () => {
    backend();
    setup();
    await openOverdue();

    fireEvent.click(screen.getByRole("checkbox", { name: "Gửi loại thư này" }));
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
    await waitFor(() => expect(calls.some((call) => call.method === "put")).toBe(true));
    expect(calls.find((call) => call.method === "put")!.body?.enabled).toBe(false);

    fireEvent.click(await screen.findByRole("button", { name: /Thư mời nhận tài sản/ }));
    const invitationCard = screen
      .getByRole("button", { name: /Thư mời nhận tài sản/ })
      .closest("li")!;
    expect(within(invitationCard).queryByRole("checkbox")).not.toBeInTheDocument();
    expect(within(invitationCard).getByText(/luôn được gửi/)).toBeInTheDocument();
    expect(within(invitationCard).getByLabelText(/Nội dung/)).toBeInTheDocument();
  });

  it("thư mời: nội dung thiếu biến bắt buộc thì báo và không cho lưu", async () => {
    backend();
    setup();
    fireEvent.click(await screen.findByRole("button", { name: /Thư mời nhận tài sản/ }));

    const card = screen.getByRole("button", { name: /Thư mời nhận tài sản/ }).closest("li")!;
    expect(within(card).getByText(/Nội dung phải giữ \{HAN_PHAN_HOI\}/)).toBeInTheDocument();
    fireEvent.change(within(card).getByLabelText(/Nội dung/), {
      target: { value: "Bấm nút để nhận." },
    });

    expect(await within(card).findByRole("alert")).toHaveTextContent("{HAN_PHAN_HOI}");
    expect(within(card).getByRole("button", { name: "Lưu" })).toBeDisabled();

    fireEvent.change(within(card).getByLabelText(/Nội dung/), {
      target: { value: "Bấm trước {HAN_PHAN_HOI}." },
    });
    expect(within(card).getByRole("button", { name: "Lưu" })).toBeEnabled();
  });

  it("nút Lấy chữ gốc điền chữ gốc vào ô để sửa tiếp", async () => {
    backend();
    setup();
    await openOverdue();

    const input = screen.getByLabelText(/Chữ trên nút/) as HTMLInputElement;
    const row = input.closest("div")!;
    fireEvent.click(within(row).getByRole("button", { name: "Lấy chữ gốc để sửa" }));

    expect(input.value).toBe("Mở trang người thực hiện");
  });

  describe("thư bổ sung", () => {
    it("liệt kê thư bổ sung kèm câu mô tả ngày gửi", async () => {
      backend();
      setup();

      expect(await screen.findByText("Nhắc trễ thêm")).toBeInTheDocument();
      expect(screen.getByText("2 ngày sau hạn điểm danh (quá hạn)")).toBeInTheDocument();
    });

    it("thêm thư trước hạn: số ngày âm gửi lên Backend, thiếu chữ thì không lưu được", async () => {
      backend();
      setup();
      fireEvent.click(await screen.findByRole("button", { name: "Thêm thư bổ sung" }));

      expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled();
      fireEvent.change(screen.getByLabelText(/^Tên/), { target: { value: "Nhắc sớm" } });
      fireEvent.change(screen.getByLabelText("Số ngày"), { target: { value: "5" } });
      fireEvent.change(screen.getByLabelText("Trước hay sau hạn"), { target: { value: "before" } });
      fireEvent.change(screen.getByLabelText(/Tiêu đề thư/), { target: { value: "Sắp tới hạn" } });
      fireEvent.change(screen.getByLabelText(/Tiêu đề lớn/), { target: { value: "Sắp tới hạn" } });
      fireEvent.change(screen.getByLabelText(/^Nội dung/), {
        target: { value: "Chào {TEN_NGUOI_NHAN}" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Lưu" }));

      await waitFor(() =>
        expect(
          calls.some((call) => call.method === "post" && call.url === "/admin/extra-mails"),
        ).toBe(true),
      );
      const post = calls.find((call) => call.method === "post")!;
      expect(post.body).toMatchObject({ name: "Nhắc sớm", daysFromDue: -5, enabled: true });
    });

    it("chặn biến lạ và số ngày ngoài giới hạn", async () => {
      backend();
      setup();
      fireEvent.click(await screen.findByRole("button", { name: "Thêm thư bổ sung" }));

      fireEvent.change(screen.getByLabelText("Số ngày"), { target: { value: "90" } });
      fireEvent.change(screen.getByLabelText(/^Nội dung/), { target: { value: "Xin chào {LA}" } });

      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent("{LA}");
      expect(alert).toHaveTextContent("Gửi từ 60 ngày trước hạn đến 30 ngày sau hạn");
      expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled();
    });

    it("tắt nhanh một thư và xóa cần bấm xác nhận", async () => {
      backend();
      setup();

      fireEvent.click(await screen.findByRole("button", { name: "Tắt" }));
      await waitFor(() =>
        expect(
          calls.some((call) => call.method === "put" && call.url.includes("extra-mails")),
        ).toBe(true),
      );
      expect(
        calls.find((call) => call.url.includes("extra-mails") && call.method === "put")!.body
          ?.enabled,
      ).toBe(false);

      fireEvent.click(screen.getByRole("button", { name: "Xóa" }));
      expect(calls.some((call) => call.method === "delete")).toBe(false);
      fireEvent.click(screen.getByRole("button", { name: "Xác nhận xóa" }));
      await waitFor(() => expect(calls.some((call) => call.method === "delete")).toBe(true));
    });
  });
});
