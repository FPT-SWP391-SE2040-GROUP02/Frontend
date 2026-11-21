import { describe, expect, it } from "vitest";
import type { ExecutorVault } from "../deathCase.schema";
import { deriveNotifications, type RecordMoments } from "../notifications";

const vault: ExecutorVault = {
  vaultId: "11111111-1111-4111-8111-111111111111",
  ownerFullName: "Anh Nam",
  planStatus: "ACTIVE",
  handoverRecordStatus: "",
};

function record(overrides: Partial<RecordMoments> = {}): RecordMoments {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    status: "DRAFTING",
    revisionNo: 1,
    requestedAt: "2026-11-01T03:00:00Z",
    finalizedAt: null,
    completedAt: null,
    canSign: false,
    ...overrides,
  };
}

describe("deriveNotifications", () => {
  it("chưa mở bàn giao và không có hướng dẫn thì không có thông báo", () => {
    expect(deriveNotifications(vault, null)).toEqual([]);
  });

  it("biên bản chờ bạn ký thì báo đứng trên cùng", () => {
    const items = deriveNotifications(
      vault,
      record({ status: "SIGNING", canSign: true, finalizedAt: "2026-11-02T03:00:00Z" }),
    );
    expect(items[0].title).toBe("Đến lượt bạn ký biên bản");
    expect(items[0].tone).toBe("attention");
  });

  it("các mốc của biên bản xếp mới nhất trước", () => {
    const items = deriveNotifications(
      vault,
      record({
        status: "COMPLETED",
        finalizedAt: "2026-11-02T03:00:00Z",
        completedAt: "2026-11-03T03:00:00Z",
      }),
    );
    expect(items.map((item) => item.title)).toEqual([
      "Biên bản đã đủ chữ ký",
      "Luật sư đã chốt biên bản",
      "Bạn đã mở bàn giao",
    ]);
  });

  it("chốt lại bản mới thì id đổi để thông báo hiện lại là chưa đọc", () => {
    const first = deriveNotifications(vault, record({ finalizedAt: "2026-11-02T03:00:00Z" }));
    const second = deriveNotifications(
      vault,
      record({ revisionNo: 2, finalizedAt: "2026-11-04T03:00:00Z" }),
    );
    expect(first.find((item) => item.id.startsWith("finalized"))!.id).not.toBe(
      second.find((item) => item.id.startsWith("finalized"))!.id,
    );
  });
});
