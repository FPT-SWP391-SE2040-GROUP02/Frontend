import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { apiClient } from "@/shared/api/axiosClient";
import { MyClaimsPanel } from "../MyClaimsPanel";
import { OwnerRequestNotice } from "../OwnerRequestNotice";
import { RequestPanel } from "../RequestPanel";

const VAULT_ID = "11111111-1111-4111-8111-111111111111";
const RECORD_ID = "33333333-3333-4333-8333-333333333333";
const CLAIM_ID = "44444444-4444-4444-8444-444444444444";
const FILE_ID = "55555555-5555-4555-8555-555555555555";
const AT = "2026-11-21T03:00:00+00:00";
const TOKEN = "link-rieng-thu";

const preview = {
  ownerName: "Nguyễn Văn A",
  recipientName: "Trần Minh Anh",
  invitedEmailMasked: "a•••@example.com",
  canRequest: true,
};

function claim(extra: Record<string, unknown> = {}) {
  return {
    id: CLAIM_ID,
    recordId: RECORD_ID,
    ownerName: "Nguyễn Văn A",
    status: "SUBMITTED",
    recordStatus: "DRAFTING",
    note: "",
    reviewReason: null,
    createdAt: AT,
    reviewedAt: null,
    files: [
      {
        id: FILE_ID,
        fileName: "di-chuc.pdf",
        contentType: "application/pdf",
        sizeBytes: 2048,
        createdAt: AT,
      },
    ],
    ...extra,
  };
}

let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("request-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function setup(children: ReactNode, email: string | null, path = `/request?token=${TOKEN}`) {
  const store = configureStore({ reducer: { auth: authReducer } });
  if (email) {
    store.dispatch(
      setCredentials({
        user: {
          id: VAULT_ID,
          email,
          fullName: "Trần Minh Anh",
          role: "USER",
          status: "ACTIVE",
          emailVerified: true,
          hasPassword: true,
          createdAt: AT,
        },
      }),
    );
  }
  return render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

function pdf(name = "di-chuc.pdf") {
  return new File(["%PDF-1.4"], name, { type: "application/pdf" });
}

describe("Trang gửi yêu cầu nhận tài sản", () => {
  it("chưa đăng nhập: chỉ thấy tên Chủ kho, email đã che và nút đăng nhập quay lại đúng link", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(preview);
    setup(<RequestPanel />, null);

    expect(
      await screen.findByText(/Nguyễn Văn A đã khai Trần Minh Anh là người nhận/),
    ).toBeInTheDocument();
    expect(screen.getByText("a•••@example.com")).toBeInTheDocument();
    const login = screen.getByRole("link", { name: "Đăng nhập" });
    expect(decodeURIComponent(login.getAttribute("href") ?? "")).toContain(
      `redirect=/request?token=${TOKEN}`,
    );
    expect(get).toHaveBeenCalledWith(
      "/handover/requests/preview",
      expect.objectContaining({ params: { token: TOKEN } }),
    );
    expect(screen.queryByRole("button", { name: "Gửi yêu cầu" })).not.toBeInTheDocument();
  });

  it("đăng nhập sai email thì báo rõ, không cho gửi", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(preview);
    setup(<RequestPanel />, "khac@example.com");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "link này dành cho a•••@example.com",
    );
    expect(screen.queryByRole("button", { name: "Gửi yêu cầu" })).not.toBeInTheDocument();
  });

  it("phải đính kèm tệp; gửi kèm tệp và lời nhắn thì báo đã gửi", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue(preview);
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(claim());
    setup(<RequestPanel />, "an@example.com");

    await user.click(await screen.findByRole("button", { name: "Gửi yêu cầu" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Vui lòng đính kèm ít nhất một tệp giấy tờ.",
    );
    expect(post).not.toHaveBeenCalled();

    await user.upload(screen.getByLabelText(/Tệp giấy tờ/), pdf());
    await user.type(screen.getByLabelText(/Lời nhắn cho luật sư/), "Bố tôi mất ngày 1/11");
    await user.click(screen.getByRole("button", { name: "Gửi yêu cầu" }));

    expect(await screen.findByText("Đã gửi yêu cầu")).toBeInTheDocument();
    const [url, body] = post.mock.calls[0];
    expect(url).toBe("/handover/requests");
    const form = body as FormData;
    expect(form.get("token")).toBe(TOKEN);
    expect(form.get("note")).toBe("Bố tôi mất ngày 1/11");
    expect((form.get("files") as File).name).toBe("di-chuc.pdf");
  });

  it("kho chưa kích hoạt thì báo chưa gửi được", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({ ...preview, canRequest: false });
    setup(<RequestPanel />, "an@example.com");

    expect(await screen.findByText("Chưa gửi yêu cầu được")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Gửi yêu cầu" })).not.toBeInTheDocument();
  });

  it("link sai thì báo link chưa dùng được", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("404"));
    setup(<RequestPanel />, null);

    expect(await screen.findByRole("alert")).toHaveTextContent("Link chưa dùng được");
  });
});

describe("Yêu cầu nhận tài sản của tôi", () => {
  it("luật sư yêu cầu bổ sung: hiện lý do và cho nộp thêm tệp", async () => {
    const user = userEvent.setup();
    let current = claim({ status: "SUPPLEMENT_REQUESTED", reviewReason: "Thiếu giấy chứng tử" });
    vi.spyOn(apiClient, "get").mockImplementation(async () => [current]);
    const post = vi.spyOn(apiClient, "post").mockImplementation(async () => {
      current = claim({ status: "SUBMITTED" });
      return current;
    });
    setup(<MyClaimsPanel />, "an@example.com", "/claim/beneficiary");

    const card = await screen.findByRole("article", {
      name: "Yêu cầu nhận tài sản của Nguyễn Văn A",
    });
    expect(card).toHaveTextContent("Cần bổ sung giấy tờ");
    expect(card).toHaveTextContent("Lý do của luật sư: Thiếu giấy chứng tử");
    expect(within(card).getByRole("button", { name: "Tải về di-chuc.pdf" })).toBeInTheDocument();

    await user.upload(within(card).getByLabelText(/Tệp giấy tờ/), pdf("giay-chung-tu.pdf"));
    await user.click(within(card).getByRole("button", { name: "Nộp bổ sung" }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][0]).toBe(`/handover/requests/${CLAIM_ID}/supplement`);
    expect(await screen.findByText("Luật sư đang xét giấy tờ của bạn.")).toBeInTheDocument();
  });

  it("không có yêu cầu nào thì không hiện mục", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue([]);
    setup(<MyClaimsPanel />, "an@example.com", "/claim/beneficiary");

    await waitFor(() => expect(get).toHaveBeenCalled());
    expect(screen.queryByText("Yêu cầu nhận tài sản")).not.toBeInTheDocument();
  });

  it("Chủ kho đã hủy thì ghi rõ, không cho nộp bổ sung", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      claim({ status: "SUPPLEMENT_REQUESTED", recordStatus: "CANCELLED" }),
    ]);
    setup(<MyClaimsPanel />, "an@example.com", "/claim/beneficiary");

    expect(await screen.findByText("Chủ kho đã hủy yêu cầu này.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nộp bổ sung" })).not.toBeInTheDocument();
  });
});

describe("Chủ kho thấy và hủy yêu cầu nhận tài sản", () => {
  it("hiện người gửi; hủy phải xác nhận rồi mới gọi Backend", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue({
      recordId: RECORD_ID,
      status: "DRAFTING",
      requestedAt: AT,
      requesterNames: ["Trần Minh Anh"],
      canCancel: true,
    });
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(undefined);
    setup(<OwnerRequestNotice vaultId={VAULT_ID} />, "owner@example.com", "/dashboard/wills");

    expect(
      await screen.findByText(/Trần Minh Anh đã gửi yêu cầu nhận tài sản/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Hủy yêu cầu" }));
    expect(post).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Giữ yêu cầu" }));
    await user.click(screen.getByRole("button", { name: "Hủy yêu cầu" }));
    await user.click(screen.getByRole("button", { name: "Đồng ý hủy" }));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(`/vaults/${VAULT_ID}/handover-request/cancel`),
    );
  });

  it("biên bản đã đủ chữ ký thì không còn nút hủy", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      recordId: RECORD_ID,
      status: "COMPLETED",
      requestedAt: AT,
      requesterNames: ["Trần Minh Anh"],
      canCancel: false,
    });
    setup(<OwnerRequestNotice vaultId={VAULT_ID} />, "owner@example.com", "/dashboard/wills");

    expect(await screen.findByText(/Trần Minh Anh đã gửi yêu cầu/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hủy yêu cầu" })).not.toBeInTheDocument();
  });

  it("không có yêu cầu (204) thì không hiện gì", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue("");
    setup(<OwnerRequestNotice vaultId={VAULT_ID} />, "owner@example.com", "/dashboard/wills");

    await waitFor(() => expect(get).toHaveBeenCalled());
    expect(screen.queryByText("Có yêu cầu nhận tài sản")).not.toBeInTheDocument();
  });
});
