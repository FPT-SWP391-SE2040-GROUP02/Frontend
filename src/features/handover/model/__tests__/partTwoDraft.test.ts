import { afterEach, describe, expect, it, vi } from "vitest";
import { clearPartTwoDraft, readPartTwoDraft, writePartTwoDraft } from "../partTwoDraft";

const TURN = "0199e7a4-0000-7c3e-9a51-3f0f5d2b8a10";

afterEach(() => {
  window.sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("partTwoDraft", () => {
  it("ghi rồi đọc lại đúng họ tên và ngày sinh", () => {
    writePartTwoDraft(TURN, { fullName: "Trần Minh Anh", dateOfBirth: "1990-01-01" });

    expect(readPartTwoDraft(TURN)).toEqual({
      fullName: "Trần Minh Anh",
      dateOfBirth: "1990-01-01",
    });
  });

  it("chỉ lưu họ tên và ngày sinh, không có số căn cước hay ô ký", () => {
    writePartTwoDraft(TURN, { fullName: "A", dateOfBirth: "1990-01-01" });

    const raw = window.sessionStorage.getItem(`handover-part2-draft:${TURN}`) ?? "";
    expect(Object.keys(JSON.parse(raw) as object).sort()).toEqual(["dateOfBirth", "fullName"]);
  });

  it("mỗi lượt một nháp riêng, xóa thì mất", () => {
    writePartTwoDraft(TURN, { fullName: "A", dateOfBirth: "" });

    expect(readPartTwoDraft("lượt-khác")).toBeNull();
    clearPartTwoDraft(TURN);
    expect(readPartTwoDraft(TURN)).toBeNull();
  });

  it("dữ liệu hỏng hoặc sai kiểu thì coi như không có nháp", () => {
    window.sessionStorage.setItem(`handover-part2-draft:${TURN}`, "{không phải json");
    expect(readPartTwoDraft(TURN)).toBeNull();
    window.sessionStorage.setItem(`handover-part2-draft:${TURN}`, JSON.stringify({ fullName: 1 }));
    expect(readPartTwoDraft(TURN)).toBeNull();
  });

  it("trình duyệt chặn sessionStorage thì không ném lỗi", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bị chặn");
    });

    expect(() => writePartTwoDraft(TURN, { fullName: "A", dateOfBirth: "" })).not.toThrow();
  });
});
