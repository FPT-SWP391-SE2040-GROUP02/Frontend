import { describe, expect, it } from "vitest";
import { DEFAULT_POLICY_WINDOWS, readPolicyWindows } from "../usePolicyWindows";

describe("readPolicyWindows", () => {
  it("lấy số Admin đặt từ tham số công khai", () => {
    const windows = readPolicyWindows({
      "Handover.GrantWindowDays": 10,
      "Plans.Free.QuotaMb": 5,
    });
    expect(windows.grantDays).toBe(10);
    expect(windows.freeQuotaMb).toBe(5);
    expect(windows.executorInviteMinutes).toBe(DEFAULT_POLICY_WINDOWS.executorInviteMinutes);
  });

  it("đọc hạn quyết định của người nhận từ Handover.DecisionWindowDays", () => {
    expect(readPolicyWindows({ "Handover.DecisionWindowDays": 3 }).decisionDays).toBe(3);
    expect(readPolicyWindows({}).decisionDays).toBe(7);
  });

  it("thiếu, sai dạng hoặc không dương thì dùng mức gốc", () => {
    expect(readPolicyWindows(undefined)).toEqual(DEFAULT_POLICY_WINDOWS);
    expect(readPolicyWindows({ "Handover.GrantWindowDays": "48" })).toEqual(DEFAULT_POLICY_WINDOWS);
    expect(readPolicyWindows({ "Handover.GrantWindowDays": 0 })).toEqual(DEFAULT_POLICY_WINDOWS);
    expect(readPolicyWindows({ "Handover.GrantWindowDays": 1.5 })).toEqual(DEFAULT_POLICY_WINDOWS);
  });
});
