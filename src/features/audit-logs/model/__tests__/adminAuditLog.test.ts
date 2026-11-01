import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api";
import { auditLogService } from "../../api/auditLogService";
import { adminAuditLogPageSchema } from "../auditLog.schema";
import { friendlyReason } from "../auditLogLabels";

const entry = {
  id: "0199e7a4-5c1b-7c3e-9a51-3f0f5d2b8a10",
  at: "2026-10-15T08:30:00+00:00",
  actorRole: "VERIFIER",
  actorUserId: "0199e7a4-0000-7c3e-9a51-3f0f5d2b8a10",
  action: "DEATH_CASE_REJECTED",
  targetType: "DEATH_CASE",
  targetId: "0199e7a4-1111-7c3e-9a51-3f0f5d2b8a10",
  targetVersion: 1,
  outcome: "SUCCEEDED",
  reason: "VERIFIER_REJECTED",
  vaultId: "0199e7a4-2222-7c3e-9a51-3f0f5d2b8a10",
  actorFullName: "Người xét duyệt A",
  actorEmail: "verifier@example.test",
};
const page = {
  items: [entry],
  totalCount: 1,
  pageIndex: 1,
  pageSize: 20,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

afterEach(() => vi.restoreAllMocks());

describe("nhật ký hoạt động của Admin", () => {
  it("schema nhận dòng có người thực hiện, null cho job nền và loại đối tượng CONFIGURATION", () => {
    expect(adminAuditLogPageSchema.safeParse(page).success).toBe(true);
    const system = {
      ...entry,
      actorRole: "SYSTEM",
      actorUserId: null,
      actorFullName: null,
      actorEmail: null,
      vaultId: null,
      targetType: "CONFIGURATION",
    };
    expect(adminAuditLogPageSchema.safeParse({ ...page, items: [system] }).success).toBe(true);
  });

  it("schema từ chối hành động lạ thay vì hiện dữ liệu sai", () => {
    const bad = { ...page, items: [{ ...entry, action: "NOT_AN_ACTION" }] };
    expect(adminAuditLogPageSchema.safeParse(bad).success).toBe(false);
  });

  it("service gọi GET /admin/audit-logs với query đã kiểm và trả dữ liệu đã parse", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(page);
    const result = await auditLogService.listAll({
      pageIndex: 2,
      pageSize: 20,
      sortBy: "at",
      isAscending: false,
      action: "DEATH_CASE_REJECTED",
    });
    expect(get).toHaveBeenCalledWith("/admin/audit-logs", {
      params: {
        pageIndex: 2,
        pageSize: 20,
        sortBy: "at",
        isAscending: false,
        action: "DEATH_CASE_REJECTED",
      },
      signal: undefined,
    });
    expect(result.items[0].actorEmail).toBe("verifier@example.test");
  });

  it("service không nhận query thừa như searchTerm", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue(page);
    await expect(
      auditLogService.listAll({ pageIndex: 1, searchTerm: "x" } as never),
    ).rejects.toThrow();
  });

  it("lý do dạng mã của hồ sơ bị từ chối hiện tiếng Việt, lý do khác giữ nguyên", () => {
    expect(friendlyReason("VERIFIER_REJECTED")).toBe("Người xét duyệt từ chối hồ sơ");
    expect(friendlyReason("ALIVE_CONFIRMED")).toBe("Người xét duyệt xác nhận chủ kho còn sống");
    expect(friendlyReason("Nhân viên mới")).toBe("Nhân viên mới");
  });
});
