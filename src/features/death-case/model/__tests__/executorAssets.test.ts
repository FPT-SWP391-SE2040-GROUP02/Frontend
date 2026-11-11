import { describe, expect, it } from "vitest";
import type { ExecutorPackage } from "../deathCase.schema";
import {
  assetBadge,
  assetDownloadState,
  filterPackages,
  packageStatus,
  turnsOfPackage,
} from "../executorAssets";
import { handoverProgressSchema, type HandoverProgressTurn } from "../handoverProgress.schema";

const CONTAINER = "66666666-6666-4666-8666-666666666666";
const ASSET_A = "77777777-7777-4777-8777-777777777777";
const ASSET_B = "88888888-8888-4888-8888-888888888888";
const SENT = "2026-12-23T06:14:00+00:00";

const pkg: ExecutorPackage = {
  containerId: CONTAINER,
  containerName: "Gói gia đình",
  recipients: [{ fullName: "Trần Minh Anh", citizenIdLast4: "0791" }],
  assets: [
    { id: ASSET_A, name: "Sổ tiết kiệm.pdf", kind: "FILE", sizeBytes: 100 },
    { id: ASSET_B, name: "Mật khẩu ví", kind: "TEXT", sizeBytes: 10 },
  ],
};

function turn(overrides: Record<string, unknown>): HandoverProgressTurn {
  return handoverProgressSchema.parse({
    caseId: "33333333-3333-4333-8333-333333333333",
    handoverStarted: true,
    serverTime: SENT,
    summary: {
      totalTurns: 1,
      waitingResponse: 0,
      inVerification: 0,
      accepted: 0,
      declined: 0,
      ended: 0,
    },
    turns: [
      {
        turnId: "55555555-5555-4555-8555-555555555555",
        containerId: CONTAINER,
        containerName: "Gói gia đình",
        beneficiaryCitizenIdLast4: "0791",
        status: "INVITED",
        claimedByYou: false,
        identityConfirmedByExecutor: false,
        invitedAt: SENT,
        responseDeadline: SENT,
        claimedAt: null,
        decisionDeadline: null,
        decidedAt: null,
        grantStatus: null,
        grantExpiresAt: null,
        totalItems: 2,
        downloadedItems: 0,
        items: [],
        ...overrides,
      },
    ],
  }).turns[0];
}

const item = (assetId: string, downloaded: boolean) => ({
  itemId: crypto.randomUUID(),
  assetId,
  name: "x",
  kind: "FILE",
  downloaded,
  firstDownloadedAt: downloaded ? SENT : null,
});

describe("packageStatus", () => {
  it("chưa có lượt: Chưa bàn giao", () => {
    expect(packageStatus([])).toEqual({ label: "Chưa bàn giao", tone: "neutral" });
  });
  it("chờ trả lời, chờ nhập mã, đã nhận xong, từ chối nhận", () => {
    expect(packageStatus([turn({ invitationSentAt: SENT })]).label).toBe("Chờ trả lời");
    expect(
      packageStatus([turn({ status: "HANDOVER_COMMITTED", invitationSentAt: SENT })]).label,
    ).toBe("Chờ nhập mã");
    expect(
      packageStatus([
        turn({
          status: "HANDOVER_COMMITTED",
          invitationSentAt: SENT,
          keyVerifiedAt: SENT,
          downloadedItems: 2,
          receivedAllAt: SENT,
        }),
      ]).label,
    ).toBe("Đã nhận xong");
    expect(packageStatus([turn({ status: "DECLINED" })]).label).toBe("Từ chối nhận");
  });
});

describe("assetDownloadState", () => {
  const committed = { status: "HANDOVER_COMMITTED", invitationSentAt: SENT, keyVerifiedAt: SENT };
  it("không có lượt thì chưa tải", () => {
    expect(assetDownloadState(ASSET_A, [])).toBe("not-downloaded");
  });
  it("nối theo mã tài sản gốc: tải A, chưa tải B", () => {
    const t = turn({ ...committed, items: [item(ASSET_A, true), item(ASSET_B, false)] });
    expect(assetDownloadState(ASSET_A, [t])).toBe("downloaded");
    expect(assetDownloadState(ASSET_B, [t])).toBe("not-downloaded");
  });
  it("người nhận từ chối thì không bàn giao", () => {
    expect(assetDownloadState(ASSET_A, [turn({ status: "DECLINED" })])).toBe("not-handed-over");
  });
});

describe("turnsOfPackage, assetBadge, filterPackages", () => {
  it("chỉ lấy lượt đúng mã gói", () => {
    const other = turn({ containerId: "99999999-9999-4999-8999-999999999999" });
    expect(turnsOfPackage(pkg, [turn({}), other])).toHaveLength(1);
  });
  it("ô loại theo đuôi tên", () => {
    expect(assetBadge("a.pdf", "FILE")).toBe("PDF");
    expect(assetBadge("a.JPG", "FILE")).toBe("ẢNH");
    expect(assetBadge("a", "FILE")).toBe("TỆP");
    expect(assetBadge("ghi chú", "TEXT")).toBe("TXT");
  });
  it("tìm theo tên tài sản hoặc người nhận", () => {
    expect(filterPackages([pkg], "")).toHaveLength(1);
    expect(filterPackages([pkg], "trần minh")[0].assets).toHaveLength(2);
    const byAsset = filterPackages([pkg], "ví");
    expect(byAsset[0].assets.map((asset) => asset.id)).toEqual([ASSET_B]);
    expect(filterPackages([pkg], "không có")).toHaveLength(0);
  });
});
