import { describe, expect, it } from "vitest";
import { resolveRecipientSteps } from "../resolveRecipientSteps";

function stateOf(result: ReturnType<typeof resolveRecipientSteps>, id: string) {
  return result.steps.find((step) => step.id === id)?.state;
}

describe("resolveRecipientSteps", () => {
  it("chưa có lời mời: bước đầu là việc cần làm, các bước sau bị chặn", () => {
    const result = resolveRecipientSteps({ turnStatuses: [] });
    expect(result.currentId).toBe("invitation");
    expect(stateOf(result, "identity")).toBe("blocked");
  });

  it("vừa được mời: đến bước xác minh danh tính", () => {
    const result = resolveRecipientSteps({ turnStatuses: ["INVITED"] });
    expect(stateOf(result, "invitation")).toBe("done");
    expect(result.currentId).toBe("identity");
  });

  it("đã xác minh: đến bước quyết định", () => {
    const result = resolveRecipientSteps({ turnStatuses: ["READY_TO_ACCEPT"] });
    expect(stateOf(result, "identity")).toBe("done");
    expect(result.currentId).toBe("decision");
  });

  it("đã đồng ý: đến bước tải tài sản", () => {
    const result = resolveRecipientSteps({ turnStatuses: ["HANDOVER_COMMITTED"] });
    expect(stateOf(result, "decision")).toBe("done");
    expect(result.currentId).toBe("download");
  });

  it("lượt đã từ chối: không còn bước nào để làm", () => {
    const result = resolveRecipientSteps({ turnStatuses: ["DECLINED"] });
    expect(result.currentId).toBeNull();
  });

  it("query lỗi: không bước nào hiện là xong", () => {
    const result = resolveRecipientSteps({ turnStatuses: null });
    for (const step of result.steps) {
      expect(step.state).toBe("unknown");
    }
  });
});
