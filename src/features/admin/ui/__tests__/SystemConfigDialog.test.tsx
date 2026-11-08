import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import type { ConfigSlotName, SystemConfigEntry } from "../../model/systemConfig.schema";
import { systemConfigKeys } from "../../model/useSystemConfig";
import { SystemConfigDialog } from "../SystemConfigDialog";

const settings = { baseUrl: "http://127.0.0.1:8879", timeoutSeconds: "60" };
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
  serviceKey: "EKYC",
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
    const key = screen.getByLabelText("Khóa dùng chung (X-Ekyc-Key)");
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
    expect(url).toBe("/admin/system-config/EKYC/PRIMARY");
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
    type("Khóa dùng chung (X-Ekyc-Key)", "sk-new-5678");
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

  it("chặn lưu khi địa chỉ dịch vụ không hợp lệ", async () => {
    const put = vi.spyOn(apiClient, "put").mockResolvedValue(primary);
    renderDialog();
    type("Địa chỉ dịch vụ", "abc");
    type("Lý do thay đổi", "thử");
    clickSave();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(put).not.toHaveBeenCalled();
  });

  it("thử kết nối bằng giá trị đang nhập mà không lưu", async () => {
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue({ ok: true, errorCode: null, latencyMs: 42 });
    const put = vi.spyOn(apiClient, "put").mockResolvedValue(primary);
    renderDialog();
    type("Địa chỉ dịch vụ", "http://127.0.0.1:9000");
    fireEvent.click(screen.getByRole("button", { name: "Thử kết nối bằng giá trị đang nhập" }));
    expect(await screen.findByText(/Kết nối được/)).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith("/admin/system-config/EKYC/PRIMARY/test", {
      settings: { baseUrl: "http://127.0.0.1:9000", timeoutSeconds: "60" },
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
    type("Khóa dùng chung (X-Ekyc-Key)", "sk-fallback-9999");
    type("Lý do thay đổi", "thêm dự phòng");
    clickSave();
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put.mock.calls[0][0]).toBe("/admin/system-config/EKYC/FALLBACK");
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

  describe("SePay", () => {
    const sePaySlot = {
      slot: "PRIMARY" as const,
      enabled: true,
      source: "DATABASE" as const,
      settings: {
        environment: "Test",
        bankCode: "MBBank",
        accountNumber: "1234567890",
        accountName: "CONG TY A",
      },
      secrets: [{ name: "webhookApiKey", hasValue: true, last4: null }],
      version: 2,
      updatedAt: "2026-11-03T10:00:00+00:00",
      updatedBy: "Cô Lan",
    };
    const sePayEntry: SystemConfigEntry = {
      serviceKey: "SEPAY",
      supportsFallback: false,
      slots: [sePaySlot],
      status: { activeSlot: null, lastOutcome: null, lastAt: null, lastErrorCode: null },
    };

    function renderSePay() {
      accessTokenMemory.set("fixture");
      const client = new QueryClient();
      render(
        <QueryClientProvider client={client}>
          <SystemConfigDialog
            service={sePayEntry}
            slot="PRIMARY"
            onClose={vi.fn()}
            onSaved={vi.fn()}
          />
        </QueryClientProvider>,
      );
    }

    async function chooseEnvironment(label: string) {
      const user = userEvent.setup();
      await user.click(screen.getByRole("combobox", { name: "Môi trường" }));
      await user.click(await screen.findByRole("option", { name: label }));
    }

    it("hiện môi trường đang dùng bằng nhãn tiếng Việt và không có nút thử kết nối", () => {
      renderSePay();
      expect(screen.getByRole("combobox", { name: "Môi trường" })).toHaveTextContent(
        "Thử nghiệm (Test)",
      );
      expect(
        screen.queryByRole("button", { name: "Thử kết nối bằng giá trị đang nhập" }),
      ).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Gõ lại SEPAY/)).not.toBeInTheDocument();
    });

    it("chuyển sang Live thì đòi gõ lại SEPAY mới cho lưu, rồi gửi confirmText", async () => {
      const put = vi.spyOn(apiClient, "put").mockResolvedValue({ ...sePaySlot, version: 3 });
      renderSePay();
      await chooseEnvironment("Thật (Live)");
      type("Lý do thay đổi", "bắt đầu nhận tiền thật");
      const confirmField = await screen.findByLabelText(/Gõ lại SEPAY/);
      expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled();

      fireEvent.change(confirmField, { target: { value: "sepay" } });
      await waitFor(() => expect(screen.getByRole("button", { name: "Lưu" })).toBeEnabled());
      clickSave();

      await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
      expect(put.mock.calls[0][1]).toMatchObject({
        settings: { environment: "Live" },
        confirmText: "sepay",
        version: 2,
      });
    });

    it("đổi lại về Test thì không còn đòi xác nhận", async () => {
      renderSePay();
      await chooseEnvironment("Thật (Live)");
      expect(await screen.findByLabelText(/Gõ lại SEPAY/)).toBeInTheDocument();
      await chooseEnvironment("Thử nghiệm (Test)");
      await waitFor(() => expect(screen.queryByLabelText(/Gõ lại SEPAY/)).not.toBeInTheDocument());
    });
  });

  describe("eKYC", () => {
    const ekycSlot = {
      slot: "PRIMARY" as const,
      enabled: true,
      source: "DATABASE" as const,
      settings: { baseUrl: "http://127.0.0.1:8879", timeoutSeconds: "60" },
      secrets: [{ name: "apiKey", hasValue: false, last4: null }],
      version: 3,
      updatedAt: "2026-11-03T10:00:00+00:00",
      updatedBy: "Cô Lan",
    };
    const ekycEntry: SystemConfigEntry = {
      serviceKey: "EKYC",
      supportsFallback: true,
      slots: [ekycSlot],
      status: { activeSlot: null, lastOutcome: null, lastAt: null, lastErrorCode: null },
    };

    function renderEkyc() {
      accessTokenMemory.set("fixture");
      const client = new QueryClient();
      render(
        <QueryClientProvider client={client}>
          <SystemConfigDialog
            service={ekycEntry}
            slot="PRIMARY"
            onClose={vi.fn()}
            onSaved={vi.fn()}
          />
        </QueryClientProvider>,
      );
    }

    it("hiện địa chỉ đang dùng và chặn lưu khi địa chỉ không hợp lệ", async () => {
      const put = vi.spyOn(apiClient, "put").mockResolvedValue(ekycSlot);
      renderEkyc();
      expect(screen.getByLabelText("Địa chỉ dịch vụ")).toHaveValue("http://127.0.0.1:8879");
      type("Địa chỉ dịch vụ", "http://user:pass@ekyc.test");
      type("Lý do thay đổi", "đổi địa chỉ");
      clickSave();
      expect(await screen.findByText(/không kèm tên đăng nhập/)).toBeInTheDocument();
      expect(put).not.toHaveBeenCalled();
    });

    it("lưu địa chỉ mới, không gửi khóa khi để trống, gửi đúng version", async () => {
      const put = vi.spyOn(apiClient, "put").mockResolvedValue({ ...ekycSlot, version: 4 });
      renderEkyc();
      type("Địa chỉ dịch vụ", "https://ekyc.example.test");
      type("Lý do thay đổi", "đổi địa chỉ");
      clickSave();
      await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
      expect(put.mock.calls[0][0]).toBe("/admin/system-config/EKYC/PRIMARY");
      expect(put.mock.calls[0][1]).toEqual({
        settings: { baseUrl: "https://ekyc.example.test", timeoutSeconds: "60" },
        enabled: true,
        reason: "đổi địa chỉ",
        version: 3,
      });
    });
  });
});
