import { describe, expect, it } from "vitest";
import type { ExecutorVault } from "../deathCase.schema";
import { sortVaultsByUrgency, vaultTask } from "../executorVaultTask";

function vault(id: string, planStatus: string, checkInOverdue: boolean): ExecutorVault {
  return {
    vaultId: id,
    ownerFullName: `Chủ kho ${id}`,
    planStatus,
    checkInOverdue,
    openDeathCaseId: null,
  };
}

describe("vaultTask: hai giai đoạn quá hạn điểm danh", () => {
  it("đang trong thời gian chờ: nhãn nhẹ, chỉ cần để ý", () => {
    const task = vaultTask(vault("a", "CHECKIN_OVERDUE", true));
    expect(task.label).toBe("Trễ điểm danh · đang chờ");
    expect(task.tone).toBe("warning");
  });

  it("hết thời gian chờ: cần Người thực hiện kiểm tra", () => {
    const task = vaultTask(vault("b", "AWAITING_CHECK", true));
    expect(task.label).toBe("Cần bạn kiểm tra");
    expect(task.tone).toBe("danger");
  });

  it("kho cần kiểm tra đứng trước kho đang chờ, kho an toàn đứng cuối", () => {
    const sorted = sortVaultsByUrgency([
      vault("safe", "ACTIVE", false),
      vault("late", "CHECKIN_OVERDUE", true),
      vault("check", "AWAITING_CHECK", true),
    ]);
    expect(sorted.map((item) => item.vaultId)).toEqual(["check", "late", "safe"]);
  });
});
