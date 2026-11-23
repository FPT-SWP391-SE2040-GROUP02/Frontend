import { describe, expect, it } from "vitest";
import type { ExecutorVault } from "../deathCase.schema";
import { countVaultsNeedingAttention, sortVaultsByUrgency, vaultTask } from "../executorVaultTask";

function vault(overrides: Partial<ExecutorVault> = {}): ExecutorVault {
  return {
    vaultId: "11111111-1111-4111-8111-111111111111",
    ownerFullName: "Anh Nam",
    planStatus: "ACTIVE",
    handoverRecordStatus: "",
    ...overrides,
  };
}

describe("vaultTask", () => {
  it("chưa có yêu cầu nhận: chưa cần làm gì", () => {
    const task = vaultTask(vault());
    expect(task.urgency).toBe("safe");
    expect(task.label).toBe("Chưa có yêu cầu nhận");
    expect(task.task).toBeNull();
  });

  it("luật sư đã ký: cần Người thực thi; chờ luật sư ký thì chưa", () => {
    expect(vaultTask(vault({ handoverRecordStatus: "SIGNING" })).task).toBeNull();
    expect(
      vaultTask(vault({ planStatus: "HANDOVER_IN_PROGRESS", handoverRecordStatus: "COMPLETED" }))
        .label,
    ).toBe("Đang giao tài sản");
  });

  it("kho đang giao đứng trước kho đang lập biên bản, kho chưa có yêu cầu nhận đứng cuối", () => {
    const safe = vault({ vaultId: "a1111111-1111-4111-8111-111111111111" });
    const drafting = vault({
      vaultId: "b1111111-1111-4111-8111-111111111111",
      handoverRecordStatus: "DRAFTING",
    });
    const delivering = vault({
      vaultId: "c1111111-1111-4111-8111-111111111111",
      handoverRecordStatus: "COMPLETED",
    });
    expect(sortVaultsByUrgency([safe, drafting, delivering]).map((item) => item.vaultId)).toEqual([
      delivering.vaultId,
      drafting.vaultId,
      safe.vaultId,
    ]);
    expect(countVaultsNeedingAttention([safe, drafting, delivering])).toBe(2);
  });
});
