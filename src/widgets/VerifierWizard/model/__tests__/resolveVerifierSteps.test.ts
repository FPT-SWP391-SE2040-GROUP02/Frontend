import { describe, expect, it } from "vitest";
import { resolveVerifierSteps } from "../resolveVerifierSteps";

const none = { caseId: null, caseStatus: null, viewedDocuments: false, readWarnings: false };

function stateOf(result: ReturnType<typeof resolveVerifierSteps>, id: string) {
  return result.steps.find((step) => step.id === id)?.state;
}

describe("resolveVerifierSteps", () => {
  it("chưa chọn hồ sơ: chỉ bước chọn hồ sơ mở", () => {
    const result = resolveVerifierSteps(none);
    expect(result.currentId).toBe("pick");
    expect(stateOf(result, "documents")).toBe("blocked");
    expect(stateOf(result, "decision")).toBe("blocked");
  });

  it("đã chọn hồ sơ: đến bước xem giấy tờ", () => {
    const result = resolveVerifierSteps({ ...none, caseId: "c1", caseStatus: "UNDER_REVIEW" });
    expect(result.currentId).toBe("documents");
  });

  it("đã xem giấy tờ và cảnh báo: bước quyết định mở", () => {
    const result = resolveVerifierSteps({
      caseId: "c1",
      caseStatus: "UNDER_REVIEW",
      viewedDocuments: true,
      readWarnings: true,
    });
    expect(result.currentId).toBe("decision");
  });

  it("máy chủ đã chốt quyết định: bước quyết định xong", () => {
    const result = resolveVerifierSteps({
      caseId: "c1",
      caseStatus: "APPROVED_FOR_HANDOVER",
      viewedDocuments: true,
      readWarnings: true,
    });
    expect(stateOf(result, "decision")).toBe("done");
    expect(result.currentId).toBeNull();
  });

  it("chưa tải được hồ sơ: bước quyết định hiện chưa kiểm tra được", () => {
    const result = resolveVerifierSteps({
      caseId: "c1",
      caseStatus: null,
      viewedDocuments: true,
      readWarnings: true,
    });
    expect(stateOf(result, "decision")).toBe("unknown");
  });
});
