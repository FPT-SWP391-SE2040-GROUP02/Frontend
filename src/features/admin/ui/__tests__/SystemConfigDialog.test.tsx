import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import type { ConfigSlotName, SystemConfigEntry } from "../../model/systemConfig.schema";
import { systemConfigKeys } from "../../model/useSystemConfig";
import { SystemConfigDialog } from "../SystemConfigDialog";

const settings = { model: "gemini-flash-lite-latest", timeoutSeconds: "20" };
const primary = {
  slot: "PRIMARY" as const,
  enabled: true,
  source: "DATABASE" as const,
  settings,
  secrets: [{ name: "apiKey", hasValue: true, last4: "1a2b" }],
  version: 1,
  updatedAt: "2026-11-03T10:00:00+00:00",
  updatedBy: "Cô Lan",
};
const fallback = {
  slot: "FALLBACK" as const,
  enabled: false,
  source: "APPSETTINGS" as const,
  settings,
  secrets: [{ name: "apiKey", hasValue: false, last4: null }],
  version: 0,
  updatedAt: null,
  updatedBy: null,
};
const entry: SystemConfigEntry = {
  serviceKey: "GEMINI",
  supportsFallback: true,
  slots: [primary, fallback],
  status: { activeSlot: null, lastOutcome: null, lastAt: null, lastErrorCode: null },
};

afterEach(() => {
  cleanup();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function renderDialog(slot: ConfigSlotName = "PRIMARY") {
  accessTokenMemory.set("fixture");
  const client = new QueryClient();
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <SystemConfigDialog service={entry} slot={slot} onClose={onClose} onSaved={onSaved} />
    </QueryClientProvider>,
  );
  return { client, onClose, onSaved };
}

function type(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function clickSave() {
  fireEvent.click(screen.getByRole("button", { name: /^(Lưu|Đang lưu)/ }));
}

describe("SystemConfigDialog", () => {
  it("không bao giờ hiện khóa đã lưu, chỉ hiện 4 ký tự cuối", () => {
    renderDialog();
    const key = screen.getByLabelText("Khóa API");
    expect(key).toHaveValue("");
    expect(key).toHaveAttribute("type", "password");
    expect(screen.getByText("•••• 1a2b")).toBeInTheDocument();
  });

  it("để khóa trống thì không gửi khóa, và gửi đúng version của ô", async () => {
    const put = vi.spyOn(apiClient, "put").mockResolvedValue({ ...primary, version: 2 });
    renderDialog();
    type("Lý do thay đổi", "đổi thời gian chờ");
    clickSave();
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    const [url, body] = put.mock.calls[0];
    expect(url).toBe("/admin/system-config/GEMINI/PRIMARY");
    expect(body).toEqual({
      settings,
      enabled: true,
      reason: "đổi thời gian chờ",
      version: 1,
    });
    expect(body).not.toHaveProperty("secrets");
  });

  it("gửi khóa mới khi người dùng nhập khóa", async () => {
    const put = vi.spyOn(apiClient, "put").mockResolvedValue({ ...primary, version: 2 });
    renderDialog();
    type("Khóa API", "sk-new-5678");
    type("Lý do thay đổi", "đổi khóa");
    clickSave();
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put.mock.calls[0][1]).toMatchObject({ secrets: { apiKey: "sk-new-5678" } });
  });

  it("chặn lưu khi chưa nhập lý do", async () => {
    const put = vi.spyOn(apiClient, "put").mockResolvedValue(primary);
    renderDialog();
    clickSave();
    expect(await screen.findByText("Vui lòng nhập lý do thay đổi.")).toBeInTheDocument();
    expect(put).not.toHaveBeenCalled();
  });

  it("chặn lưu khi tên model có ký tự không cho phép", async () => {
    const put = vi.spyOn(apiClient, "put").mockResolvedValue(primary);
    renderDialog();
    type("Tên model", "a/../b");
    type("Lý do thay đổi", "thử");
    clickSave();
    expect(
      await screen.findByText(/Chỉ gồm chữ, số, dấu chấm, gạch ngang và gạch dưới/),
    ).toBeInTheDocument();
    expect(put).not.toHaveBeenCalled();
  });

  it("thử kết nối bằng giá trị đang nhập mà không lưu", async () => {
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue({ ok: true, errorCode: null, latencyMs: 42 });
    const put = vi.spyOn(apiClient, "put").mockResolvedValue(primary);
    renderDialog();
    type("Tên model", "gemini-2.5-flash");
    fireEvent.click(screen.getByRole("button", { name: "Thử kết nối bằng giá trị đang nhập" }));
    expect(await screen.findByText(/Kết nối được/)).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith("/admin/system-config/GEMINI/PRIMARY/test", {
      settings: { model: "gemini-2.5-flash", timeoutSeconds: "20" },
    });
    expect(put).not.toHaveBeenCalled();
  });

  it("hiện mã lỗi khi thử kết nối không thành công", async () => {
    vi.spyOn(apiClient, "post").mockResolvedValue({
      ok: false,
      errorCode: "HTTP_401",
      latencyMs: 9,
    });
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Thử kết nối bằng giá trị đang nhập" }));
    expect(await screen.findByText(/HTTP_401/)).toBeInTheDocument();
  });

  it("khóa nút lưu và nút thử trong lúc đang gửi", async () => {
    vi.spyOn(apiClient, "put").mockReturnValue(new Promise(() => undefined));
    renderDialog();
    type("Lý do thay đổi", "đổi");
    clickSave();
    await waitFor(() => expect(screen.getByRole("button", { name: "Đang lưu…" })).toBeDisabled());
    expect(
      screen.getByRole("button", { name: "Thử kết nối bằng giá trị đang nhập" }),
    ).toBeDisabled();
  });

  it("nhắc tải lại khi người khác vừa sửa (409 EDIT_CONFLICT)", async () => {
    vi.spyOn(apiClient, "put").mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { code: "EDIT_CONFLICT" } },
    });
    renderDialog();
    type("Lý do thay đổi", "đổi");
    clickSave();
    expect(await screen.findByRole("alert")).toHaveTextContent("Tải lại để xem bản mới nhất");
  });

  it("lưu xong thì làm mới danh sách, báo thành công và đóng hộp thoại", async () => {
    vi.spyOn(apiClient, "put").mockResolvedValue({ ...primary, version: 2 });
    const { client, onClose, onSaved } = renderDialog();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    type("Lý do thay đổi", "đổi");
    clickSave();
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith("Đã lưu cấu hình."));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: systemConfigKeys.all });
    expect(onClose).toHaveBeenCalled();
  });

  it("ô dự phòng có công tắc bật và gửi cờ bật cùng khóa", async () => {
    const put = vi
      .spyOn(apiClient, "put")
      .mockResolvedValue({ ...fallback, enabled: true, version: 1 });
    renderDialog("FALLBACK");
    fireEvent.click(screen.getByLabelText("Bật dịch vụ dự phòng"));
    type("Khóa API", "sk-fallback-9999");
    type("Lý do thay đổi", "thêm dự phòng");
    clickSave();
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put.mock.calls[0][0]).toBe("/admin/system-config/GEMINI/FALLBACK");
    expect(put.mock.calls[0][1]).toMatchObject({
      enabled: true,
      secrets: { apiKey: "sk-fallback-9999" },
      version: 0,
    });
  });

  it("ô chính không có công tắc bật", () => {
    renderDialog("PRIMARY");
    expect(screen.queryByLabelText("Bật dịch vụ dự phòng")).not.toBeInTheDocument();
  });
});
