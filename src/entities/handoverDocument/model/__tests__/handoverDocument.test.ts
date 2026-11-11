import { describe, expect, it } from "vitest";
import { formatDocumentDate, todayInVietnam, vietnamDayOf } from "../handoverDocument.format";
import { handoverDocumentSchema, VERIFIER_CHECK_COUNT } from "../handoverDocument.schema";
import { VERIFIER_CHECKS } from "../documentTerms";

describe("định dạng ngày của biên bản", () => {
  it("yyyy-MM-dd thành dd/MM/yyyy không lệch múi giờ, thiếu thì trả dòng chấm", () => {
    expect(formatDocumentDate("2026-11-05")).toBe("05/11/2026");
    expect(formatDocumentDate(null)).toBe("…/…/……");
    expect(formatDocumentDate("không phải ngày")).toBe("…/…/……");
  });

  it("ngày của một mốc giờ tính theo múi giờ Việt Nam", () => {
    expect(vietnamDayOf("2026-11-09T18:30:00Z")).toEqual({ day: "10", month: "11", year: "2026" });
    expect(todayInVietnam(new Date("2026-11-09T18:30:00Z"))).toBe("2026-11-10");
  });
});

describe("hợp đồng với Backend", () => {
  it("bốn mục kiểm tra thủ công khớp số mục Backend yêu cầu", () => {
    expect(VERIFIER_CHECKS).toHaveLength(VERIFIER_CHECK_COUNT);
    expect(VERIFIER_CHECK_COUNT).toBe(2);
  });

  it("nhận ngày dạng yyyy-MM-dd và từ chối ngày sai định dạng", () => {
    const base = {
      id: "0199e7a4-3333-7c3e-9a51-3f0f5d2b8a10",
      turnId: "0199e7a4-3333-7c3e-9a51-3f0f5d2b8a11",
      vaultId: "0199e7a4-3333-7c3e-9a51-3f0f5d2b8a12",
      code: "3F0F5D2B",
      kind: "ACCEPT",
      status: "WAIT_RECIPIENT",
      templateVersion: "bb-2026-11",
      containerName: "Gói",
      itemCount: 1,
      owner: {
        fullName: "A",
        dateOfDeath: "2026-11-05",
        certificateNumber: "",
        certificateIssuedOn: null,
      },
      recipient: { fullName: "B", birthYear: null, citizenIdLast4: "", signedAt: null },
      verifier: { signedByName: "", checks: [], signedAt: null },
      createdAt: "2026-11-10T02:00:00+00:00",
      completedAt: null,
    };
    expect(handoverDocumentSchema.safeParse(base).success).toBe(true);
    expect(
      handoverDocumentSchema.safeParse({
        ...base,
        owner: { ...base.owner, dateOfDeath: "05/11/2026" },
      }).success,
    ).toBe(false);
  });
});
