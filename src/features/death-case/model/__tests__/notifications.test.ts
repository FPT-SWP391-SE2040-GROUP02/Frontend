import { describe, expect, it } from "vitest";
import type { DeathCase, ExecutorVault } from "../deathCase.schema";
import { deriveNotifications } from "../notifications";

const baseVault: ExecutorVault = {
  vaultId: "11111111-1111-4111-8111-111111111111",
  ownerFullName: "Anh Nam",
  planStatus: "ACTIVE",
  openDeathCaseId: null,
};

function record(extra: Partial<DeathCase>): DeathCase {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    status: "UNDER_REVIEW",
    currentVersion: { versionNo: 1, submittedAt: "2026-11-01T09:00:00Z" },
    supplementRequest: null,
    createdAt: "2026-10-31T09:00:00Z",
    updatedAt: null,
    ...extra,
  } as DeathCase;
}

describe("deriveNotifications", () => {
  it("kho an toàn, không có hồ sơ thì không có thông báo", () => {
    expect(deriveNotifications(baseVault, null)).toEqual([]);
  });

  it("sự kiện của hồ sơ xếp mới nhất trước và lấy đúng lý do bổ sung", () => {
    const items = deriveNotifications(
      { ...baseVault, planStatus: "DEATH_CASE_OPEN", openDeathCaseId: "x" },
      record({
        status: "SUPPLEMENT_REQUIRED",
        supplementRequest: {
          versionNo: 1,
          reason: "Ảnh trang 2 bị mờ",
          requestedParts: [],
          requestedAt: "2026-11-02T09:00:00Z",
        },
      }),
    );
    expect(items.map((item) => item.text)).toEqual([
      "Người xét duyệt yêu cầu bổ sung: Ảnh trang 2 bị mờ",
      "Bạn đã gửi hồ sơ (bản 1).",
      "Bạn mở hồ sơ báo tin.",
    ]);
  });

  it("id đổi theo sự kiện để thông báo mới hiện lại là chưa đọc", () => {
    const first = deriveNotifications(baseVault, record({}));
    const second = deriveNotifications(
      baseVault,
      record({
        currentVersion: { versionNo: 2, submittedAt: "2026-11-03T09:00:00Z" } as never,
      }),
    );
    const firstIds = new Set(first.map((item) => item.id));
    expect(second.some((item) => !firstIds.has(item.id))).toBe(true);
  });
});
