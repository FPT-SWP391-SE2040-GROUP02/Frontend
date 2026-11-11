import { describe, expect, it } from "vitest";
import { getVaultLockReason } from "../vaultLock";

describe("getVaultLockReason", () => {
  it("không khóa khi kho chưa tải", () => {
    expect(getVaultLockReason(undefined)).toBeNull();
    expect(getVaultLockReason(null)).toBeNull();
  });

  it.each(["DRAFT", "ACTIVE", "CHECKIN_OVERDUE", "AWAITING_CHECK"])(
    "không khóa khi kế hoạch %s",
    (planStatus) => {
      expect(getVaultLockReason({ status: "OPEN", planStatus })).toBeNull();
    },
  );

  it.each(["DEATH_CASE_OPEN", "HANDOVER_IN_PROGRESS", "BLOCKED", "CLOSED"])(
    "khóa khi kế hoạch %s và có lý do để hiện",
    (planStatus) => {
      const reason = getVaultLockReason({ status: "OPEN", planStatus });
      expect(reason).not.toBeNull();
      expect(reason).not.toBe("");
    },
  );

  it("khóa khi kho đã đóng dù kế hoạch còn hoạt động", () => {
    expect(getVaultLockReason({ status: "CLOSED", planStatus: "ACTIVE" })).toContain("Kho đã đóng");
  });

  it("trạng thái kế hoạch lạ không bị coi là khóa", () => {
    expect(getVaultLockReason({ status: "OPEN", planStatus: "NEW_STATUS" })).toBeNull();
  });
});
