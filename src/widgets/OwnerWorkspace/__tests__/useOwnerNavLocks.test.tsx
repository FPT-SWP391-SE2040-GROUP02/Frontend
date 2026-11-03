import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { ROUTES } from "@/shared/config/routes.config";
import { useOwnerNavLocks } from "../useOwnerNavLocks";

const state = vi.hoisted(() => ({
  setup: undefined as
    { planStatus: string; canActivate: boolean; missingRequirements: string[] } | undefined,
}));

vi.mock("@/features/vault-management/model/useOwnerVault", () => ({
  useOwnerVault: () => ({ data: { id: "vault-1" } }),
}));
vi.mock("@/features/plan-setup/model/usePlanSetup", () => ({
  usePlanSetup: () => ({ data: state.setup }),
}));

const activeSetup = { planStatus: "ACTIVE", canActivate: true, missingRequirements: [] };

describe("useOwnerNavLocks", () => {
  beforeEach(() => {
    state.setup = undefined;
  });

  it("kế hoạch còn Nháp: khóa Điểm danh, trỏ về bước kích hoạt", () => {
    state.setup = { planStatus: "DRAFT", canActivate: true, missingRequirements: [] };
    const { result } = renderHook(() => useOwnerNavLocks(true));
    expect(result.current[ROUTES.DMS.ROOT]?.unlockHref).toBe(`${ROUTES.SETUP}?step=activate`);
  });

  it("dữ liệu chưa tải hoặc query lỗi (unknown): không khóa gì", () => {
    const { result } = renderHook(() => useOwnerNavLocks(true));
    expect(result.current).toEqual({});
  });

  it("kế hoạch đã kích hoạt: không khóa gì", () => {
    state.setup = activeSetup;
    const { result } = renderHook(() => useOwnerNavLocks(true));
    expect(result.current).toEqual({});
  });
});
