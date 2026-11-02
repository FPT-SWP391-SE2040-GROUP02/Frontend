import { describe, expect, it } from "vitest";
import { resolveExecutorSteps } from "../resolveExecutorSteps";

function stateOf(result: ReturnType<typeof resolveExecutorSteps>, id: string) {
  return result.steps.find((step) => step.id === id)?.state;
}

describe("resolveExecutorSteps", () => {
  it("chưa có kho nào: bước đầu là việc cần làm", () => {
    const result = resolveExecutorSteps({
      vaultsCount: 0,
      vault: null,
      caseStatus: null,
      progressIndex: null,
    });
    expect(result.currentId).toBe("accepted");
    expect(stateOf(result, "report")).toBe("blocked");
  });

  it("đã nhận nhiệm vụ, chưa quá hạn: đang ở bước chờ", () => {
    const result = resolveExecutorSteps({
      vaultsCount: 1,
      vault: { checkInOverdue: false, openDeathCaseId: null },
      caseStatus: null,
      progressIndex: null,
    });
    expect(stateOf(result, "accepted")).toBe("done");
    expect(result.currentId).toBe("waiting");
    expect(stateOf(result, "report")).toBe("blocked");
  });

  it("Chủ kho quá hạn: đến lượt báo tin", () => {
    const result = resolveExecutorSteps({
      vaultsCount: 1,
      vault: { checkInOverdue: true, openDeathCaseId: null },
      caseStatus: null,
      progressIndex: -1,
    });
    expect(result.currentId).toBe("report");
  });

  it("đã nộp hồ sơ: theo dõi tiến trình; xong hết khi bàn giao hoàn tất", () => {
    const base = {
      vaultsCount: 1,
      vault: { checkInOverdue: true, openDeathCaseId: "case" },
      caseStatus: "UNDER_REVIEW",
    };
    expect(resolveExecutorSteps({ ...base, progressIndex: 2 }).currentId).toBe("progress");
    expect(resolveExecutorSteps({ ...base, progressIndex: 6 }).currentId).toBeNull();
  });

  it("query lỗi: không bước nào hiện là xong", () => {
    const result = resolveExecutorSteps({
      vaultsCount: null,
      vault: null,
      caseStatus: null,
      progressIndex: null,
    });
    for (const step of result.steps) {
      expect(step.state).toBe("unknown");
    }
  });
});
