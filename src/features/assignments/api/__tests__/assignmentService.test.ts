import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api";
import { VAULT_PIN_HEADER } from "@/shared/api/vaultPin";
import { assignmentService } from "../assignmentService";

const VAULT_ID = "33333333-3333-4333-8333-333333333333";
const ASSET_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const PERSON_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

afterEach(() => vi.restoreAllMocks());

describe("assignmentService.setRecipients", () => {
  it("không kèm PIN thì không gửi header, để lớp truyền tải tự hỏi khi cần", async () => {
    const put = vi.spyOn(apiClient, "put").mockResolvedValue([]);
    await assignmentService.setRecipients(VAULT_ID, ASSET_ID, [PERSON_ID]);

    expect(put).toHaveBeenCalledWith(`/vaults/${VAULT_ID}/assets/${ASSET_ID}/assignments`, {
      beneficiaryIds: [PERSON_ID],
      confirmPlanDeactivation: false,
    });
  });

  it("có PIN đã kiểm thì gửi kèm header để không hỏi lại", async () => {
    const put = vi.spyOn(apiClient, "put").mockResolvedValue([]);
    await assignmentService.setRecipients(VAULT_ID, ASSET_ID, [PERSON_ID], false, "123456");

    expect(put).toHaveBeenCalledWith(
      `/vaults/${VAULT_ID}/assets/${ASSET_ID}/assignments`,
      { beneficiaryIds: [PERSON_ID], confirmPlanDeactivation: false },
      { headers: { [VAULT_PIN_HEADER]: "123456" } },
    );
  });
});
