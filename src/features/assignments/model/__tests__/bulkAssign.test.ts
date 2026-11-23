import { describe, expect, it } from "vitest";
import { planBulkChanges } from "../bulkAssign";

const A = "a";
const B = "b";
const AN = "an";
const BINH = "binh";

describe("planBulkChanges", () => {
  it("chưa chọn ai thì không có thay đổi", () => {
    expect(planBulkChanges([A, B], { [A]: [], [B]: [AN] }, [], "add")).toEqual([]);
  });

  it("thêm vào: giữ người đang nhận, thêm người mới", () => {
    const changes = planBulkChanges([A, B], { [A]: [], [B]: [AN] }, [BINH], "add");
    expect(changes).toEqual([
      { assetId: A, beneficiaryIds: [BINH] },
      { assetId: B, beneficiaryIds: [AN, BINH] },
    ]);
  });

  it("thay bằng: mỗi tài sản chỉ còn đúng danh sách đã chọn", () => {
    const changes = planBulkChanges([A, B], { [A]: [AN], [B]: [AN, BINH] }, [BINH], "replace");
    expect(changes).toEqual([
      { assetId: A, beneficiaryIds: [BINH] },
      { assetId: B, beneficiaryIds: [BINH] },
    ]);
  });

  it("bỏ qua tài sản đã có đúng danh sách sau cùng", () => {
    const changes = planBulkChanges([A, B], { [A]: [AN, BINH], [B]: [AN] }, [AN, BINH], "add");
    expect(changes).toEqual([{ assetId: B, beneficiaryIds: [AN, BINH] }]);
  });
});
