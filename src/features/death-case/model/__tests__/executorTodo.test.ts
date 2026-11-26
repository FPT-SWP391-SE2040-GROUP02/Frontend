import { describe, expect, it } from "vitest";
import type { ExecutorVault } from "../deathCase.schema";
import { executorTodo, vaultJourney, vaultStage } from "../executorTodo";
import { handoverProgressSchema, type HandoverProgress } from "../handoverProgress.schema";

function vault(overrides: Partial<ExecutorVault> = {}): ExecutorVault {
  return {
    vaultId: "11111111-1111-4111-8111-111111111111",
    ownerFullName: "Anh Nam",
    planStatus: "ACTIVE",
    handoverRecordStatus: "",
    ...overrides,
  };
}

const SENT = "2026-12-23T06:14:00+00:00";

function turnJson(index: number, overrides: Record<string, unknown>) {
  return {
    turnId: `5555555${index}-5555-4555-8555-555555555555`,
    containerName: `Gói ${index}`,
    beneficiaryCitizenId: "1234",
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
  receiptExecutorSignedAt: SENT,
};
const needsKey = { status: "HANDOVER_COMMITTED", invitationSentAt: SENT, decidedAt: SENT };
const waitingTurn = { status: "INVITED", invitationSentAt: SENT };
const unsentTurn = { status: "INVITED", invitationSentAt: null };

const input = (overrides: Partial<Parameters<typeof executorTodo>[0]> = {}) => ({
  vault: vault(),
  recordStatus: "",
  canSign: false,
  progress: null,
  ...overrides,
});

describe("vaultStage", () => {
  it("theo bước của biên bản bàn giao", () => {
    expect(vaultStage(vault()).label).toBe("Chưa có yêu cầu nhận");
    expect(vaultStage(vault({ handoverRecordStatus: "DRAFTING" })).label).toBe(
      "Luật sư đang lập phương án chia",
    );
    expect(vaultStage(vault({ handoverRecordStatus: "SIGNING" })).label).toBe("Đang ký biên bản");
    expect(
      vaultStage(vault({ planStatus: "CLOSED", handoverRecordStatus: "COMPLETED" })).label,
    ).toBe("Đã hoàn tất");
    expect(vaultStage(vault({ planStatus: "DRAFT" })).label).toBe("Kế hoạch chưa kích hoạt");
  });
});

describe("executorTodo", () => {
  it("chưa có yêu cầu nhận: dẫn tới mục Biên bản bàn giao", () => {
    const todo = executorTodo(input());
    expect(todo.title).toBe("Chưa có yêu cầu nhận tài sản");
    expect(todo.to).toBe("/executor/report");
  });

  it("luật sư đang lập biên bản: chưa cần làm gì", () => {
    expect(executorTodo(input({ recordStatus: "DRAFTING" })).title).toBe(
      "Luật sư đang lập phương án chia",
    );
  });

  it("biên bản cũ còn ở IDENTITY_CHECK xử lý như đang ký: Người thực thi ký ngay được", () => {
    const todo = executorTodo(input({ recordStatus: "IDENTITY_CHECK", canSign: true }));
    expect(todo.title).toBe("Ký biên bản bàn giao");
    expect(todo.to).toBe("/executor/report");
  });

  it("vừa chốt: việc là ký ngay; đã ký mà chưa ai được mở thì chờ người nhận hoàn tất phần của mình", () => {
    expect(executorTodo(input({ recordStatus: "SIGNING", canSign: true })).title).toBe(
      "Ký biên bản bàn giao",
    );
    const waiting = executorTodo(input({ recordStatus: "SIGNING" }));
    expect(waiting.title).toBe("Chờ người nhận hoàn tất phần của mình");
    expect(waiting.to).toBe("/executor/progress");
  });

  it("đang ký mà người A đã được mở, người B chưa ký: vẫn gửi mã cho A", () => {
    const todo = executorTodo(
      input({ recordStatus: "SIGNING", progress: progress([needsKey, waitingTurn]) }),
    );
    expect(todo.title).toBe("Gửi mã nhận cho 1 người nhận");
    expect(todo.to).toBe("/executor/progress");
  });

  it("đủ chữ ký: gửi mã nhận cho người cần mã, xong hết thì hoàn tất", () => {
    const withKey = executorTodo(
      input({ recordStatus: "COMPLETED", progress: progress([needsKey, doneTurn]) }),
    );
    expect(withKey.title).toBe("Gửi mã nhận cho 1 người nhận");
    const done = executorTodo(input({ recordStatus: "COMPLETED", progress: progress([doneTurn]) }));
    expect(done.title).toBe("Bàn giao đã hoàn tất");
    const waiting = executorTodo(
      input({ recordStatus: "COMPLETED", progress: progress([waitingTurn, unsentTurn]) }),
    );
    expect(waiting.title).toBe("Chưa có việc cần bạn làm");
  });

  it("người nhận đã ký phiếu: việc là ký phiếu giao nhận", () => {
    const waitingReceipt = { ...doneTurn, receiptExecutorSignedAt: null };
    const todo = executorTodo(
      input({ recordStatus: "COMPLETED", progress: progress([waitingReceipt, needsKey]) }),
    );
    expect(todo.title).toBe("Ký phiếu giao nhận với 1 người nhận");
  });

  it("tài sản đã đóng thì không còn việc", () => {
    expect(executorTodo(input({ vault: vault({ planStatus: "CLOSED" }) })).title).toBe(
      "Bàn giao đã hoàn tất",
    );
  });
});

describe("vaultJourney", () => {
  it("ba bước: yêu cầu nhận, biên bản, bàn giao cho người nhận", () => {
    const steps = vaultJourney(vault(), "", null);
    expect(steps.map((step) => step.label)).toEqual([
      "Yêu cầu nhận",
      "Biên bản bàn giao",
      "Bàn giao cho người nhận",
    ]);
    expect(steps.map((step) => step.state)).toEqual(["current", "pending", "pending"]);
  });

  it("biên bản đang ký: bước 2 đang ở đây", () => {
    const steps = vaultJourney(vault(), "SIGNING", null);
    expect(steps[1]).toEqual({
      label: "Biên bản bàn giao",
      state: "current",
      caption: "Đang ký, giao từng người",
    });
  });

  it("biên bản còn đang ký nhưng đã có người được mở: bước 3 bắt đầu theo từng người", () => {
    const steps = vaultJourney(vault(), "SIGNING", progress([needsKey, waitingTurn]));
    expect(steps[1].state).toBe("current");
    expect(steps[2]).toEqual({
      label: "Bàn giao cho người nhận",
      state: "current",
      caption: "0/2 người đã nhận xong",
    });
    const none = vaultJourney(vault(), "SIGNING", progress([waitingTurn]));
    expect(none[2].state).toBe("pending");
  });

  it("đủ chữ ký: bước 3 đang ở đây với x/y người đã nhận xong", () => {
    const steps = vaultJourney(vault(), "COMPLETED", progress([doneTurn, waitingTurn]));
    expect(steps[1].state).toBe("done");
    expect(steps[2]).toEqual({
      label: "Bàn giao cho người nhận",
      state: "current",
      caption: "1/2 người đã nhận xong",
    });
  });
});
