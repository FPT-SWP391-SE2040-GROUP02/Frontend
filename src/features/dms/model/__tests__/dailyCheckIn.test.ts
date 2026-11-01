import { describe, expect, it } from "vitest";
import { checkInRefreshInterval, dailyCheckInState } from "../dailyCheckIn";

describe("giới hạn điểm danh theo ngày Việt Nam", () => {
  it("vẫn khóa qua nửa đêm UTC khi còn cùng ngày Việt Nam", () => {
    expect(
      dailyCheckInState({
        planStatus: "ACTIVE",
        serverTime: "2026-10-24T08:00:00Z",
        lastCheckInAt: "2026-10-23T18:00:00Z",
      }),
    ).toMatchObject({ checkedInToday: true, canCheckIn: false });
  });

  it("mở lúc 00:00 Việt Nam dù lần trước mới cách một giây", () => {
    expect(
      dailyCheckInState({
        planStatus: "ACTIVE",
        serverTime: "2026-10-24T17:00:00Z",
        lastCheckInAt: "2026-10-24T16:59:59Z",
      }).canCheckIn,
    ).toBe(true);
  });

  it("không mở khi kế hoạch đã sang chứng tử", () => {
    expect(
      dailyCheckInState({
        planStatus: "DEATH_CASE_OPEN",
        serverTime: "2026-10-24T08:00:00Z",
        lastCheckInAt: null,
      }).canCheckIn,
    ).toBe(false);
  });

  it("khóa nút khi Executor đã điểm danh hộ hôm nay dù chủ kho chưa tự điểm danh", () => {
    expect(
      dailyCheckInState({
        planStatus: "ACTIVE",
        serverTime: "2026-10-24T08:00:00Z",
        lastCheckInAt: null,
        checkedInByExecutorToday: true,
      }),
    ).toMatchObject({ checkedInToday: false, executorCheckedInToday: true, canCheckIn: false });
  });

  it("không khóa khi BE cũ chưa trả cờ Executor điểm danh hộ", () => {
    expect(
      dailyCheckInState({
        planStatus: "ACTIVE",
        serverTime: "2026-10-24T08:00:00Z",
        lastCheckInAt: null,
      }),
    ).toMatchObject({ executorCheckedInToday: false, canCheckIn: true });
  });

  it("đọc server ngay ranh giới ngày và tối đa mỗi 30 giây", () => {
    expect(checkInRefreshInterval("2026-10-24T16:59:55Z")).toBe(5000);
    expect(checkInRefreshInterval("2026-10-24T08:00:00Z")).toBe(30_000);
  });
});
