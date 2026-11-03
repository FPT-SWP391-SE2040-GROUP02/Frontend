import { describe, expect, it } from "vitest";
import { countRemainingOwnerSteps, resolveOwnerSteps } from "../resolveOwnerSteps";

const ALL_MISSING = [
  "OWNER_EKYC_REQUIRED",
  "PAID_SERVICE_REQUIRED",
  "READY_CONTAINER_REQUIRED",
  "PRIMARY_EXECUTOR_REQUIRED",
];

function stateOf(resolution: ReturnType<typeof resolveOwnerSteps>, id: string) {
  return resolution.steps.find((step) => step.id === id)?.state;
}

describe("resolveOwnerSteps", () => {
  it("chưa làm gì: bước đầu là current, kích hoạt bị chặn", () => {
    const result = resolveOwnerSteps({
      assetsCount: 0,
      beneficiariesCount: 0,
      setup: { planStatus: "DRAFT", canActivate: false, missingRequirements: ALL_MISSING },
    });
    expect(result.currentId).toBe("assets");
    expect(stateOf(result, "assets")).toBe("current");
    expect(stateOf(result, "activate")).toBe("blocked");
    expect(stateOf(result, "done")).toBe("blocked");
    expect(countRemainingOwnerSteps(result)).toBe(7);
  });

  it("làm một nửa: gợi ý bước chưa xong đầu tiên", () => {
    const result = resolveOwnerSteps({
      assetsCount: 3,
      beneficiariesCount: 0,
      setup: {
        planStatus: "DRAFT",
        canActivate: false,
        missingRequirements: ["PAID_SERVICE_REQUIRED", "READY_CONTAINER_REQUIRED"],
      },
    });
    expect(stateOf(result, "assets")).toBe("done");
    expect(stateOf(result, "identity")).toBe("done");
    expect(result.currentId).toBe("service-tier");
    expect(stateOf(result, "recipients")).toBe("todo");
  });

  it("đủ điều kiện: bước kích hoạt là current", () => {
    const result = resolveOwnerSteps({
      assetsCount: 2,
      beneficiariesCount: 1,
      setup: { planStatus: "DRAFT", canActivate: true, missingRequirements: [] },
    });
    expect(result.currentId).toBe("activate");
    expect(countRemainingOwnerSteps(result)).toBe(1);
  });

  it("đã kích hoạt: xong hết, chỉ còn màn hoàn tất", () => {
    const result = resolveOwnerSteps({
      assetsCount: 2,
      beneficiariesCount: 1,
      setup: { planStatus: "ACTIVE", canActivate: true, missingRequirements: [] },
    });
    expect(stateOf(result, "activate")).toBe("done");
    expect(result.currentId).toBe("done");
    expect(countRemainingOwnerSteps(result)).toBe(0);
  });

  it("query lỗi: không bao giờ hiện là xong", () => {
    const result = resolveOwnerSteps({ assetsCount: null, beneficiariesCount: null, setup: null });
    for (const step of result.steps) {
      expect(step.state).toBe("unknown");
    }
    expect(result.currentId).toBe("assets");
  });
});
