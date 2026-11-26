import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import authReducer from "@/entities/user/model/authSlice";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { formatDateTime } from "@/shared/lib/dateFormat";
import { planSetupService } from "../../api/planSetupService";
import type { MyInvitation, MyInvitations } from "../../model/myInvitations.schema";
import { MyInvitationsInbox } from "../MyInvitationsInbox";
import { MyInvitationsBanner } from "../MyInvitationsBanner";

vi.mock("../../api/planSetupService", () => ({
  planSetupService: { mine: vi.fn(), respondById: vi.fn() },
}));

const FIRST_ID = "11111111-1111-4111-8111-111111111111";
const SECOND_ID = "22222222-2222-4222-8222-222222222222";
const DAY_MS = 24 * 60 * 60 * 1000;

function invitation(overrides: Partial<MyInvitation> = {}): MyInvitation {
  return {
    id: FIRST_ID,
    ownerName: "Chủ tài sản thử nghiệm",
    inviteeEmail: "nguoi-duoc-moi@example.test",
    status: "INVITED",
    invitedAt: "2026-11-01T00:00:00Z",
    // Trừ một phút để làm tròn lên vẫn ra đúng 5 ngày.
    expiresAt: new Date(Date.now() + 5 * DAY_MS - 60_000).toISOString(),
    endedAt: null,
    willReady: true,
    willVersionNo: 2,
    willSignedAt: "2026-11-02T00:00:00Z",
    assetCount: 3,
    recipientCount: 1,
    ...overrides,
  };
}

function data(overrides: Partial<MyInvitations> = {}): MyInvitations {
  return {
    scopeVersion: "scope-test",
    scopeText: "Phạm vi thử",
    pending: [],
    ended: [],
    ...overrides,
  };
}

function httpError(status: number, body: unknown): AxiosError {
  return new AxiosError("failed", undefined, undefined, undefined, {
    status,
    statusText: "",
    config: { headers: new AxiosHeaders() },
    headers: {},
    data: body,
  });
}

const PASSWORD_LABEL = "Mật khẩu tài khoản";
const SIGN_BUTTON = "Ký nhận vai";

let client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("invitation-fixture");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
});

function renderWithRoutes(element: ReactNode) {
  return render(
    <Provider store={configureStore({ reducer: { auth: authReducer } })}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/start"]}>
          <Routes>
            <Route path="/start" element={element} />
            <Route path="/executor-invitation" element={<p>Trang trả lời lời mời</p>} />
            <Route path="/invitations" element={<p>Trang lời mời</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

/** Mở xem biên bản phân chia rồi đóng: bắt buộc trước khi ký. */
async function readPaper(card: HTMLElement): Promise<void> {
  await userEvent.click(within(card).getByRole("button", { name: "Xem biên bản phân chia" }));
  const paper = await screen.findByRole("article", { name: "Tờ Biên bản phân chia" });
  expect(paper).toHaveTextContent("Kho có 3 tài sản. Số người nhận đã khai: 1.");
  await userEvent.click(screen.getByRole("button", { name: "Đóng" }));
}

describe("MyInvitationsInbox", () => {
  it("accepts only after the scope is acknowledged and sends the invitation id", async () => {
    vi.mocked(planSetupService.mine).mockResolvedValue(data({ pending: [invitation()] }));
    vi.mocked(planSetupService.respondById).mockResolvedValue({
      id: FIRST_ID,
      status: "ACCEPTED",
      inviteeEmail: "nguoi-duoc-moi@example.test",
      expiresAt: "2026-11-09T00:00:00Z",
      acceptedAt: "2026-11-04T00:00:00Z",
      invitationSentAt: null,
      acceptedScopeVersion: "scope-test",
      etag: "e",
    });
    renderWithRoutes(<MyInvitationsInbox />);
    const card = await screen.findByRole("article", { name: "Lời mời của Chủ tài sản thử nghiệm" });
    expect(within(card).getByText("Còn 5 ngày")).toBeInTheDocument();
    const accept = within(card).getByRole("button", { name: SIGN_BUTTON });
    expect(accept).toBeDisabled();

    expect(within(card).getByRole("checkbox")).toBeDisabled();
    await readPaper(card);
    await userEvent.click(within(card).getByRole("checkbox"));
    // Đã tick phạm vi nhưng chưa có mật khẩu thì vẫn khóa.
    expect(accept).toBeDisabled();
    const passwordInput = within(card).getByLabelText(PASSWORD_LABEL);
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(passwordInput).toHaveAttribute("autocomplete", "current-password");
    await userEvent.type(passwordInput, "mat-khau-thu");
    expect(accept).toBeEnabled();
    await userEvent.click(accept);

    expect(planSetupService.respondById).toHaveBeenCalledWith(
      FIRST_ID,
      true,
      true,
      "scope-test",
      "mat-khau-thu",
      2,
    );
    // Ô mật khẩu được xóa sau lần thử.
    expect(passwordInput).toHaveValue("");
    expect(await screen.findByText("Bạn đã là Người thực thi")).toBeInTheDocument();
  });

  it("declines without asking for the scope acknowledgement", async () => {
    vi.mocked(planSetupService.mine).mockResolvedValue(data({ pending: [invitation()] }));
    renderWithRoutes(<MyInvitationsInbox />);
    const card = await screen.findByRole("article", { name: "Lời mời của Chủ tài sản thử nghiệm" });
    await userEvent.click(within(card).getByRole("button", { name: "Từ chối" }));
    // Hỏi lại trước khi gửi.
    expect(planSetupService.respondById).not.toHaveBeenCalled();
    await userEvent.click(await screen.findByRole("button", { name: "Từ chối lời mời" }));
    expect(planSetupService.respondById).toHaveBeenCalledWith(
      FIRST_ID,
      false,
      false,
      "scope-test",
      undefined,
      2,
    );
  });

  it("Chủ tài sản chưa ký thì chỉ báo chờ, không ký được", async () => {
    vi.mocked(planSetupService.mine).mockResolvedValue(
      data({ pending: [invitation({ willReady: false, willVersionNo: null })] }),
    );
    renderWithRoutes(<MyInvitationsInbox />);
    const card = await screen.findByRole("article", { name: "Lời mời của Chủ tài sản thử nghiệm" });
    expect(within(card).getByText("Chờ Chủ tài sản ký")).toBeInTheDocument();
    expect(within(card).getByRole("checkbox")).toBeDisabled();
    // Chủ tài sản chưa ký: ẩn cả nút ký nhận vai lẫn nút từ chối, chỉ báo chờ.
    expect(within(card).queryByRole("button", { name: SIGN_BUTTON })).not.toBeInTheDocument();
    expect(within(card).queryByRole("button", { name: "Từ chối" })).not.toBeInTheDocument();
    expect(within(card).getByText(/Chủ tài sản chưa ký biên bản phân chia/)).toBeInTheDocument();
  });

  async function acceptWithError(error: AxiosError, password: string) {
    vi.mocked(planSetupService.mine).mockResolvedValue(data({ pending: [invitation()] }));
    vi.mocked(planSetupService.respondById).mockRejectedValue(error);
    renderWithRoutes(<MyInvitationsInbox />);
    const card = await screen.findByRole("article", { name: "Lời mời của Chủ tài sản thử nghiệm" });
    expect(within(card).getByRole("checkbox")).toBeDisabled();
    await readPaper(card);
    await userEvent.click(within(card).getByRole("checkbox"));
    const passwordInput = within(card).getByLabelText(PASSWORD_LABEL);
    await userEvent.type(passwordInput, password);
    await userEvent.click(within(card).getByRole("button", { name: SIGN_BUTTON }));
    return { card, passwordInput };
  }

  it("shows the remaining attempts under the password field when the password is wrong", async () => {
    const { card, passwordInput } = await acceptWithError(
      httpError(403, { code: "SIGNING_PASSWORD_INVALID", attemptsRemaining: 2 }),
      "sai-mat-khau",
    );
    expect(
      await within(card).findByText("Mật khẩu chưa đúng. Còn 2 lần thử trước khi bị tạm khóa."),
    ).toBeInTheDocument();
    expect(passwordInput).toHaveValue("");
    expect(within(card).queryByText("Bạn không có quyền thực hiện thao tác này.")).toBeNull();
  });

  it("shows the unlock time when signing is locked", async () => {
    const lockedUntil = "2026-11-20T10:15:00+00:00";
    const { card } = await acceptWithError(
      httpError(423, { code: "SIGNING_LOCKED", lockedUntil }),
      "mat-khau",
    );
    expect(
      await within(card).findByText(
        `Chức năng ký nhận vai đang tạm khóa đến ${formatDateTime(lockedUntil)}.`,
      ),
    ).toBeInTheDocument();
  });

  it("shows a blank-password message when the server rejects the password field", async () => {
    const { card } = await acceptWithError(
      httpError(400, {
        code: "VALIDATION_ERROR",
        errors: { Password: ["The Password field is required."] },
      }),
      "x",
    );
    expect(
      await within(card).findByText("Vui lòng nhập mật khẩu tài khoản để ký nhận vai."),
    ).toBeInTheDocument();
  });

  it("warns when an invitation expires within a day", async () => {
    const soon = new Date(Date.now() + 3 * 60 * 60 * 1000 - 60_000).toISOString();
    vi.mocked(planSetupService.mine).mockResolvedValue(
      data({ pending: [invitation({ expiresAt: soon })] }),
    );
    renderWithRoutes(<MyInvitationsInbox />);
    expect(await screen.findByText(/Lời mời này sắp hết hạn/)).toBeInTheDocument();
    expect(screen.getByText("Còn 3 giờ")).toBeInTheDocument();
  });

  it("shows an empty state and the ended invitations", async () => {
    vi.mocked(planSetupService.mine).mockResolvedValue(
      data({
        ended: [invitation({ id: SECOND_ID, status: "DECLINED", endedAt: "2026-11-02T00:00:00Z" })],
      }),
    );
    renderWithRoutes(<MyInvitationsInbox />);
    expect(
      await screen.findByText("Không có lời mời nào đang chờ bạn trả lời."),
    ).toBeInTheDocument();
    expect(screen.getByText("Lời mời đã kết thúc")).toBeInTheDocument();
    expect(screen.getByText("Đã từ chối · 02/11/2026")).toBeInTheDocument();
  });

  it("keeps a load failure visible with a retry", async () => {
    vi.mocked(planSetupService.mine).mockRejectedValue(new Error("down"));
    renderWithRoutes(<MyInvitationsInbox />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được lời mời");
  });

  it("không có ô dán link mời", async () => {
    vi.mocked(planSetupService.mine).mockResolvedValue(data());
    renderWithRoutes(<MyInvitationsInbox />);
    expect(
      await screen.findByText("Không có lời mời nào đang chờ bạn trả lời."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Link hoặc mã lời mời")).not.toBeInTheDocument();
  });
});

describe("MyInvitationsBanner", () => {
  it("shows nothing when no invitation is waiting", async () => {
    vi.mocked(planSetupService.mine).mockResolvedValue(data());
    const { container } = renderWithRoutes(<MyInvitationsBanner invitationsHref="/invitations" />);
    await vi.waitFor(() => expect(planSetupService.mine).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the soonest invitation, the other count and a link to the invitations page", async () => {
    vi.mocked(planSetupService.mine).mockResolvedValue(
      data({ pending: [invitation(), invitation({ id: SECOND_ID, ownerName: "Người khác" })] }),
    );
    renderWithRoutes(<MyInvitationsBanner invitationsHref="/invitations" />);
    expect(
      await screen.findByText("Chủ tài sản thử nghiệm mời bạn làm Người thực thi"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Còn 1 lời mời nữa/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("link", { name: "Xem lời mời" }));
    expect(await screen.findByText("Trang lời mời")).toBeInTheDocument();
  });
});
