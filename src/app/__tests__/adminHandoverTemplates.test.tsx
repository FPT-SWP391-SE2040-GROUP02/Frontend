import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

/** Trang Admin "Mẫu biên bản": xem, sửa từng đoạn, chèn trường, xem trước, lưu phiên bản mới, nạp lại bản cũ, khôi phục mẫu gốc. */

interface Call {
  method: string;
  url: string;
  body: unknown;
}
const originalAdapter = apiClient.defaults.adapter;
let client: QueryClient;
let calls: Call[];

const defaultContent = {
  accept: [
    { text: "BIÊN BẢN ĐỒNG Ý", align: "center", bold: true },
    {
      text: "Tôi là {HO_TEN_NGUOI_NHAN}, ngày {NGAY} tháng {THANG}.",
      align: "justify",
      bold: false,
    },
    { text: "8. Tôi đã được thông báo: {CAU_BAO_TU_CHOI}", align: "justify", bold: false },
  ],
  decline: [
    { text: "VĂN BẢN TỪ CHỐI", align: "center", bold: true },
    { text: "Tôi từ chối nhận di sản của {HO_TEN_CHU_KHO}.", align: "left", bold: false },
  ],
  declineNotice: "Nếu từ chối thì tài sản bị xóa hoàn toàn.",
};
const tokens = [
  { token: "NGAY", label: "Ngày ký (ngày)", example: "11" },
  { token: "THANG", label: "Ngày ký (tháng)", example: "11" },
  { token: "HO_TEN_NGUOI_NHAN", label: "Họ tên người nhận", example: "Trần Minh Anh" },
  { token: "HO_TEN_CHU_KHO", label: "Họ tên Chủ kho", example: "Nguyễn Văn A" },
  { token: "CAU_BAO_TU_CHOI", label: "Câu báo", example: "…" },
];
const templateBody = (over: Record<string, unknown> = {}) => ({
  version: null,
  isDefault: true,
  ...defaultContent,
  note: null,
  createdAt: null,
  createdByName: null,
  tokens,
  default: defaultContent,
  ...over,
});

let current: Record<string, unknown>;
let versions: unknown[];

/** Giả lập Backend theo route; mọi đường khác trả 500. */
function backend() {
  calls = [];
  current = templateBody();
  versions = [];
  apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const url = config.url ?? "";
    const method = config.method ?? "get";
    const body = typeof config.data === "string" ? JSON.parse(config.data) : undefined;
    calls.push({ method, url, body });
    let data: unknown;
    if (method === "get" && url === "/admin/handover-templates/current") {
      data = current;
    } else if (method === "get" && url === "/admin/handover-templates") {
      data = versions;
    } else if (method === "get" && url === "/admin/handover-templates/1") {
      data = templateBody({
        version: 1,
        isDefault: false,
        accept: [{ text: "BẢN CŨ SỐ MỘT", align: "center", bold: true }],
      });
    } else if (method === "post" && url === "/admin/handover-templates") {
      current = templateBody({
        version: 1,
        isDefault: false,
        accept: body.accept,
        decline: body.decline,
        declineNotice: body.declineNotice,
        note: body.note ?? null,
        createdAt: "2026-11-11T05:00:00Z",
        createdByName: "Quản trị",
      });
      versions = [
        {
          version: 1,
          createdAt: "2026-11-11T05:00:00Z",
          createdByName: "Quản trị",
          note: body.note,
        },
      ];
      data = current;
    } else {
      throw new AxiosError("fail", "ERR_BAD_REQUEST", config, undefined, {
        config,
        data: {},
        status: 500,
        statusText: "Error",
        headers: new AxiosHeaders(),
      });
    }
    return {
      config,
      data,
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
    } satisfies AxiosResponse;
  };
}
const postCalls = () =>
  calls.filter((call) => call.method === "post" && call.url === "/admin/handover-templates");

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("admin-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  apiClient.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});

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
        <MemoryRouter initialEntries={[`${ROUTES.ADMIN.ROOT}?view=templates`]}>
          <Routes>
            <Route path={ROUTES.ADMIN.ROOT} element={<AdminWorkspacePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe("trang Mẫu biên bản của Admin", () => {
  it("hiện mẫu đang dùng, từng đoạn để sửa và bản xem trước đã điền dữ liệu mẫu", async () => {
    backend();
    setup();

    expect(await screen.findByText(/Mẫu gốc trong hệ thống/)).toBeInTheDocument();
    expect(screen.getByLabelText("Đoạn 2")).toHaveValue(
      "Tôi là {HO_TEN_NGUOI_NHAN}, ngày {NGAY} tháng {THANG}.",
    );
    const preview = screen.getByRole("article", { name: "Biên bản đồng ý nhận di sản thừa kế" });
    expect(preview).toHaveTextContent("Tôi là Trần Minh Anh, ngày 11 tháng 11.");
    expect(preview).toHaveTextContent(
      "8. Tôi đã được thông báo: Nếu từ chối thì tài sản bị xóa hoàn toàn.",
    );
    expect(screen.getByRole("button", { name: "Lưu thành phiên bản mới" })).toBeDisabled();
    expect(screen.getByRole("link", { name: /Mẫu biên bản/ })).toBeInTheDocument();
  });

  it("sửa một đoạn thì xem trước đổi ngay, lưu gửi đúng nội dung rồi báo phiên bản mới", async () => {
    backend();
    setup();
    const field = await screen.findByLabelText("Đoạn 2");

    fireEvent.change(field, { target: { value: "Tôi là {HO_TEN_NGUOI_NHAN}. Điều luật mới." } });
    fireEvent.change(screen.getByLabelText(/Ghi chú về lần sửa/), {
      target: { value: "Luật mới 2027" },
    });
    expect(
      screen.getByRole("article", { name: "Biên bản đồng ý nhận di sản thừa kế" }),
    ).toHaveTextContent("Tôi là Trần Minh Anh. Điều luật mới.");

    fireEvent.click(screen.getByRole("button", { name: "Lưu thành phiên bản mới" }));

    await waitFor(() => expect(postCalls()).toHaveLength(1));
    const sent = postCalls()[0].body as {
      accept: Array<{ text: string }>;
      note: string;
      declineNotice: string;
    };
    expect(sent.accept[1].text).toBe("Tôi là {HO_TEN_NGUOI_NHAN}. Điều luật mới.");
    expect(sent.note).toBe("Luật mới 2027");
    expect(sent.declineNotice).toBe("Nếu từ chối thì tài sản bị xóa hoàn toàn.");
    expect(await screen.findByText(/Đã lưu phiên bản 1/)).toBeInTheDocument();
    expect(await screen.findByText(/Phiên bản 1 đang dùng/)).toBeInTheDocument();
    expect(await screen.findByText("Luật mới 2027")).toBeInTheDocument();
  });

  it("trường lạ hoặc đoạn trống thì báo lỗi và khóa nút Lưu", async () => {
    backend();
    setup();
    const field = await screen.findByLabelText("Đoạn 2");

    fireEvent.change(field, { target: { value: "Có {TRUONG_SAI} ở đây" } });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "trường {TRUONG_SAI} không có trong danh sách",
    );
    expect(screen.getByRole("button", { name: "Lưu thành phiên bản mới" })).toBeDisabled();

    fireEvent.change(field, { target: { value: "   " } });
    expect(screen.getByRole("alert")).toHaveTextContent("đang trống");
    expect(postCalls()).toHaveLength(0);
  });

  it("bấm một trường thì chèn vào chỗ con trỏ của đoạn đang chọn", async () => {
    backend();
    setup();
    const field = (await screen.findByLabelText("Đoạn 1")) as HTMLTextAreaElement;

    fireEvent.click(screen.getByRole("button", { name: "{NGAY}" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Bấm vào đoạn cần chèn trường trước");

    field.focus();
    field.setSelectionRange(0, 0);
    fireEvent.focus(field);
    fireEvent.click(screen.getByRole("button", { name: "{NGAY}" }));

    expect(screen.getByLabelText("Đoạn 1")).toHaveValue("{NGAY}BIÊN BẢN ĐỒNG Ý");
  });

  it("thêm, xóa và đổi chỗ đoạn", async () => {
    backend();
    setup();
    await screen.findByLabelText("Đoạn 1");

    fireEvent.click(screen.getByRole("button", { name: "Thêm đoạn dưới đoạn 1" }));
    expect(screen.getByLabelText("Đoạn 2")).toHaveValue("");
    expect(screen.getByRole("alert")).toHaveTextContent("đang trống");

    fireEvent.click(screen.getByRole("button", { name: "Xóa đoạn 2" }));
    expect(screen.getByLabelText("Đoạn 2")).toHaveValue(
      "Tôi là {HO_TEN_NGUOI_NHAN}, ngày {NGAY} tháng {THANG}.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Đưa đoạn 2 lên" }));
    expect(screen.getByLabelText("Đoạn 1")).toHaveValue(
      "Tôi là {HO_TEN_NGUOI_NHAN}, ngày {NGAY} tháng {THANG}.",
    );
    expect(screen.getByLabelText("Đoạn 2")).toHaveValue("BIÊN BẢN ĐỒNG Ý");
  });

  it("chuyển sang văn bản từ chối, nạp bản cũ từ lịch sử và khôi phục mẫu gốc", async () => {
    backend();
    versions = [
      { version: 1, createdAt: "2026-11-10T05:00:00Z", createdByName: "Quản trị", note: "Bản đầu" },
    ];
    setup();
    await screen.findByLabelText("Đoạn 1");

    fireEvent.click(screen.getByRole("button", { name: "Văn bản từ chối nhận" }));
    expect(screen.getByLabelText("Đoạn 2")).toHaveValue(
      "Tôi từ chối nhận di sản của {HO_TEN_CHU_KHO}.",
    );
    expect(
      screen.getByRole("article", { name: "Văn bản từ chối nhận di sản thừa kế" }),
    ).toHaveTextContent("Tôi từ chối nhận di sản của Nguyễn Văn A.");

    fireEvent.click(screen.getByRole("button", { name: "Biên bản đồng ý nhận" }));
    fireEvent.click(await screen.findByRole("button", { name: "Nạp phiên bản 1 vào trang sửa" }));
    expect(await screen.findByDisplayValue("BẢN CŨ SỐ MỘT")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lưu thành phiên bản mới" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Khôi phục mẫu gốc" }));
    expect(screen.getByLabelText("Đoạn 1")).toHaveValue("BIÊN BẢN ĐỒNG Ý");
    expect(within(document.body).getByText(/Đã nạp mẫu gốc/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lưu thành phiên bản mới" })).toBeDisabled();
  });
});
