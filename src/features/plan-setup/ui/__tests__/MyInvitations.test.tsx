import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { planSetupService } from "../../api/planSetupService";
import type { MyInvitation, MyInvitations } from "../../model/myInvitations.schema";
import { MyInvitationsInbox } from "../MyInvitationsInbox";
import { MyInvitationsBanner } from "../MyInvitationsBanner";

vi.mock("../../api/planSetupService", () => ({
  planSetupService: { mine: vi.fn(), respondById: vi.fn() },
}));

const FIRST_ID = "11111111-1111-4111-8111-111111111111";
const SECOND_ID = "22222222-2222-4222-8222-222222222222";
const TOKEN = "b".repeat(64);
const DAY_MS = 24 * 60 * 60 * 1000;

function invitation(overrides: Partial<MyInvitation> = {}): MyInvitation {
  return {
    id: FIRST_ID,
    ownerName: "Chủ kho thử nghiệm",
    inviteeEmail: "nguoi-duoc-moi@example.test",
    status: "INVITED",
    invitedAt: "2026-11-01T00:00:00Z",
    // Trừ một phút để làm tròn lên vẫn ra đúng 5 ngày.
    expiresAt: new Date(Date.now() + 5 * DAY_MS - 60_000).toISOString(),
    endedAt: null,
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
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/start"]}>
        <Routes>
          <Route path="/start" element={element} />
          <Route path="/executor-invitation" element={<p>Trang trả lời lời mời</p>} />
          <Route path="/invitations" element={<p>Trang lời mời</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("MyInvitationsInbox", () => {
  it("accepts only after the scope is acknowledged and sends the invitation id", async () => {
    vi.mocked(planSetupService.mine).mockResolvedValue(data({ pending: [invitation()] }));
    vi.mocked(planSetupService.respondById).mockResolvedValue({
      id: FIRST_ID,
      status: "ACCEPTED",
      inviteeEmail: "nguoi-duoc-moi@example.test",
      isBeneficiary: false,
      expiresAt: "2026-11-09T00:00:00Z",
      acceptedAt: "2026-11-04T00:00:00Z",
      invitationSentAt: null,
      acceptedScopeVersion: "scope-test",
      etag: "e",
    });
    renderWithRoutes(<MyInvitationsInbox />);
    const card = await screen.findByRole("article", { name: "Lời mời của Chủ kho thử nghiệm" });
    expect(within(card).getByText("Còn 5 ngày")).toBeInTheDocument();
    const accept = within(card).getByRole("button", { name: "Chấp nhận" });
    expect(accept).toBeDisabled();

    await userEvent.click(within(card).getByRole("checkbox"));
    await userEvent.click(accept);

    expect(planSetupService.respondById).toHaveBeenCalledWith(FIRST_ID, true, true, "scope-test");
    expect(await screen.findByText("Bạn đã là Người thực hiện")).toBeInTheDocument();
  });

  it("declines without asking for the scope acknowledgement", async () => {
    vi.mocked(planSetupService.mine).mockResolvedValue(data({ pending: [invitation()] }));
    renderWithRoutes(<MyInvitationsInbox />);
    const card = await screen.findByRole("article", { name: "Lời mời của Chủ kho thử nghiệm" });
    await userEvent.click(within(card).getByRole("button", { name: "Từ chối" }));
    expect(planSetupService.respondById).toHaveBeenCalledWith(FIRST_ID, false, false, "scope-test");
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

  it("opens the invitation page from a pasted email link and rejects other text", async () => {
    vi.mocked(planSetupService.mine).mockResolvedValue(data());
    renderWithRoutes(<MyInvitationsInbox />);
    const input = await screen.findByLabelText("Link hoặc mã lời mời");
    await userEvent.type(input, "không phải link");
    await userEvent.click(screen.getByRole("button", { name: "Kiểm tra lời mời" }));
    expect(screen.getByRole("alert")).toHaveTextContent("không hợp lệ");

    await userEvent.clear(input);
    await userEvent.type(input, `https://app.example.test/executor-invitation#token=${TOKEN}`);
    await userEvent.click(screen.getByRole("button", { name: "Kiểm tra lời mời" }));
    expect(await screen.findByText("Trang trả lời lời mời")).toBeInTheDocument();
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
      await screen.findByText("Chủ kho thử nghiệm mời bạn làm Người thực hiện"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Còn 1 lời mời nữa/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("link", { name: "Xem lời mời" }));
    expect(await screen.findByText("Trang lời mời")).toBeInTheDocument();
  });
});
