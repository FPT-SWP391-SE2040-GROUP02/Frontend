import { describe, expect, it } from "vitest";
import { DEFAULT_POLICY_WINDOWS, readPolicyWindows } from "../usePolicyWindows";

describe("readPolicyWindows", () => {
  it("lấy số Admin đặt từ tham số công khai", () => {
    const windows = readPolicyWindows({
      "Plans.Free.QuotaMb": 5,
    });
    expect(windows.freeQuotaMb).toBe(5);
    expect(windows.executorInviteDays).toBe(DEFAULT_POLICY_WINDOWS.executorInviteDays);
  });

  it("thiếu, sai dạng hoặc không dương thì dùng mức gốc", () => {
    expect(readPolicyWindows(undefined)).toEqual(DEFAULT_POLICY_WINDOWS);
    expect(readPolicyWindows({ "Handover.GrantWindowDays": "48" })).toEqual(DEFAULT_POLICY_WINDOWS);
    expect(readPolicyWindows({ "Handover.GrantWindowDays": 0 })).toEqual(DEFAULT_POLICY_WINDOWS);
    expect(readPolicyWindows({ "Handover.GrantWindowDays": 1.5 })).toEqual(DEFAULT_POLICY_WINDOWS);
  });
});
