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
import { OwnerReceiveCard } from "../OwnerReceiveCard";

const VAULT_A = "11111111-1111-4111-8111-111111111111";
const VAULT_B = "21111111-1111-4111-8111-111111111111";
const VAULT_C = "31111111-1111-4111-8111-111111111111";
const BENEFICIARY_ID = "22222222-2222-4222-8222-222222222222";
const CLAIM_ID = "44444444-4444-4444-8444-444444444444";
const TURN_ID = "55555555-5555-4555-8555-555555555555";

function row(extra: Record<string, unknown> = {}) {
  return {
    vaultId: VAULT_A,
    beneficiaryId: BENEFICIARY_ID,
    ownerName: "Nguyễn Văn A",
    status: "NOT_REQUESTED",
    needsAction: false,
    canRequest: false,
    reviewReason: null,
    claimId: null,
    turnId: null,
    ...extra,
  };
}

let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("available-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function setup(children: ReactNode) {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(
    setCredentials({
      user: {
        id: VAULT_A,
        email: "an@example.com",
        fullName: "Trần Minh Anh",
        role: "USER",
        status: "ACTIVE",
        emailVerified: true,
        hasPassword: true,
        createdAt: "2026-11-21T03:00:00+00:00",
      },
    }),
  );
  return render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe("Trang Nhận tài sản: danh sách", () => {
  it("đang tải thì báo đang tải", () => {
    vi.spyOn(apiClient, "get").mockReturnValue(new Promise(() => {}));
    setup(<AvailableHandoverList />);
    expect(screen.getByRole("status")).toHaveTextContent("Đang tải");
  });

  it("rỗng thì giải thích khi nào kho hiện ra", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([]);
    setup(<AvailableHandoverList />);
    expect(
      await screen.findByText("Hiện tại bạn chưa là người nhận của kho nào"),
    ).toBeInTheDocument();
    expect(screen.getByText(/email đã xác minh của bạn/)).toBeInTheDocument();
    expect(screen.getByText(/kích hoạt kế hoạch/)).toBeInTheDocument();
  });

  it("lỗi thì báo và có nút thử lại", async () => {
    const user = userEvent.setup();
    const get = vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("503"));
    setup(<AvailableHandoverList />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được danh sách");

    get.mockResolvedValue([row({ canRequest: true })]);
    await user.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(
      await screen.findByRole("article", { name: "Kho của Nguyễn Văn A" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("mỗi dòng đúng nhãn, lý do và một nút theo trạng thái; dòng cần làm lên đầu", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      row({ vaultId: VAULT_A, ownerName: "Chờ Xét", status: "REQUEST_PENDING" }),
      row({
        vaultId: VAULT_B,
        ownerName: "Cần Bổ Sung",
        status: "SUPPLEMENT_REQUESTED",
        needsAction: true,
        reviewReason: "Thiếu giấy chứng tử",
        claimId: CLAIM_ID,
      }),
      row({
        vaultId: VAULT_C,
        ownerName: "Có Mã",
        status: "CODE_READY",
        needsAction: true,
        turnId: TURN_ID,
      }),
    ]);
    setup(<AvailableHandoverList />);

    const cards = await screen.findAllByRole("article");
    expect(cards.map((card) => card.getAttribute("aria-label"))).toEqual([
      "Kho của Cần Bổ Sung",
      "Kho của Có Mã",
      "Kho của Chờ Xét",
    ]);

    const supplement = cards[0];
    expect(supplement).toHaveTextContent("Cần bổ sung giấy tờ");
    expect(supplement).toHaveTextContent("Lý do của luật sư: Thiếu giấy chứng tử");
    expect(within(supplement).getAllByRole("link")).toHaveLength(1);
    expect(within(supplement).getByRole("link", { name: /Nộp bổ sung/ })).toHaveAttribute(
      "href",
      "/claim/beneficiary",
    );
    expect(within(cards[1]).getByRole("link", { name: /Nhập mã và tải/ })).toHaveAttribute(
      "href",
      "/claim/beneficiary",
    );
    expect(within(cards[2]).getByRole("link", { name: /Xem yêu cầu/ })).toBeInTheDocument();
  });

  it("chưa gửi và gửi được thì dẫn tới trang gửi yêu cầu kèm vaultId", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([row({ canRequest: true, needsAction: true })]);
    setup(<AvailableHandoverList />);
    const link = await screen.findByRole("link", { name: /Gửi yêu cầu/ });
    expect(link).toHaveAttribute("href", `/request?vaultId=${VAULT_A}`);
  });

  it("trạng thái chỉ để xem không có biên bản thì chỉ hiện nhãn, không có nút", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      row({ status: "WAITING_OTHERS" }),
      row({ vaultId: VAULT_B, ownerName: "Đã Nhận", status: "RECEIVED", turnId: TURN_ID }),
    ]);
    setup(<AvailableHandoverList />);
    const cards = await screen.findAllByRole("article");
    expect(cards[0]).toHaveTextContent("Chờ các bên khác ký");
    expect(within(cards[0]).queryByRole("link")).not.toBeInTheDocument();
    expect(within(cards[1]).getByRole("link", { name: /Xem biên bản/ })).toBeInTheDocument();
  });
});

describe("Thẻ trên Tổng quan Chủ kho", () => {
  it("không hiện khi không có dòng cần làm", async () => {
    const get = vi
      .spyOn(apiClient, "get")
      .mockResolvedValue([row({ status: "REQUEST_PENDING" }), row({ status: "RECEIVED" })]);
    setup(<OwnerReceiveCard />);
    await waitFor(() => expect(get).toHaveBeenCalled());
    await waitFor(() => expect(client.isFetching()).toBe(0));
    expect(screen.queryByRole("region", { name: "Tài sản được để lại cho bạn" })).toBeNull();
  });

  it("không hiện khi lỗi", async () => {
    const get = vi.spyOn(apiClient, "get").mockRejectedValue(new Error("500"));
    setup(<OwnerReceiveCard />);
    await waitFor(() => expect(get).toHaveBeenCalled());
    await waitFor(() => expect(client.isFetching()).toBe(0));
    expect(screen.queryByRole("region", { name: "Tài sản được để lại cho bạn" })).toBeNull();
  });

  it("một kho cần làm: ghi tên Chủ kho và nút tới trang Nhận tài sản", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      row({ status: "CODE_READY", needsAction: true }),
    ]);
    setup(<OwnerReceiveCard />);
    const card = await screen.findByRole("region", { name: "Tài sản được để lại cho bạn" });
    expect(card).toHaveTextContent("Nguyễn Văn A để lại tài sản cho bạn");
    expect(card).not.toHaveTextContent("kho nữa");
    expect(within(card).getByRole("link", { name: "Mở trang Nhận tài sản" })).toHaveAttribute(
      "href",
      "/dashboard/receive-assets",
    );
  });

  it("nhiều kho cần làm: nêu kho đầu và còn bao nhiêu kho nữa", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      row({ ownerName: "Kho Một", status: "REQUEST_PENDING" }),
      row({
        vaultId: VAULT_B,
        ownerName: "Kho Hai",
        status: "NEED_MY_SIGNATURE",
        needsAction: true,
      }),
      row({ vaultId: VAULT_C, ownerName: "Kho Ba", status: "CODE_READY", needsAction: true }),
    ]);
    setup(<OwnerReceiveCard />);
    const card = await screen.findByRole("region", { name: "Tài sản được để lại cho bạn" });
    expect(card).toHaveTextContent("Kho Hai để lại tài sản cho bạn");
    expect(card).toHaveTextContent("Còn 1 kho nữa");
  });
});
