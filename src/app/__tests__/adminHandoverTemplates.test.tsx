import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    { text: "1. Chủ kho {HO_TEN_CHU_KHO} {CAU_NGUOI_MAT}", align: "justify", bold: false },
    { text: "2. Di sản: {DI_SAN}.", align: "justify", bold: false },
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
  { token: "CAU_NGUOI_MAT", label: "Câu về người mất", example: "chết ngày …" },
  { token: "DI_SAN", label: "Phần di sản", example: "Gói gia đình (gồm 3 mục)" },
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

const BODY = "Nội dung các mục của biên bản";

describe("trang Mẫu biên bản của Admin", () => {
  it("hiện các mục 1 đến 8 như một khung chữ liền, câu báo viết ra thành câu thật, và bản xem trước", async () => {
    backend();
    setup();

    const area = (await screen.findByLabelText(BODY)) as HTMLTextAreaElement;
    expect(screen.getByText(/Đang dùng chữ gốc của hệ thống/)).toBeInTheDocument();
    expect(area.value.split("\n")).toEqual([
      "1. Chủ kho {HO_TEN_CHU_KHO} {CAU_NGUOI_MAT}",
      "2. Di sản: {DI_SAN}.",
      "8. Tôi đã được thông báo: Nếu từ chối thì tài sản bị xóa hoàn toàn.",
    ]);
    const preview = screen.getByRole("article", { name: "Biên bản đồng ý nhận di sản thừa kế" });
    expect(preview).toHaveTextContent("BIÊN BẢN ĐỒNG Ý");
    expect(preview).toHaveTextContent("Tôi là Trần Minh Anh, ngày 11 tháng 11.");
    expect(preview).toHaveTextContent("2. Di sản: Gói gia đình (gồm 3 mục).");
    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled();
    expect(screen.getByRole("link", { name: /Mẫu biên bản/ })).toBeInTheDocument();
    // Không còn thẻ văn bản từ chối, ô câu báo riêng, lịch sử hay từng đoạn có nút điều khiển
    expect(screen.queryByRole("button", { name: "Văn bản từ chối nhận" })).not.toBeInTheDocument();
    expect(screen.queryByText("Lịch sử các lần lưu")).not.toBeInTheDocument();
  });

  it("gõ thêm một mục thì xem trước đổi ngay; lưu gửi phần mở đầu và văn bản từ chối nguyên vẹn", async () => {
    backend();
    setup();
    const area = await screen.findByLabelText(BODY);

    fireEvent.change(area, {
      target: {
        value:
          "1. Chủ kho {HO_TEN_CHU_KHO} {CAU_NGUOI_MAT}\n\n2. Di sản: {DI_SAN}.\n3. Mục mới do Admin gõ.\n8. Tôi đã được thông báo: Tài sản của người từ chối sẽ bị hủy ngay.",
      },
    });
    expect(
      screen.getByRole("article", { name: "Biên bản đồng ý nhận di sản thừa kế" }),
    ).toHaveTextContent("3. Mục mới do Admin gõ.");

    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));

    await waitFor(() => expect(postCalls()).toHaveLength(1));
    const sent = postCalls()[0].body as {
      accept: Array<{ text: string; align: string }>;
      decline: unknown;
      declineNotice: string;
    };
    expect(sent.accept.map((paragraph) => paragraph.text)).toEqual([
      "BIÊN BẢN ĐỒNG Ý",
      "Tôi là {HO_TEN_NGUOI_NHAN}, ngày {NGAY} tháng {THANG}.",
      "1. Chủ kho {HO_TEN_CHU_KHO} {CAU_NGUOI_MAT}",
      "2. Di sản: {DI_SAN}.",
      "3. Mục mới do Admin gõ.",
      "8. Tôi đã được thông báo: Tài sản của người từ chối sẽ bị hủy ngay.",
    ]);
    expect(sent.decline).toEqual(defaultContent.decline);
    // Câu báo hiện cho người nhận lấy theo mục 8 vừa sửa
    expect(sent.declineNotice).toBe("Tài sản của người từ chối sẽ bị hủy ngay.");
    expect(await screen.findByText(/Đã lưu phiên bản 1/)).toBeInTheDocument();
    expect(await screen.findByText(/Đang dùng phiên bản 1/)).toBeInTheDocument();
  });

  it("không sửa mục 8 thì giữ nguyên câu báo cũ", async () => {
    backend();
    setup();
    const area = (await screen.findByLabelText(BODY)) as HTMLTextAreaElement;

    fireEvent.change(area, { target: { value: area.value + "\n9. Mục thêm." } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));

    await waitFor(() => expect(postCalls()).toHaveLength(1));
    const sent = postCalls()[0].body as { declineNotice: string };
    expect(sent.declineNotice).toBe("Nếu từ chối thì tài sản bị xóa hoàn toàn.");
  });

  it("trường lạ hoặc không còn đoạn nào thì báo lỗi và khóa nút Lưu", async () => {
    backend();
    setup();
    const area = await screen.findByLabelText(BODY);

    fireEvent.change(area, { target: { value: "1. Có {TRUONG_SAI} ở đây" } });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "trường {TRUONG_SAI} không có trong danh sách",
    );
    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled();

    fireEvent.change(area, { target: { value: "  \n  " } });
    expect(screen.getByRole("alert")).toHaveTextContent("Cần có ít nhất một đoạn");
    expect(postCalls()).toHaveLength(0);
  });

  it("bấm một trường thì chèn vào chỗ con trỏ trong khung chữ", async () => {
    backend();
    setup();
    const area = (await screen.findByLabelText(BODY)) as HTMLTextAreaElement;

    area.focus();
    area.setSelectionRange(0, 0);
    fireEvent.click(screen.getByRole("button", { name: "{NGAY}" }));

    expect(screen.getByLabelText(BODY)).toHaveValue(
      "{NGAY}1. Chủ kho {HO_TEN_CHU_KHO} {CAU_NGUOI_MAT}\n2. Di sản: {DI_SAN}.\n8. Tôi đã được thông báo: Nếu từ chối thì tài sản bị xóa hoàn toàn.",
    );
  });

  it("khôi phục chữ gốc nạp lại các mục gốc nhưng chưa lưu", async () => {
    backend();
    setup();
    const area = await screen.findByLabelText(BODY);
    fireEvent.change(area, { target: { value: "1. Đã sửa hết." } });
    expect(screen.getByRole("button", { name: "Lưu" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Khôi phục chữ gốc" }));

    expect(screen.getByLabelText(BODY)).toHaveValue(
      "1. Chủ kho {HO_TEN_CHU_KHO} {CAU_NGUOI_MAT}\n2. Di sản: {DI_SAN}.\n8. Tôi đã được thông báo: Nếu từ chối thì tài sản bị xóa hoàn toàn.",
    );
    expect(screen.getByText(/Đã nạp chữ của mẫu gốc/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled();
    expect(postCalls()).toHaveLength(0);
  });
});
