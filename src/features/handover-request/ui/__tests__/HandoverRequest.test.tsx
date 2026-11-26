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
import { AvailableHandoverList } from "../AvailableHandoverList";
import { MyClaimsPanel } from "../MyClaimsPanel";
import { OwnerRequestNotice } from "../OwnerRequestNotice";

const VAULT_ID = "11111111-1111-4111-8111-111111111111";
const RECORD_ID = "33333333-3333-4333-8333-333333333333";
const CLAIM_ID = "44444444-4444-4444-8444-444444444444";
const FILE_ID = "55555555-5555-4555-8555-555555555555";
const AT = "2026-11-21T03:00:00+00:00";

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

function setup(children: ReactNode, email: string | null, path = "/dashboard/receive-assets") {
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

function availableRow(extra: Record<string, unknown> = {}) {
  return {
    vaultId: VAULT_ID,
    beneficiaryId: RECORD_ID,
    ownerName: "Nguyễn Văn A",
    status: "NOT_REQUESTED",
    needsAction: true,
    canRequest: true,
    reviewReason: null,
    claimId: null,
    turnId: null,
    ...extra,
  };
}

describe("Gửi yêu cầu nhận tài sản ngay trong thẻ kho", () => {
  it("bấm Gửi yêu cầu thì form mở trong thẻ, gọi by-account kèm vaultId và làm mới danh sách", async () => {
    const user = userEvent.setup();
    const get = vi.spyOn(apiClient, "get").mockResolvedValue([availableRow()]);
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(claim());
    setup(<AvailableHandoverList />, "an@example.com");

    const toggle = await screen.findByRole("button", {
      name: "Gửi yêu cầu - kho của Nguyễn Văn A",
    });
    const region = document.getElementById(toggle.getAttribute("aria-controls") ?? "");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    // Form thu gọn thì không nhận tab hay chuột.
    expect(region).toHaveAttribute("inert");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(region).not.toHaveAttribute("inert");

    await user.upload(screen.getByLabelText(/^Di chúc/), pdf());
    await user.type(screen.getByLabelText(/Lời nhắn cho luật sư/), "Bố tôi mất ngày 1/11");
    get.mockClear();
    await user.click(screen.getByRole("button", { name: "Gửi yêu cầu" }));

    expect(await screen.findByText("Đã gửi yêu cầu")).toBeInTheDocument();
    const [url, body] = post.mock.calls[0];
    expect(url).toBe("/handover/requests/by-account");
    const form = body as FormData;
    expect(form.get("vaultId")).toBe(VAULT_ID);
    expect(form.get("token")).toBeNull();
    expect(form.get("note")).toBe("Bố tôi mất ngày 1/11");
    // Danh sách available đang được xem nên bị tải lại ngay sau khi gửi xong.
    await waitFor(() =>
      expect(get).toHaveBeenCalledWith("/handover/requests/available", expect.anything()),
    );
  });

  it("phải đính kèm di chúc trước khi gửi", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiClient, "get").mockResolvedValue([availableRow()]);
    const post = vi.spyOn(apiClient, "post");
    setup(<AvailableHandoverList />, "an@example.com");

    await user.click(await screen.findByRole("button", { name: /Gửi yêu cầu - kho của/ }));
    await user.click(screen.getByRole("button", { name: "Gửi yêu cầu" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Vui lòng đính kèm di chúc.");
    expect(post).not.toHaveBeenCalled();
  });

  it("canRequest false thì không có nút Gửi yêu cầu", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([availableRow({ canRequest: false })]);
    setup(<AvailableHandoverList />, "an@example.com");

    expect(await screen.findByText(/Chưa gửi được yêu cầu lúc này/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Gửi yêu cầu/ })).not.toBeInTheDocument();
  });
});

describe("Yêu cầu nhận tài sản của tôi", () => {
  it("luật sư yêu cầu bổ sung: hiện lý do và cho nộp thêm tệp", async () => {
    const user = userEvent.setup();
    let current = claim({
      status: "SUPPLEMENT_REQUESTED",
      reviewReason: "Thiếu giấy tờ chứng minh",
    });
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
    expect(card).toHaveTextContent("Lý do của luật sư: Thiếu giấy tờ chứng minh");
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

  it("luật sư đã hủy thì ghi rõ lý do, không cho nộp bổ sung", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      claim({
        status: "SUPPLEMENT_REQUESTED",
        recordStatus: "CANCELLED",
        cancelReason: "Mở nhầm hồ sơ",
      }),
    ]);
    setup(<MyClaimsPanel />, "an@example.com", "/claim/beneficiary");

    expect(
      await screen.findByText("Luật sư đã hủy yêu cầu này. Lý do: Mở nhầm hồ sơ"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nộp bổ sung" })).not.toBeInTheDocument();
  });
});

describe("Chủ tài sản thấy yêu cầu nhận tài sản", () => {
  it("hiện người gửi và không có nút hủy", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      recordId: RECORD_ID,
      status: "DRAFTING",
      requestedAt: AT,
      requesterNames: ["Trần Minh Anh"],
      vaultLocked: true,
    });
    setup(<OwnerRequestNotice vaultId={VAULT_ID} />, "owner@example.com", "/dashboard/wills");

    expect(
      await screen.findByText(/Trần Minh Anh đã gửi yêu cầu nhận tài sản/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hủy yêu cầu" })).not.toBeInTheDocument();
  });

  it("kho chưa khóa thì báo luật sư đang xét và Chủ tài sản vẫn sửa được kho", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      recordId: RECORD_ID,
      status: "DRAFTING",
      requestedAt: AT,
      requesterNames: ["Trần Minh Anh"],
      vaultLocked: false,
    });
    setup(<OwnerRequestNotice vaultId={VAULT_ID} />, "owner@example.com", "/dashboard/wills");

    expect(
      await screen.findByText(
        /Có yêu cầu nhận tài sản đang được luật sư xét\. Kho chưa khóa; bạn vẫn sửa được kho cho tới khi luật sư chấp nhận giấy tờ\./,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Kho đang khóa/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hủy yêu cầu" })).not.toBeInTheDocument();
  });

  it("kho đã khóa thì báo kho đang khóa trong lúc luật sư xét giấy tờ", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      recordId: RECORD_ID,
      status: "DRAFTING",
      requestedAt: AT,
      requesterNames: ["Trần Minh Anh"],
      vaultLocked: true,
    });
    setup(<OwnerRequestNotice vaultId={VAULT_ID} />, "owner@example.com", "/dashboard/wills");

    expect(
      await screen.findByText(/Kho đang khóa trong lúc luật sư xét giấy tờ và lập biên bản\./),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Kho chưa khóa/)).not.toBeInTheDocument();
  });

  it("không có yêu cầu (204) thì không hiện gì", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue("");
    setup(<OwnerRequestNotice vaultId={VAULT_ID} />, "owner@example.com", "/dashboard/wills");

    await waitFor(() => expect(get).toHaveBeenCalled());
    expect(screen.queryByText("Có yêu cầu nhận tài sản")).not.toBeInTheDocument();
  });
});
