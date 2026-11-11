import { describe, expect, it } from "vitest";
import type { ExecutorVault } from "../deathCase.schema";
import { executorTodo, vaultJourney, vaultStage } from "../executorTodo";
import { handoverProgressSchema, type HandoverProgress } from "../handoverProgress.schema";

function vault(overrides: Partial<ExecutorVault> = {}): ExecutorVault {
  return {
    vaultId: "11111111-1111-4111-8111-111111111111",
    ownerFullName: "Anh Nam",
    planStatus: "ACTIVE",
    checkInOverdue: false,
    openDeathCaseId: null,
    ...overrides,
  };
}

const SENT = "2026-12-23T06:14:00+00:00";

function turnJson(index: number, overrides: Record<string, unknown>) {
  return {
    turnId: `5555555${index}-5555-4555-8555-555555555555`,
    containerName: `Gói ${index}`,
    beneficiaryCitizenIdLast4: "1234",
    status: "INVITED",
    claimedByYou: false,
    identityConfirmedByExecutor: false,
    invitedAt: "2026-12-23T06:00:00+00:00",
    responseDeadline: "2026-12-28T06:00:00+00:00",
    claimedAt: null,
    decisionDeadline: null,
    decidedAt: null,
    grantStatus: null,
    grantExpiresAt: null,
    totalItems: 2,
    downloadedItems: 0,
    items: [],
    ...overrides,
  };
}

function progress(turns: Record<string, unknown>[], started = true): HandoverProgress {
  return handoverProgressSchema.parse({
    caseId: "33333333-3333-4333-8333-333333333333",
    handoverStarted: started,
    serverTime: SENT,
    summary: {
      totalTurns: turns.length,
      waitingResponse: 0,
      inVerification: 0,
      accepted: 0,
      declined: 0,
      ended: 0,
    },
    turns: turns.map((turn, index) => turnJson(index + 1, turn)),
  });
}

const doneTurn = {
  status: "HANDOVER_COMMITTED",
  invitationSentAt: SENT,
  keyVerifiedAt: SENT,
  downloadedItems: 2,
  receivedAllAt: SENT,
};
const needsKey = { status: "HANDOVER_COMMITTED", invitationSentAt: SENT, decidedAt: SENT };
const waitingTurn = { status: "INVITED", invitationSentAt: SENT };
const unsentTurn = { status: "INVITED", invitationSentAt: null };

const input = (overrides: Partial<Parameters<typeof executorTodo>[0]> = {}) => ({
  vault: vault(),
  caseStatus: null,
  progress: null,
  rejectedPending: false,
  ...overrides,
});

describe("vaultStage", () => {
  it("bốn trạng thái gọn dưới tên Chủ kho", () => {
    expect(vaultStage(vault()).label).toBe("Kế hoạch đang chạy");
    expect(
      vaultStage(vault({ openDeathCaseId: "22222222-2222-4222-8222-222222222222" })).label,
    ).toBe("Đang báo tin");
    expect(vaultStage(vault({ planStatus: "HANDOVER_IN_PROGRESS" })).label).toBe("Đang bàn giao");
    expect(vaultStage(vault({ planStatus: "CLOSED" })).label).toBe("Đã hoàn tất");
  });

  it("Chủ kho trễ điểm danh không bị gọi là kế hoạch đang chạy", () => {
    expect(vaultStage(vault({ planStatus: "AWAITING_CHECK", checkInOverdue: true })).label).toBe(
      "Cần bạn kiểm tra",
    );
    expect(vaultStage(vault({ planStatus: "CHECKIN_OVERDUE", checkInOverdue: true })).label).toBe(
      "Chủ kho trễ điểm danh",
    );
  });
});

describe("executorTodo: Việc của bạn bây giờ", () => {
  it("chưa báo tin: báo tin khi Chủ kho qua đời", () => {
    const todo = executorTodo(input());
    expect(todo.title).toBe("Báo tin khi Chủ kho qua đời");
    expect(todo.to).toBe("/executor/report");
  });

  it("hết thời gian chờ điểm danh: kiểm tra Chủ kho", () => {
    const todo = executorTodo(
      input({ vault: vault({ planStatus: "AWAITING_CHECK", checkInOverdue: true }) }),
    );
    expect(todo.title).toBe("Kiểm tra xem Chủ kho còn ổn không");
  });

  it("trễ điểm danh nhưng còn thời gian chờ: chỉ để ý, không có nút", () => {
    const todo = executorTodo(
      input({ vault: vault({ planStatus: "CHECKIN_OVERDUE", checkInOverdue: true }) }),
    );
    expect(todo.buttonLabel).toBeNull();
    expect(todo.to).toBeNull();
  });

  it("hồ sơ bị từ chối chưa xem: ưu tiên xem lý do", () => {
    expect(executorTodo(input({ rejectedPending: true })).title).toBe(
      "Xem lý do hồ sơ báo tin bị từ chối",
    );
  });

  it("hồ sơ nháp và hồ sơ cần bổ sung", () => {
    expect(executorTodo(input({ caseStatus: "DRAFT" })).title).toBe("Hoàn tất hồ sơ báo tin");
    expect(executorTodo(input({ caseStatus: "SUPPLEMENT_REQUIRED" })).title).toBe(
      "Bổ sung hồ sơ báo tin",
    );
  });

  it("hồ sơ đang chờ duyệt hoặc tạm dừng: chưa cần làm gì", () => {
    expect(executorTodo(input({ caseStatus: "UNDER_REVIEW" })).title).toBe(
      "Chờ Người xét duyệt duyệt hồ sơ",
    );
    expect(executorTodo(input({ caseStatus: "SUSPENDED" })).title).toBe(
      "Hồ sơ báo tin đang tạm dừng",
    );
  });

  it("kho có hồ sơ mở nhưng chưa đọc được trạng thái: không nói chưa báo tin", () => {
    const todo = executorTodo(
      input({ vault: vault({ openDeathCaseId: "22222222-2222-4222-8222-222222222222" }) }),
    );
    expect(todo.title).toBe("Hồ sơ báo tin về Anh Nam đang được xử lý");
  });

  it("đã duyệt, người nhận cần mã: đưa mã cho n người", () => {
    const todo = executorTodo(
      input({
        caseStatus: "APPROVED_FOR_HANDOVER",
        progress: progress([needsKey, needsKey, waitingTurn]),
      }),
    );
    expect(todo.title).toBe("Đưa mã mở gói cho 2 người nhận đã đồng ý");
    expect(todo.to).toBe("/executor/progress");
  });

  it("đã duyệt, có lời mời chưa gửi được: báo thông tin, không có nút gửi", () => {
    const todo = executorTodo(
      input({ caseStatus: "APPROVED_FOR_HANDOVER", progress: progress([unsentTurn, waitingTurn]) }),
    );
    expect(todo.title).toBe("Có 1 người nhận chưa nhận được lời mời");
    expect(todo.buttonLabel).toBe("Xem người nhận");
  });

  it("đã duyệt, mọi người đang chờ: chưa có việc", () => {
    const todo = executorTodo(
      input({ caseStatus: "APPROVED_FOR_HANDOVER", progress: progress([waitingTurn]) }),
    );
    expect(todo.title).toBe("Chưa có việc cần bạn làm");
    expect(todo.text).toContain("1 người nhận");
  });

  it("xong hết: bàn giao đã hoàn tất", () => {
    const todo = executorTodo(
      input({
        caseStatus: "APPROVED_FOR_HANDOVER",
        progress: progress([doneTurn, { status: "DECLINED" }]),
      }),
    );
    expect(todo.title).toBe("Bàn giao đã hoàn tất");
  });

  it("đã duyệt nhưng chưa có lượt: bàn giao đang được chuẩn bị", () => {
    const todo = executorTodo(
      input({ caseStatus: "APPROVED_FOR_HANDOVER", progress: progress([], false) }),
    );
    expect(todo.title).toBe("Bàn giao đang được chuẩn bị");
  });
});

describe("vaultJourney: chỉ 3 bước của cả kho", () => {
  it("luôn đúng 3 bước, không có bước eKYC hay từng người nhận", () => {
    const steps = vaultJourney(vault(), null, null);
    expect(steps.map((step) => step.label)).toEqual([
      "Báo tin",
      "Người xét duyệt duyệt",
      "Bàn giao cho người nhận",
    ]);
    expect(steps.map((step) => step.state)).toEqual(["current", "pending", "pending"]);
  });

  it("hồ sơ đang chờ duyệt: bước 2 đang ở đây", () => {
    const steps = vaultJourney(vault(), "UNDER_REVIEW", null);
    expect(steps.map((step) => step.state)).toEqual(["done", "current", "pending"]);
    expect(steps[1].caption).toBe("Đang chờ duyệt");
  });

  it("hồ sơ cần bổ sung hoặc bị từ chối: quay về bước Báo tin", () => {
    expect(vaultJourney(vault(), "SUPPLEMENT_REQUIRED", null)[0].state).toBe("current");
    expect(vaultJourney(vault(), "REJECTED", null)[0].caption).toBe("Hồ sơ bị từ chối");
  });

  it("đang bàn giao: dòng phụ x/y người đã nhận xong", () => {
    const steps = vaultJourney(
      vault(),
      "APPROVED_FOR_HANDOVER",
      progress([doneTurn, waitingTurn, needsKey]),
    );
    expect(steps.map((step) => step.state)).toEqual(["done", "done", "current"]);
    expect(steps[2].caption).toBe("1/3 người đã nhận xong");
  });

  it("mọi người đã xong hoặc từ chối: cả ba bước xanh", () => {
    const steps = vaultJourney(
      vault(),
      "APPROVED_FOR_HANDOVER",
      progress([doneTurn, { status: "DECLINED" }]),
    );
    expect(steps.map((step) => step.state)).toEqual(["done", "done", "done"]);
    expect(steps[2].caption).toBe("1/2 người đã nhận xong");
  });
});
