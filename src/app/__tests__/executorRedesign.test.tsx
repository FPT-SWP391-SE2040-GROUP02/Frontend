import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { VAULT_ID, CREATED_AT } from "@/shared/api/__tests__/backend.fixtures";
import { HandoverProgressPanel } from "@/features/death-case/ui/HandoverProgressPanel";
import { ExecutorAssetsPage } from "@/pages/executor/ExecutorAssetsPage";
import { ExecutorInvitationsPage } from "@/pages/executor/ExecutorInvitationsPage";
import { ExecutorSettingsPage } from "@/pages/executor/ExecutorSettingsPage";
import { ExecutorOverviewPage } from "@/pages/executor/ExecutorOverviewPage";

const CASE_ID = "33333333-3333-4333-8333-333333333333";
const CONTAINER_ID = "66666666-6666-4666-8666-666666666666";
const ASSET_ID = "77777777-7777-4777-8777-777777777777";
const SENT = "2026-12-23T06:14:00+00:00";
const SIGNED = "2026-12-23T07:00:00+00:00";
const APPROVED = "2026-12-23T08:00:00+00:00";
const KEY = "2026-12-23T09:00:00+00:00";
const RECEIVED = "2026-12-23T09:52:00+00:00";

function turn(index: number, name: string | null, overrides: Record<string, unknown>) {
  return {
    turnId: `5555555${index}-5555-4555-8555-555555555555`,
    // Chỉ lượt 1 thuộc gói có trong danh sách tài sản của test.
    containerId: index === 1 ? CONTAINER_ID : `bbbbbbb${index}-bbbb-4bbb-8bbb-bbbbbbbbbbbb`,
    containerName: `Gói ${index}`,
    beneficiaryCitizenIdLast4: `000${index}`,
    beneficiaryFullName: name,
    beneficiaryPhone: name ? "0901234567" : null,
    beneficiaryEmail: name ? "an@example.test" : null,
    status: "INVITED",
    claimedByYou: false,
    identityConfirmedByExecutor: false,
    invitedAt: SENT,
    responseDeadline: "2026-12-28T06:00:00+00:00",
    claimedAt: null,
    decisionDeadline: null,
    decidedAt: null,
    grantStatus: null,
    grantExpiresAt: null,
    totalItems: 3,
    downloadedItems: 0,
    items: [],
    ...overrides,
  };
}

const turns = [
  // 1: đã nhận xong
  turn(1, "Nguyễn Văn An", {
    status: "HANDOVER_COMMITTED",
    invitationSentAt: SENT,
    recipientSignedAt: SIGNED,
    documentApprovedAt: APPROVED,
    decidedAt: APPROVED,
    keyVerifiedAt: KEY,
    receivedAllAt: RECEIVED,
    downloadedItems: 3,
    items: [
      {
        itemId: "a1111111-1111-4111-8111-111111111111",
        assetId: ASSET_ID,
        name: "Sổ tiết kiệm.pdf",
        kind: "FILE",
        downloaded: true,
        firstDownloadedAt: RECEIVED,
      },
    ],
  }),
  // 2: từ chối
  turn(2, null, { status: "DECLINED", invitationSentAt: SENT, decidedAt: APPROVED }),
  // 3: chờ trả lời
  turn(3, "Lê Thị Bình", { invitationSentAt: SENT }),
  // 4: cần bạn đưa mã
  turn(4, "Phạm Văn Cường", {
    status: "HANDOVER_COMMITTED",
    invitationSentAt: SENT,
    recipientSignedAt: SIGNED,
    documentApprovedAt: APPROVED,
    decidedAt: APPROVED,
  }),
  // 5: chờ Người xét duyệt
  turn(5, "Đỗ Thị Dung", {
    status: "IDENTITY_IN_PROGRESS",
    invitationSentAt: SENT,
    recipientSignedAt: SIGNED,
  }),
  // 6: chưa gửi được lời mời
  turn(6, "Vũ Văn Em", { invitationSentAt: null }),
];

const progress = {
  caseId: CASE_ID,
  handoverStarted: true,
  serverTime: SENT,
  summary: {
    totalTurns: 6,
    waitingResponse: 2,
    inVerification: 1,
    accepted: 2,
    declined: 1,
    ended: 0,
  },
  turns,
};

const vault = (overrides: Record<string, unknown> = {}) => ({
  vaultId: VAULT_ID,
  ownerFullName: "Anh Nam",
  planStatus: "HANDOVER_IN_PROGRESS",
  checkInOverdue: false,
  openDeathCaseId: CASE_ID,
  lastRejectedDeathCaseId: null,
  executorNote: "Gọi cô Lan trước.\nSau đó gửi mã.",
  executorNoteUpdatedAt: "2026-11-05T03:00:00Z",
  acceptedAt: "2026-10-01T03:00:00Z",
  ...overrides,
});

const deathCase = {
  id: CASE_ID,
  vaultId: VAULT_ID,
  status: "APPROVED_FOR_HANDOVER",
  currentVersion: {
    versionNo: 1,
    isDraft: false,
    ownerFullName: "Anh Nam",
    ownerCitizenIdLast4: "0001",
    dateOfDeath: null,
    certificateNumber: null,
    issuedOn: null,
    issuedBy: null,
    files: [],
    submittedAt: CREATED_AT,
  },
  reviewVersionNo: 1,
  missingRequirements: [],
  ownerNotice: null,
  objectionEndsAt: null,
  createdAt: CREATED_AT,
  updatedAt: null,
  etag: "case-v1",
};

const packages = [
  {
    containerId: CONTAINER_ID,
    containerName: "Gói 1",
    recipients: [{ fullName: "Nguyễn Văn An", citizenIdLast4: "0001" }],
    assets: [
      { id: ASSET_ID, name: "Sổ tiết kiệm.pdf", kind: "FILE", sizeBytes: 100 },
      {
        id: "88888888-8888-4888-8888-888888888888",
        name: "Mật khẩu ví",
        kind: "TEXT",
        sizeBytes: 10,
      },
    ],
  },
];

let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("executor-redesign-fixture");
  window.sessionStorage.clear();
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function render2(element: React.ReactNode, path = "/") {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(
    setCredentials({
      user: {
        id: "11111111-1111-4111-8111-111111111111",
        fullName: "Chú Hải",
        email: "hai@example.test",
        role: "USER",
        status: "ACTIVE",
        createdAt: "2026-10-15T00:00:00Z",
        emailVerified: true,
        hasPassword: true,
      },
    }),
  );
  return render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="*" element={element} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

function row(list: HTMLElement, name: RegExp): HTMLElement {
  return within(list).getByRole("listitem", { name });
}

describe("Bàn giao: bảng người nhận", () => {
  beforeEach(() => {
    vi.spyOn(apiClient, "get").mockResolvedValue(progress);
  });

  it("bốn ô số đúng: đã nhận xong, cần bạn làm, đang chờ người nhận, từ chối nhận", async () => {
    render2(<HandoverProgressPanel caseId={CASE_ID} />);
    await screen.findByRole("list", { name: "Danh sách người nhận" });
    const tile = (label: string) =>
      screen.getByText(label, { selector: "dt" }).closest("div") as HTMLElement;
    expect(tile("Đã nhận xong")).toHaveTextContent("1");
    expect(tile("Đã nhận xong")).toHaveTextContent("trên 6 người nhận");
    expect(tile("Cần bạn làm")).toHaveTextContent("1");
    expect(tile("Đang chờ người nhận")).toHaveTextContent("3");
    expect(tile("Từ chối nhận")).toHaveTextContent("1");
    // Không còn hàng chip cũ, ô thông báo hay hạn tải.
    expect(screen.queryByText(/Chờ phản hồi: /)).not.toBeInTheDocument();
    expect(screen.queryByText("Hạn tải còn")).not.toBeInTheDocument();
  });

  it("xếp dòng: cần bạn làm, đang chờ, đã nhận xong, từ chối", async () => {
    render2(<HandoverProgressPanel caseId={CASE_ID} />);
    const list = await screen.findByRole("list", { name: "Danh sách người nhận" });
    const names = within(list)
      .getAllByRole("listitem", { name: /, gói / })
      .map((item) => item.getAttribute("aria-label"));
    expect(names).toEqual([
      "Phạm Văn Cường, gói Gói 4",
      "Lê Thị Bình, gói Gói 3",
      "Đỗ Thị Dung, gói Gói 5",
      "Vũ Văn Em, gói Gói 6",
      "Nguyễn Văn An, gói Gói 1",
      "Người nhận CCCD ***0002, gói Gói 2",
    ]);
  });

  it("mỗi trạng thái ra đúng bước hiện tại, màu đoạn và chữ", async () => {
    render2(<HandoverProgressPanel caseId={CASE_ID} />);
    const list = await screen.findByRole("list", { name: "Danh sách người nhận" });
    const segmentStates = (item: HTMLElement) =>
      Array.from(item.querySelectorAll("ol[aria-label='Các bước của người nhận'] > li")).map(
        (segment) => segment.getAttribute("data-state"),
      );

    const needKey = row(list, /Phạm Văn Cường/);
    expect(segmentStates(needKey)).toEqual(["done", "done", "done", "current", "pending"]);
    expect(needKey).toHaveTextContent("Chờ nhập mã mở gói");
    expect(needKey).toHaveTextContent("bạn cần đưa mã cho người này");

    const replying = row(list, /Lê Thị Bình/);
    expect(segmentStates(replying)).toEqual(["done", "current", "pending", "pending", "pending"]);
    expect(replying).toHaveTextContent("Chờ người nhận trả lời · đã mời 13:14 23/12");

    const review = row(list, /Đỗ Thị Dung/);
    expect(segmentStates(review)).toEqual(["done", "done", "current", "pending", "pending"]);
    expect(review).toHaveTextContent("Chờ Người xét duyệt duyệt biên bản");

    const unsent = row(list, /Vũ Văn Em/);
    expect(segmentStates(unsent)).toEqual(["current", "pending", "pending", "pending", "pending"]);
    expect(unsent).toHaveTextContent("Chưa gửi lời mời");

    const finished = row(list, /Nguyễn Văn An/);
    expect(segmentStates(finished)).toEqual(["done", "done", "done", "done", "done"]);
    expect(finished).toHaveTextContent("Đã nhận xong · tải 3/3 tài sản 16:52 23/12");

    const declined = row(list, /CCCD \*\*\*0002/);
    expect(segmentStates(declined)).toEqual(["done", "stopped", "pending", "pending", "pending"]);
    expect(declined).toHaveTextContent("Đã từ chối nhận");
  });

  it("chỉ dòng cần bạn làm được tô nổi", async () => {
    render2(<HandoverProgressPanel caseId={CASE_ID} />);
    const list = await screen.findByRole("list", { name: "Danh sách người nhận" });
    const highlighted = list.querySelectorAll("[data-needs-action='true']");
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0]).toHaveAttribute("aria-label", "Phạm Văn Cường, gói Gói 4");
    expect(highlighted[0]).toHaveClass("border-l-[#C9A55C]");
  });

  it("Chi tiết mở hàng 5 cột có giờ và ba ô; Thu gọn đóng lại", async () => {
    render2(<HandoverProgressPanel caseId={CASE_ID} />);
    const list = await screen.findByRole("list", { name: "Danh sách người nhận" });
    const finished = row(list, /Nguyễn Văn An/);
    fireEvent.click(within(finished).getByRole("button", { name: "Chi tiết" }));

    const times = within(finished).getByRole("list", { name: "Giờ từng bước" });
    const columns = within(times).getAllByRole("listitem");
    expect(columns.map((column) => column.textContent)).toEqual([
      "Đã mời13:14 23/12",
      "Đồng ý nhận14:00 23/12",
      "Người xét duyệt duyệt15:00 23/12",
      "Nhập mã mở gói16:00 23/12",
      "Tải xong16:52 23/12",
    ]);
    expect(within(finished).getByRole("region", { name: "Thông tin liên hệ" })).toHaveTextContent(
      "0901234567",
    );
    expect(within(finished).getByRole("region", { name: "Thông tin liên hệ" })).toHaveTextContent(
      "an@example.test",
    );
    expect(within(finished).getByRole("region", { name: "Tài sản" })).toHaveTextContent(
      "3/3 đã tải",
    );
    expect(
      within(finished).getByRole("button", { name: "Xem biên bản đồng ý" }),
    ).toBeInTheDocument();

    fireEvent.click(within(finished).getByRole("button", { name: "Thu gọn" }));
    expect(within(finished).queryByRole("list", { name: "Giờ từng bước" })).not.toBeInTheDocument();
  });

  it("đang chờ: giờ bước chờ là 'đang chờ', bước chưa tới là gạch ngang, biên bản là 'Chưa có'", async () => {
    render2(<HandoverProgressPanel caseId={CASE_ID} />);
    const list = await screen.findByRole("list", { name: "Danh sách người nhận" });
    const replying = row(list, /Lê Thị Bình/);
    fireEvent.click(within(replying).getByRole("button", { name: "Chi tiết" }));
    const columns = within(
      within(replying).getByRole("list", { name: "Giờ từng bước" }),
    ).getAllByRole("listitem");
    expect(columns.map((column) => column.textContent)).toEqual([
      "Đã mời13:14 23/12",
      "Đồng ý nhậnđang chờ",
      "Người xét duyệt duyệt—",
      "Nhập mã mở gói—",
      "Tải xong—",
    ]);
    expect(within(replying).getByRole("region", { name: "Biên bản" })).toHaveTextContent("Chưa có");
  });

  it("người từ chối: chi tiết chỉ 2 cột, tài sản 'Không bàn giao', có nút xem văn bản từ chối", async () => {
    render2(<HandoverProgressPanel caseId={CASE_ID} />);
    const list = await screen.findByRole("list", { name: "Danh sách người nhận" });
    const declined = row(list, /CCCD \*\*\*0002/);
    fireEvent.click(within(declined).getByRole("button", { name: "Chi tiết" }));
    const columns = within(
      within(declined).getByRole("list", { name: "Giờ từng bước" }),
    ).getAllByRole("listitem");
    expect(columns.map((column) => column.querySelector("p")?.textContent)).toEqual([
      "Đã mời",
      "Từ chối nhận",
    ]);
    expect(within(declined).getByRole("region", { name: "Tài sản" })).toHaveTextContent(
      "Không bàn giao",
    );
    expect(
      within(declined).getByRole("button", { name: "Xem văn bản từ chối" }),
    ).toBeInTheDocument();
  });

  it("có chú thích cuối bảng và không còn chữ eKYC hay hạn chót", async () => {
    render2(<HandoverProgressPanel caseId={CASE_ID} />);
    const list = await screen.findByRole("list", { name: "Danh sách người nhận" });
    for (const button of within(list).getAllByRole("button", { name: "Chi tiết" })) {
      fireEvent.click(button);
    }
    expect(
      screen.getByText(
        /Thanh bước: Mời → Đồng ý \/ từ chối → Người xét duyệt duyệt biên bản → Nhập mã mở gói → Tải xong\./,
      ),
    ).toBeInTheDocument();
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/eKYC/i);
    expect(text).not.toMatch(/Còn \d+ ngày|còn \d+ ngày|Hạn tải|Quá hạn|quá hạn|đếm ngược/);
  });
});

describe("Tổng quan, Tài sản và hướng dẫn", () => {
  function mockApi() {
    vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
      if (url === "/executor/vaults") return [vault()];
      if (url === `/executor/death-cases/${CASE_ID}`) return deathCase;
      if (url === `/executor/death-cases/${CASE_ID}/handover-progress`) return progress;
      if (url === `/executor/vaults/${VAULT_ID}/assets`) return packages;
      return [];
    });
  }

  it("Tổng quan đang bàn giao: việc đưa mã, chỉ 3 bước kho và hai thẻ gọn", async () => {
    mockApi();
    render2(<ExecutorOverviewPage />, "/executor");
    expect(
      await screen.findByRole("heading", { name: "Đưa mã mở gói cho 1 người nhận đã đồng ý" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Việc của bạn bây giờ")).toBeInTheDocument();
    expect(await screen.findByText("1/6 người đã nhận xong")).toBeInTheDocument();
    const journey = screen.getByRole("heading", { name: "Kho đang ở đâu" }).closest("section");
    expect(within(journey as HTMLElement).getAllByRole("listitem")).toHaveLength(3);
    expect(
      await screen.findByText(/để lại hướng dẫn bàn giao và giao bạn 2 tài sản trong 1 gói/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Bạn làm được / không làm được" }),
    ).toBeInTheDocument();
  });

  it("Tài sản và hướng dẫn: hiện hướng dẫn, gom theo gói, chip và tìm kiếm", async () => {
    mockApi();
    render2(<ExecutorAssetsPage />, "/executor/assets");
    expect(await screen.findByText("Hướng dẫn bàn giao từ Chủ kho")).toBeInTheDocument();
    const note = screen.getByText(/Gọi cô Lan trước\./);
    expect(note).toHaveClass("whitespace-pre-line");
    expect(screen.getByText("Cập nhật 05/11/2025".replace("2025", "2026"))).toBeInTheDocument();
    expect(await screen.findByText("2 tài sản trong 1 gói")).toBeInTheDocument();
    expect(screen.getByText("Người nhận: Nguyễn Văn An")).toBeInTheDocument();
    expect(await screen.findByText("Đã nhận xong")).toBeInTheDocument();
    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByText("TXT")).toBeInTheDocument();
    // Sổ tiết kiệm đã tải; Mật khẩu ví chưa có dòng tải nên "Chưa tải".
    expect(screen.getByText("Đã tải")).toBeInTheDocument();
    expect(screen.getByText("Chưa tải")).toBeInTheDocument();
    expect(
      screen.getByText(/Nội dung chỉ người nhận mở được sau khi nhập mã mở gói/),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Tìm tên tài sản hoặc người nhận"), {
      target: { value: "ví" },
    });
    expect(screen.getByText("1 tài sản trong 1 gói")).toBeInTheDocument();
    expect(screen.queryByText("Sổ tiết kiệm.pdf")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Tìm tên tài sản hoặc người nhận"), {
      target: { value: "zzz" },
    });
    expect(screen.getByText(/Không có tài sản hoặc người nhận nào khớp/)).toBeInTheDocument();
  });
});

describe("Lời mời và các kho bạn đang làm việc", () => {
  const invitation = {
    id: "99999999-9999-4999-8999-999999999999",
    ownerName: "Cô Lan",
    inviteeEmail: "hai@example.test",
    status: "INVITED",
    invitedAt: "2026-11-01T03:00:00Z",
    expiresAt: "2026-11-20T03:00:00Z",
    endedAt: null,
  };
  const ended = {
    ...invitation,
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    status: "DECLINED",
    endedAt: "2026-11-02T03:00:00Z",
  };

  function mockApi(held: unknown[]) {
    vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
      if (url === "/executor/vaults") return held;
      if (url.includes("executor-invitations")) {
        return { scopeVersion: "v1", scopeText: "x", pending: [invitation], ended: [ended] };
      }
      return [];
    });
  }

  it("thẻ lời mời: chip chờ trả lời, quyền hạn ngắn, Chấp nhận khóa tới khi tick", async () => {
    mockApi([]);
    render2(<ExecutorInvitationsPage />, "/executor/invitations");
    const card = await screen.findByRole("article", { name: "Lời mời của Cô Lan" });
    expect(card).toHaveTextContent("Cô Lan mời bạn làm Người thực thi");
    expect(card).toHaveTextContent("Mời ngày 01/11/2026");
    expect(within(card).getByText("Chờ bạn trả lời")).toBeInTheDocument();
    expect(card).toHaveTextContent("Không đọc được nội dung kho");
    expect(card).toHaveTextContent(
      "Email và số điện thoại của bạn được gửi cho người nhận khi kế hoạch được kích hoạt",
    );
    // Không hiện hạn của lời mời.
    expect(card).not.toHaveTextContent(/Còn \d|hết hạn|hạn chót/i);
    const accept = within(card).getByRole("button", { name: "Chấp nhận" });
    expect(accept).toBeDisabled();
    fireEvent.click(within(card).getByLabelText("Tôi đã đọc và đồng ý nhận vai này"));
    expect(accept).toBeEnabled();
  });

  it("chấp nhận xong gọi Backend và tải lại danh sách kho; kho mới hiện ở Kho bạn đang giữ", async () => {
    let held: unknown[] = [];
    vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
      if (url === "/executor/vaults") return held;
      if (url.includes("executor-invitations")) {
        return { scopeVersion: "v1", scopeText: "x", pending: [invitation], ended: [] };
      }
      return [];
    });
    const post = vi.spyOn(apiClient, "post").mockImplementation(async () => {
      held = [vault({ ownerFullName: "Cô Lan", planStatus: "ACTIVE", openDeathCaseId: null })];
      return {
        id: invitation.id,
        status: "ACCEPTED",
        inviteeEmail: invitation.inviteeEmail,
        isBeneficiary: false,
        expiresAt: invitation.expiresAt,
        acceptedAt: "2026-11-10T03:00:00Z",
        invitationSentAt: invitation.invitedAt,
        acceptedScopeVersion: "v1",
        etag: "e1",
      };
    });
    render2(<ExecutorInvitationsPage />, "/executor/invitations");
    const card = await screen.findByRole("article", { name: "Lời mời của Cô Lan" });
    fireEvent.click(within(card).getByLabelText("Tôi đã đọc và đồng ý nhận vai này"));
    fireEvent.click(within(card).getByRole("button", { name: "Chấp nhận" }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Kho của Cô Lan", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("Bạn nhận vai ngày 01/10/2026")).toBeInTheDocument();
    // Chip trạng thái ở dòng kho và ở menu trái.
    expect(screen.getAllByText("Kế hoạch đang chạy").length).toBeGreaterThan(0);
  });

  it("kho đang mở hiện chip Đang mở thay cho nút; kho khác có Mở kho, bấm thì chọn kho (chỗ duy nhất đổi kho)", async () => {
    const other = vault({
      vaultId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      ownerFullName: "Bà Hạnh",
      planStatus: "ACTIVE",
      openDeathCaseId: null,
    });
    mockApi([vault(), other]);
    render2(<ExecutorInvitationsPage />, "/executor/invitations");
    expect(await screen.findByText("Kho của Anh Nam", { selector: "p" })).toBeInTheDocument();
    expect(screen.getAllByText("Bạn nhận vai ngày 01/10/2026", { selector: "p" })).toHaveLength(2);
    expect(screen.getAllByText("Đang bàn giao").length).toBeGreaterThan(0);
    // Kho đầu tiên được tự chọn: chip "Đang mở", không có nút Mở kho cho kho này.
    expect(screen.getByText("Đang mở")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mở kho của Anh Nam" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mở kho của Bà Hạnh" }));
    expect(window.sessionStorage.getItem("lv-executor-vault")).toBe(
      "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    );
  });

  it("dòng phụ của trang và thứ tự: lời mời đang chờ ở trên cùng, rồi Kho bạn đang giữ", async () => {
    mockApi([vault()]);
    render2(<ExecutorInvitationsPage />, "/executor/invitations");
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Lời mời và các kho bạn đang làm việc",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Chọn kho để làm việc. Lời mời mới nằm ở trên cùng."),
    ).toBeInTheDocument();
    const label = await screen.findByRole("heading", { name: "Lời mời đang chờ" });
    const held = screen.getByRole("heading", { name: "Kho bạn đang giữ" });
    expect(label.compareDocumentPosition(held) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("không có lời mời đang chờ: không hiện nhãn LỜI MỜI ĐANG CHỜ cũng không có câu trống", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
      if (url === "/executor/vaults") return [vault()];
      if (url.includes("executor-invitations")) {
        return { scopeVersion: "v1", scopeText: "x", pending: [], ended: [] };
      }
      return [];
    });
    render2(<ExecutorInvitationsPage />, "/executor/invitations");
    expect(await screen.findByRole("heading", { name: "Kho bạn đang giữ" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Lời mời đang chờ" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Không có lời mời nào đang chờ/)).not.toBeInTheDocument();
  });

  it("lời mời đã kết thúc gom thành một dòng nhỏ có nút Xem", async () => {
    mockApi([]);
    render2(<ExecutorInvitationsPage />, "/executor/invitations");
    expect(await screen.findByText("Lời mời đã từ chối hoặc hết hạn: 1")).toBeInTheDocument();
    expect(screen.getByText("· Xem")).toBeInTheDocument();
  });

  it("trang Cài đặt không còn phần lời mời", async () => {
    mockApi([vault()]);
    render2(<ExecutorSettingsPage />, "/executor/settings");
    expect(await screen.findByRole("heading", { level: 1, name: "Cài đặt" })).toBeInTheDocument();
    expect(screen.getByText("Quyền hạn")).toBeInTheDocument();
    expect(screen.queryByText("Lời mời đang chờ")).not.toBeInTheDocument();
    expect(screen.queryByText("Đang chờ bạn trả lời")).not.toBeInTheDocument();
    expect(screen.queryByRole("article", { name: /Lời mời của/ })).not.toBeInTheDocument();
  });
});
