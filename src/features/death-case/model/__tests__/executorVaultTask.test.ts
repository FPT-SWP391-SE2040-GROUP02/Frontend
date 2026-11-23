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

  it("đang ký hoặc đã đủ chữ ký: cần Người thực thi", () => {
    expect(vaultTask(vault({ handoverRecordStatus: "SIGNING" })).urgency).toBe("sign");
    // Biên bản cũ còn ở IDENTITY_CHECK cũng là đang ký.
    expect(vaultTask(vault({ handoverRecordStatus: "IDENTITY_CHECK" })).urgency).toBe("sign");
    expect(
      vaultTask(vault({ planStatus: "HANDOVER_IN_PROGRESS", handoverRecordStatus: "COMPLETED" }))
        .label,
    ).toBe("Gửi mã nhận");
  });

  it("kho cần ký đứng trước kho đang lập biên bản, kho chưa có yêu cầu nhận đứng cuối", () => {
    const safe = vault({ vaultId: "a1111111-1111-4111-8111-111111111111" });
    const drafting = vault({
      vaultId: "b1111111-1111-4111-8111-111111111111",
      handoverRecordStatus: "DRAFTING",
    });
    const signing = vault({
      vaultId: "c1111111-1111-4111-8111-111111111111",
      handoverRecordStatus: "SIGNING",
    });
    expect(sortVaultsByUrgency([safe, drafting, signing]).map((item) => item.vaultId)).toEqual([
      signing.vaultId,
      drafting.vaultId,
      safe.vaultId,
    ]);
    expect(countVaultsNeedingAttention([safe, drafting, signing])).toBe(2);
  });
});
