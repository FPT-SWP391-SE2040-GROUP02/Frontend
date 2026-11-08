import { describe, expect, it } from "vitest";
import type { DeathCase, ExecutorVault } from "../deathCase.schema";
import { deriveProcessStep } from "../processStep";

function vault(planStatus: string): ExecutorVault {
  return {
    vaultId: "11111111-1111-4111-8111-111111111111",
    ownerFullName: "Anh Nam",
    planStatus,
    checkInOverdue: false,
    openDeathCaseId: null,
  };
}

function record(status: DeathCase["status"]): DeathCase {
  return { status } as DeathCase;
}

describe("deriveProcessStep", () => {
  it("ánh xạ trạng thái kế hoạch sang bước 1–8", () => {
    const expected: Array<[string, number]> = [
      ["DRAFT", 1],
      ["ACTIVE", 2],
      ["CHECKIN_OVERDUE", 3],
      ["AWAITING_CHECK", 4],
      ["HANDOVER_IN_PROGRESS", 7],
      ["CLOSED", 8],
    ];
    for (const [planStatus, step] of expected) {
      expect(deriveProcessStep(vault(planStatus), null)).toBe(step);
    }
  });

  it("có hồ sơ chứng tử: còn nháp là bước 5, đã gửi là bước 6", () => {
    expect(deriveProcessStep(vault("DEATH_CASE_OPEN"), record("DRAFT"))).toBe(5);
    expect(deriveProcessStep(vault("DEATH_CASE_OPEN"), record("UNDER_REVIEW"))).toBe(6);
    expect(deriveProcessStep(vault("DEATH_CASE_OPEN"), record("SUPPLEMENT_REQUIRED"))).toBe(6);
  });

  it("chưa tải được hồ sơ thì coi như đã gửi", () => {
    expect(deriveProcessStep(vault("DEATH_CASE_OPEN"), undefined)).toBe(6);
  });

  it("kho đóng băng hoặc trạng thái lạ không tô bước nào", () => {
    expect(deriveProcessStep(vault("BLOCKED"), null)).toBeNull();
    expect(deriveProcessStep(vault("KHONG_BIET"), null)).toBeNull();
  });
});
