import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import authReducer from "@/entities/user/model/authSlice";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { documentFixture } from "@/entities/handoverDocument/testing/documentFixture";
import type { HandoverDocument } from "@/entities/handoverDocument";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { apiClient } from "@/shared/api/axiosClient";
import { RecipientDocumentPanel } from "../RecipientDocumentPanel";

const TURN_ID = "0199e7a4-0000-7c3e-9a51-3f0f5d2b8a10";

const recipientTurn = (over: Partial<HandoverDocument> = {}) =>
  documentFixture({
    status: "WAIT_RECIPIENT",
    recipient: {
      fullName: "Trần Minh Anh",
      birthYear: null,
      citizenIdLast4: "",
      residenceAddress: "",
      signedAt: null,
    },
    verifier: { signedByName: "", checks: [], signedAt: null },
    completedAt: null,
    ...over,
  });

function renderPanel(onChanged = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const store = configureStore({ reducer: { auth: authReducer } });
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <RecipientDocumentPanel turnId={TURN_ID} groupName="Lượt bàn giao" onChanged={onChanged} />
      </QueryClientProvider>
    </Provider>,
  );
  return onChanged;
}

beforeEach(() => accessTokenMemory.set("fixture-token"));
afterEach(() => {
  vi.restoreAllMocks();
  accessTokenMemory.clear();
});

describe("RecipientDocumentPanel: chọn Chấp nhận hoặc Từ chối", () => {
  it("chưa có biên bản: hiện hai lựa chọn và chưa gửi gì tới khi bấm chọn", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue("");
    const post = vi.spyOn(apiClient, "post");
    renderPanel();

    expect(await screen.findByRole("button", { name: "Tôi chấp nhận" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Tôi từ chối" })).toBeEnabled();
    expect(post).not.toHaveBeenCalled();
  });

  it("bấm Tôi từ chối: POST kind đúng ngay (Phần 1 chép sẵn, không cần Người thực thi) rồi báo cổng tải lại", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue("");
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue(
        documentFixture({ status: "WAIT_RECIPIENT", kind: "DECLINE", completedAt: null }),
      );
    const onChanged = renderPanel();

    await user.click(await screen.findByRole("button", { name: "Tôi từ chối" }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(`/handover/turns/${TURN_ID}/document`, { kind: "DECLINE" });
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it("tạo biên bản lỗi thì báo lỗi và vẫn cho chọn lại", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue("");
    vi.spyOn(apiClient, "post").mockRejectedValue(new Error("mất mạng"));
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Tôi chấp nhận" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tôi chấp nhận" })).toBeEnabled();
  });
});

describe("RecipientDocumentPanel: các bước chờ", () => {
  it("đã gửi Người xét duyệt: chỉ hiện trạng thái chờ, Chấp nhận nói sẽ mở tải tài sản", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(
      documentFixture({ status: "WAIT_VERIFIER", completedAt: null }),
    );
    renderPanel();

    expect(await screen.findByText("Đã gửi cho Người xét duyệt")).toBeInTheDocument();
    expect(screen.getByText(/Xong sẽ mở tải tài sản/)).toBeInTheDocument();
    expect(screen.getByText("Chưa xong")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ký và gửi/ })).not.toBeInTheDocument();
  });

  it("đã gửi Người xét duyệt với văn bản từ chối thì không hứa mở tải tài sản", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(
      documentFixture({ status: "WAIT_VERIFIER", kind: "DECLINE", completedAt: null }),
    );
    renderPanel();

    expect(await screen.findByText(/ghi nhận việc từ chối/)).toBeInTheDocument();
    expect(screen.queryByText(/mở tải tài sản/)).not.toBeInTheDocument();
  });

  it("không tải được thì báo lỗi và cho thử lại", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("mất mạng"));
    renderPanel();

    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được biên bản");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});

describe("RecipientDocumentPanel: đến lượt người nhận", () => {
  it("hiện Phần 1 đã chép từ hồ sơ chứng tử, không có dòng Người thực thi ký, và điền sẵn họ tên", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(recipientTurn());
    renderPanel();

    expect(await screen.findByText("Phần 1 · Thông tin người để lại di sản")).toBeInTheDocument();
    expect(screen.getByText("Nguyễn Văn A")).toBeInTheDocument();
    expect(screen.getByText("0456/2026")).toBeInTheDocument();
    expect(screen.getByText("05/11/2026")).toBeInTheDocument();
    expect(
      screen.getByText(/Lấy từ hồ sơ chứng tử mà Người xét duyệt đã duyệt/),
    ).toBeInTheDocument();
    expect(screen.queryByText("Người thực thi ký")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Họ tên")).toHaveValue("Trần Minh Anh");
    // Nơi thường trú của Chủ kho tạm thời chỉ lưu xuống, không hiện ở Phần 1; ô của người nhận thì có để khai.
    expect(
      screen.queryByText("12 Lê Lợi, Phường Bến Thành, TP. Hồ Chí Minh"),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^Nơi thường trú/)).toHaveValue("");
  });

  it("hồ sơ chứng tử thiếu ngày mất và số giấy thì ghi rõ chưa có, vẫn cho điền và ký", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(
      recipientTurn({
        owner: {
          fullName: "Nguyễn Văn A",
          dateOfDeath: null,
          certificateNumber: "",
          certificateIssuedOn: null,
          residenceAddress: "",
        },
      }),
    );
    renderPanel();

    expect(await screen.findAllByText("Chưa có trong hồ sơ chứng tử")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Ký và gửi cho Người xét duyệt" })).toBeEnabled();
  });

  it("đang chọn Chấp nhận thì có nút đổi sang từ chối: POST lại kind kia rồi báo cổng tải lại", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue(recipientTurn());
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(recipientTurn({ kind: "DECLINE" }));
    const onChanged = renderPanel();

    expect(await screen.findByText(/Bạn đang chọn/)).toHaveTextContent("chấp nhận");
    await user.click(screen.getByRole("button", { name: "Đổi sang từ chối" }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(`/handover/turns/${TURN_ID}/document`, { kind: "DECLINE" });
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it("đã bị trả về bổ sung thì không còn nút đổi lựa chọn", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(
      recipientTurn({ supplementReason: "Ảnh mặt sau bị mờ" }),
    );
    renderPanel();

    await screen.findByText(/Bạn đang chọn/);
    expect(screen.queryByRole("button", { name: /Đổi sang/ })).not.toBeInTheDocument();
  });

  it("toàn văn biên bản thu gọn mặc định, bấm đọc thì trượt ra với Phần 1 thật và hai khối chữ ký", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue(recipientTurn());
    renderPanel();

    const toggle = await screen.findByRole("button", {
      name: "Đọc toàn văn biên bản trước khi ký",
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    await user.click(toggle);

    const text = await screen.findByRole("article", {
      name: "Biên bản đồng ý nhận di sản thừa kế",
    });
    expect(text).toHaveTextContent("Chủ kho Nguyễn Văn A");
    expect(text).not.toHaveTextContent("nơi thường trú");
    expect(text).not.toHaveTextContent("12 Lê Lợi");
    expect(text).toHaveTextContent("số 0456/2026");
    expect(text).toHaveTextContent("Người lập văn bản");
    expect(text).toHaveTextContent("Người xét duyệt đã kiểm tra thủ công");
    expect(text).not.toHaveTextContent("Người thực thi xác nhận");
  });

  it("chưa điền đủ hoặc chưa tick ký thì báo lỗi ngay và không gọi API", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue(recipientTurn());
    const post = vi.spyOn(apiClient, "post");
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Ký và gửi cho Người xét duyệt" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Vui lòng nhập ngày sinh.");
    expect(post).not.toHaveBeenCalled();
  });

  it("điền đủ và tick ký: POST multipart đúng lựa chọn của biên bản", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue(recipientTurn({ kind: "DECLINE" }));
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({
      id: "0199e7a4-1111-7c3e-9a51-3f0f5d2b8a10",
      turnId: TURN_ID,
      kind: "DECLINE",
      status: "SUBMITTED",
      supplementReason: null,
      createdAt: "2026-11-10T04:00:00+00:00",
    });
    const onChanged = renderPanel();

    await user.type(await screen.findByLabelText(/Ngày sinh/), "1990-01-01");
    await user.type(screen.getByLabelText(/Số căn cước/), "012345671234");
    await user.type(screen.getByLabelText(/^Nơi thường trú/), "  34 Trần Hưng Đạo, Hà Nội ");
    await user.upload(
      screen.getByLabelText("Căn cước mặt trước"),
      new File(["a"], "truoc.png", { type: "image/png" }),
    );
    await user.upload(
      screen.getByLabelText("Căn cước mặt sau"),
      new File(["b"], "sau.jpg", { type: "image/jpeg" }),
    );
    await user.click(screen.getByLabelText(/Tôi đã đọc các điều khoản trên/));
    await user.click(screen.getByRole("button", { name: "Ký và gửi cho Người xét duyệt" }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [url, body] = post.mock.calls[0] as [string, FormData];
    expect(url).toBe(`/handover/turns/${TURN_ID}/submission`);
    expect(body.get("Kind")).toBe("DECLINE");
    expect(body.get("FullName")).toBe("Trần Minh Anh");
    expect(body.get("CitizenId")).toBe("012345671234");
    expect(body.get("DateOfBirth")).toBe("1990-01-01");
    expect(body.get("ResidenceAddress")).toBe("34 Trần Hưng Đạo, Hà Nội");
    expect(body.get("Acknowledged")).toBe("true");
    expect(body.get("VoluntaryDecline")).toBe("true");
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it("điều khoản thu gọn mặc định, bấm Xem điều khoản thì trượt ra, và ô tick nêu rõ không chịu trách nhiệm", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue(recipientTurn());
    renderPanel();

    const box = await screen.findByRole("region", { name: "Điều khoản cần biết trước khi ký" });
    const toggle = within(box).getByRole("button", { name: "Xem điều khoản" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(within(box).getByRole("button", { name: "Thu gọn" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(box).toHaveTextContent("Điều 615");
    expect(box).toHaveTextContent("không chịu trách nhiệm");
    expect(screen.getByLabelText(/Tôi đã đọc các điều khoản trên/)).not.toBeChecked();
    expect(screen.getByLabelText(/Tôi đã đọc các điều khoản trên/)).toHaveAccessibleName(
      /LegacyVault chỉ cung cấp công cụ, không chịu trách nhiệm/,
    );
  });

  it("bị Người xét duyệt trả về thì hiện lý do và cho sửa rồi ký lại", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(
      recipientTurn({ supplementReason: "Ảnh mặt sau bị mờ" }),
    );
    renderPanel();

    expect(await screen.findByRole("alert")).toHaveTextContent("Ảnh mặt sau bị mờ");
    expect(
      screen.getByRole("button", { name: "Ký và gửi cho Người xét duyệt" }),
    ).toBeInTheDocument();
  });
});
