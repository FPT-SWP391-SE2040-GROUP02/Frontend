import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api/axiosClient";
import { CREATED_AT } from "@/shared/api/__tests__/backend.fixtures";
import { planSetupService } from "../planSetupService";

const INVITATION_ID = "11111111-1111-4111-8111-111111111111";
const TOKEN = "synthetic-invitation-token-at-least-32-characters";

const executorResponse = {
  id: INVITATION_ID,
  status: "ACCEPTED",
  inviteeEmail: "nguoi-duoc-moi@example.test",
  expiresAt: CREATED_AT,
  acceptedAt: CREATED_AT,
  invitationSentAt: null,
  acceptedScopeVersion: "v1",
  etag: "e1",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("planSetupService respond", () => {
  it("gửi password khi chấp nhận theo id lời mời", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(executorResponse);
    await planSetupService.respondById(INVITATION_ID, true, true, "v1", "mat-khau-thu");
    expect(post).toHaveBeenCalledWith(`/executor-invitations/${INVITATION_ID}/respond`, {
      accept: true,
      acknowledgeScope: true,
      scopeVersion: "v1",
      password: "mat-khau-thu",
    });
  });

  it("không gửi password khi từ chối theo id lời mời", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(executorResponse);
    await planSetupService.respondById(INVITATION_ID, false, false, "v1", "mat-khau-thu");
    const body = post.mock.calls[0][1] as Record<string, unknown>;
    expect(body).not.toHaveProperty("password");
  });

  it("gửi password khi chấp nhận theo token và bỏ khi từ chối", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(executorResponse);
    await planSetupService.respond(TOKEN, true, true, "v1", "mat-khau-thu");
    await planSetupService.respond(TOKEN, false, false, "v1");
    const accepted = post.mock.calls[0][1] as Record<string, unknown>;
    const declined = post.mock.calls[1][1] as Record<string, unknown>;
    expect(accepted.password).toBe("mat-khau-thu");
    expect(declined).not.toHaveProperty("password");
  });
});
