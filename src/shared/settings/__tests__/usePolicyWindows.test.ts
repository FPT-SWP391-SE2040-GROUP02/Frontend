import { describe, expect, it } from "vitest";
import { DEFAULT_POLICY_WINDOWS, readPolicyWindows } from "../usePolicyWindows";

describe("readPolicyWindows", () => {
  it("lấy số Admin đặt từ tham số công khai", () => {
    const windows = readPolicyWindows({
      "DeathCase.ObjectionHours": 48,
      "Alive.SelfieWindowDays": 10,
      "Plans.Free.QuotaMb": 5,
    });
    expect(windows.objectionHours).toBe(48);
    expect(windows.selfieDays).toBe(10);
    expect(windows.freeQuotaMb).toBe(5);
    expect(windows.executorInviteDays).toBe(DEFAULT_POLICY_WINDOWS.executorInviteDays);
  });

  it("thiếu, sai dạng hoặc không dương thì dùng mức gốc", () => {
    expect(readPolicyWindows(undefined)).toEqual(DEFAULT_POLICY_WINDOWS);
    expect(readPolicyWindows({ "DeathCase.ObjectionHours": "48" })).toEqual(DEFAULT_POLICY_WINDOWS);
    expect(readPolicyWindows({ "DeathCase.ObjectionHours": 0 })).toEqual(DEFAULT_POLICY_WINDOWS);
    expect(readPolicyWindows({ "DeathCase.ObjectionHours": 1.5 })).toEqual(DEFAULT_POLICY_WINDOWS);
  });
});
