import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import authReducer, { type AuthState } from "@/entities/user/model/authSlice";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { apiClient } from "@/shared/api/axiosClient";
import { submissionFormError, type SubmissionDraft } from "../../model/submissionForm";
import { RecipientSubmissionPanel } from "../RecipientSubmissionPanel";

const TURN_ID = "0199e7a4-0000-7c3e-9a51-3f0f5d2b8a10";

const valid = (): SubmissionDraft => ({
  kind: "ACCEPT",
  fullName: "Trần Minh Anh",
  citizenId: "012345671234",
  dateOfBirth: "1990-01-01",
  front: new File(["a"], "truoc.png", { type: "image/png" }),
  back: new File(["b"], "sau.jpg", { type: "image/jpeg" }),
  acknowledged: true,
  voluntaryDecline: false,
});

function submission(status: string, over: Record<string, unknown> = {}) {
  return {
    id: "0199e7a4-1111-7c3e-9a51-3f0f5d2b8a10",
    turnId: TURN_ID,
    kind: "ACCEPT",
    status,
    supplementReason: null,
    createdAt: "2026-11-08T08:00:00+00:00",
    ...over,
  };
}

function renderPanel(onChanged = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const auth: AuthState = {
    isAuthenticated: true,
    isHydrating: false,
    user: {
      id: "u1",
      email: "nguoi-nhan@example.invalid",
      fullName: "Người nhận",
      phone: "0912345678",
      role: "USER",
    } as AuthState["user"],
  };
  const store = configureStore({ reducer: { auth: authReducer }, preloadedState: { auth } });
  render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <RecipientSubmissionPanel
          turnId={TURN_ID}
          groupName="Gói gia đình"
          serverTime="2026-11-09T02:00:00Z"
          onChanged={onChanged}
        />
      </QueryClientProvider>
    </Provider>,
  );
  return onChanged;
}

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Họ tên"), "Trần Minh Anh");
  await user.type(screen.getByLabelText("Ngày sinh"), "1990-01-01");
  await user.type(screen.getByLabelText("Số căn cước"), "012345671234");
  await user.upload(
    screen.getByLabelText("Căn cước mặt trước"),
    new File(["a"], "truoc.png", { type: "image/png" }),
  );
  await user.upload(
    screen.getByLabelText("Căn cước mặt sau"),
    new File(["b"], "sau.jpg", { type: "image/jpeg" }),
  );
}

beforeEach(() => accessTokenMemory.set("fixture-token"));
afterEach(() => {
  vi.restoreAllMocks();
  accessTokenMemory.clear();
});

describe("submissionFormError", () => {
  it("bản điền đủ và đúng hình thức thì không có lỗi", () => {
    expect(submissionFormError(valid())).toBeNull();
  });

  it("báo lỗi theo thứ tự: họ tên, ngày sinh, căn cước, hai ảnh, điều khoản", () => {
    expect(submissionFormError({ ...valid(), fullName: "  " })).toMatch(/họ tên/);
    expect(submissionFormError({ ...valid(), dateOfBirth: "" })).toMatch(/ngày sinh/);
    expect(submissionFormError({ ...valid(), dateOfBirth: "2999-01-01" })).toMatch(/không hợp lệ/);
    expect(submissionFormError({ ...valid(), citizenId: "123" })).toMatch(/12 chữ số/);
    expect(submissionFormError({ ...valid(), front: null })).toMatch(/mặt trước/);
    expect(submissionFormError({ ...valid(), back: null })).toMatch(/mặt sau/);
    expect(submissionFormError({ ...valid(), acknowledged: false })).toMatch(/đã đọc điều khoản/);
  });

  it("ảnh không đúng định dạng hoặc quá 8 MiB bị từ chối", () => {
    const pdf = new File(["x"], "a.pdf", { type: "application/pdf" });
    expect(submissionFormError({ ...valid(), front: pdf })).toMatch(/JPEG, PNG hoặc WEBP/);
    const big = new File([new Uint8Array(8 * 1024 * 1024 + 1)], "lon.png", { type: "image/png" });
    expect(submissionFormError({ ...valid(), back: big })).toMatch(/tối đa 8 MiB/);
  });

  it("từ chối thì bắt buộc tick tự nguyện từ chối", () => {
    expect(submissionFormError({ ...valid(), kind: "DECLINE" })).toMatch(/tự nguyện từ chối/);
    expect(submissionFormError({ ...valid(), kind: "DECLINE", voluntaryDecline: true })).toBeNull();
  });
});

describe("RecipientSubmissionPanel", () => {
  it("chưa nộp: hiện điều khoản và hai lựa chọn, văn bản mẫu chỉ bật ra sau khi chọn", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue("");
    renderPanel();

    expect(await screen.findByRole("button", { name: "Tôi chấp nhận" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Từ chối" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Họ tên")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tôi chấp nhận" }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("article", { name: "Biên bản đồng ý nhận di sản" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Họ tên")).toBeInTheDocument();
  });

  it("chọn Từ chối thì văn bản đổi và có thêm ô tự nguyện từ chối", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue("");
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Tôi từ chối" }));

    expect(
      await screen.findByRole("article", { name: "Văn bản từ chối nhận di sản" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/tự nguyện từ chối và không nhằm trốn tránh/)).toBeInTheDocument();
  });

  it("văn bản từ chối có ô họ tên, ngày sinh, số căn cước ngay trên văn bản và ngày theo giờ máy chủ", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue("");
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Tôi từ chối" }));

    const paper = await screen.findByRole("article", { name: "Văn bản từ chối nhận di sản" });
    expect(paper).toHaveTextContent("Hôm nay, ngày 09 tháng 11 năm 2026");
    expect(within(paper).getByLabelText("Họ tên")).toBeInTheDocument();
    expect(within(paper).getByLabelText("Ngày sinh")).toBeInTheDocument();
    expect(within(paper).getByLabelText("Số căn cước")).toBeInTheDocument();
  });

  it("biên bản đồng ý chỉ có ô họ tên trên văn bản, ngày sinh và số căn cước nằm bên dưới", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue("");
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Tôi chấp nhận" }));

    const paper = await screen.findByRole("article", { name: "Biên bản đồng ý nhận di sản" });
    expect(within(paper).getByLabelText("Họ tên")).toBeInTheDocument();
    expect(within(paper).queryByLabelText("Ngày sinh")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Ngày sinh")).toBeInTheDocument();
    expect(screen.getByLabelText("Số căn cước")).toBeInTheDocument();
  });

  it("đóng hộp thoại không mất dữ liệu đã điền, mở lại vẫn còn", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue("");
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Tôi chấp nhận" }));
    await user.type(await screen.findByLabelText("Họ tên"), "Trần Minh Anh");
    await user.click(screen.getByRole("button", { name: "Đóng" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Tôi chấp nhận" }));

    expect(await screen.findByLabelText("Họ tên")).toHaveValue("Trần Minh Anh");
  });

  it("điền đủ rồi gửi: POST multipart đúng các trường, rồi báo cổng tải lại", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue("");
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(submission("SUBMITTED"));
    const onChanged = renderPanel();

    await user.click(await screen.findByRole("button", { name: "Tôi chấp nhận" }));
    await fillForm(user);
    await user.click(screen.getByLabelText(/Tôi đã đọc điều khoản/));
    await user.click(screen.getByRole("button", { name: "Gửi chấp nhận" }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [url, body] = post.mock.calls[0] as [string, FormData];
    expect(url).toBe(`/handover/turns/${TURN_ID}/submission`);
    expect(body.get("Kind")).toBe("ACCEPT");
    expect(body.get("FullName")).toBe("Trần Minh Anh");
    expect(body.get("CitizenId")).toBe("012345671234");
    expect(body.get("DateOfBirth")).toBe("1990-01-01");
    expect(body.get("Acknowledged")).toBe("true");
    expect((body.get("FrontImage") as File).name).toBe("truoc.png");
    expect((body.get("BackImage") as File).name).toBe("sau.jpg");
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it("thiếu thông tin thì báo lỗi ngay và không gọi API", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue("");
    const post = vi.spyOn(apiClient, "post");
    renderPanel();

    await user.click(await screen.findByRole("button", { name: "Tôi chấp nhận" }));
    await user.click(screen.getByRole("button", { name: "Gửi chấp nhận" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Vui lòng nhập họ tên.");
    expect(post).not.toHaveBeenCalled();
  });

  it("đã gửi và chờ duyệt: chỉ hiện trạng thái chờ, không cho nộp lại", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(submission("SUBMITTED", { kind: "DECLINE" }));
    renderPanel();

    expect(await screen.findByText(/chờ Người xét duyệt/)).toBeInTheDocument();
    expect(screen.getByText("Từ chối")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tôi chấp nhận" })).not.toBeInTheDocument();
  });

  it("bị yêu cầu bổ sung: hiện lý do của Người xét duyệt và cho nộp lại", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(
      submission("SUPPLEMENT_REQUESTED", { supplementReason: "Ảnh mặt sau bị mờ" }),
    );
    renderPanel();

    expect(await screen.findByRole("alert")).toHaveTextContent("Ảnh mặt sau bị mờ");
    expect(screen.getByRole("button", { name: "Tôi chấp nhận" })).toBeInTheDocument();
  });

  it("không tải được hồ sơ thì báo lỗi và cho thử lại, không hiện form", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("mất mạng"));
    renderPanel();

    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được hồ sơ");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tôi chấp nhận" })).not.toBeInTheDocument();
  });
});
