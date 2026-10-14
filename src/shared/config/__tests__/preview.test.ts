import { afterEach, describe, expect, it, vi } from "vitest";
import { isPreviewWorkspace, requirePreviewWorkspace } from "../preview";
import { ROUTES } from "../routes.config";
afterEach(() => {
  vi.unstubAllEnvs();
  window.history.replaceState({}, "", "/");
});
describe("preview fixture boundary", () => {
  it("cho phép đúng route preview ở development", () => {
    vi.stubEnv("DEV", true);
    window.history.replaceState({}, "", Object.values(ROUTES.PREVIEW)[0]);
    expect(isPreviewWorkspace()).toBe(true);
    expect(() => requirePreviewWorkspace()).not.toThrow();
  });
  it("chặn dữ liệu mẫu ở route thật", () => {
    vi.stubEnv("DEV", true);
    window.history.replaceState({}, "", ROUTES.DASHBOARD.ROOT);
    expect(() => requirePreviewWorkspace()).toThrow();
  });
  it("chặn dữ liệu mẫu trong production kể cả URL preview", () => {
    vi.stubEnv("DEV", false);
    window.history.replaceState({}, "", Object.values(ROUTES.PREVIEW)[0]);
    expect(isPreviewWorkspace()).toBe(false);
    expect(() => requirePreviewWorkspace()).toThrow();
  });
});
