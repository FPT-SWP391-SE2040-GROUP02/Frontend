import { describe, expect, it } from "vitest";
import type { Assignment } from "@/entities/assignment/model/assignment.schema";
import {
  buildAssetRows,
  buildRecipientCards,
  currentRecipientIds,
  summarizeAssignments,
  type AssignableAsset,
  type AssignableRecipient,
} from "../assignmentView";

const HOUSE: AssignableAsset = { id: "a1", name: "Nhà", kind: "FILE" };
const CAR: AssignableAsset = { id: "a2", name: "Xe", kind: "TEXT" };
const GOLD: AssignableAsset = { id: "a3", name: "Vàng", kind: "TEXT" };
const AN: AssignableRecipient = { id: "p1", fullName: "Nguyễn Văn An", citizenId: "0001" };
const BINH: AssignableRecipient = { id: "p2", fullName: "Trần Thị Bình", citizenId: "0002" };
const CUONG: AssignableRecipient = { id: "p3", fullName: "Lê Văn Cường", citizenId: "0003" };

function link(assetId: string, beneficiaryId: string): Assignment {
  return {
    id: `${assetId}-${beneficiaryId}`,
    assetId,
    beneficiaryId,
    createdAt: "2026-11-23T00:00:00Z",
  };
}

// Nhà nhận chung (An, Bình), Xe chỉ An, Vàng chưa gán cho ai.
const assignments = [link("a1", "p1"), link("a1", "p2"), link("a2", "p1")];

describe("buildAssetRows", () => {
  it("xếp tài sản chưa gán lên đầu rồi giữ thứ tự gốc", () => {
    const rows = buildAssetRows([HOUSE, CAR, GOLD], [AN, BINH], assignments);
    expect(rows.map((row) => row.asset.id)).toEqual(["a3", "a1", "a2"]);
    expect(rows[0].recipients).toEqual([]);
  });

  it("tài sản nhận chung có đủ mọi người nhận", () => {
    const rows = buildAssetRows([HOUSE], [AN, BINH], assignments);
    expect(rows[0].recipients.map((person) => person.id)).toEqual(["p1", "p2"]);
  });

  it("bỏ qua dòng gán trỏ tới người nhận không còn trong danh sách", () => {
    const rows = buildAssetRows([HOUSE], [AN], assignments);
    expect(rows[0].recipients.map((person) => person.id)).toEqual(["p1"]);
  });
});

describe("buildRecipientCards", () => {
  it("ghi số người cùng nhận từng tài sản và xếp người chưa có tài sản xuống cuối", () => {
    const cards = buildRecipientCards([HOUSE, CAR, GOLD], [CUONG, AN, BINH], assignments);
    expect(cards.map((card) => card.recipient.id)).toEqual(["p1", "p2", "p3"]);
    const an = cards[0];
    expect(an.assets.map((item) => [item.asset.id, item.sharedWithCount])).toEqual([
      ["a1", 2],
      ["a2", 1],
    ]);
    expect(cards[2].assets).toEqual([]);
  });
});

describe("summarizeAssignments", () => {
  it("đếm tài sản đã gán một lần dù nhận chung, và số người nhận có tài sản", () => {
    expect(summarizeAssignments([HOUSE, CAR, GOLD], assignments)).toEqual({
      totalAssets: 3,
      assignedAssets: 2,
      unassignedAssets: 1,
      recipientCount: 2,
    });
  });

  it("tài sản chưa có tài sản thì toàn số 0", () => {
    expect(summarizeAssignments([], [])).toEqual({
      totalAssets: 0,
      assignedAssets: 0,
      unassignedAssets: 0,
      recipientCount: 0,
    });
  });
});

describe("currentRecipientIds", () => {
  it("trả người nhận hiện tại của đúng tài sản theo thứ tự gán", () => {
    expect(currentRecipientIds("a1", assignments)).toEqual(["p1", "p2"]);
    expect(currentRecipientIds("a3", assignments)).toEqual([]);
  });
});
