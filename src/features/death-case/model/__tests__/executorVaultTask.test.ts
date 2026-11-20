import { describe, expect, it } from "vitest";
import type { ExecutorVault } from "../deathCase.schema";
import { sortVaultsByUrgency, vaultTask } from "../executorVaultTask";

function vault(
  id: string,
  planStatus: string,
  openDeathCaseId: string | null = null,
): ExecutorVault {
  return {
    vaultId: id,
    ownerFullName: `Chủ kho ${id}`,
    planStatus,
    openDeathCaseId,
  };
}

describe("vaultTask", () => {
  it("kế hoạch đang chạy, chưa có hồ sơ: kho an toàn", () => {
    const task = vaultTask(vault("a", "ACTIVE"));
    expect(task.urgency).toBe("safe");
    expect(task.tone).toBe("success");
  });

  it("kho có hồ sơ đang mở đứng trước kho an toàn", () => {
    const sorted = sortVaultsByUrgency([
      vault("safe", "ACTIVE"),
      vault("case", "DEATH_CASE_OPEN", "11111111-1111-4111-8111-111111111111"),
    ]);
    expect(sorted.map((item) => item.vaultId)).toEqual(["case", "safe"]);
  });
});
