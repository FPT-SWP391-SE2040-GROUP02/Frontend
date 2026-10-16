import { afterEach, describe, expect, it, vi } from "vitest";
import { runAuthTransition, invalidateAuthSession } from "../authTransitions";
afterEach(() => vi.unstubAllGlobals());
describe("Auth cookie transition coordination", () => {
  it("waits for a refresh and its publication before logout, then recovers after failure", async () => {
    const events: string[] = [];
    let complete!: () => void;
    const refresh = runAuthTransition(
      () =>
        new Promise<void>((resolve) => {
          events.push("refresh");
          complete = resolve;
        }),
      () => {
        events.push("publish");
      },
    );
    const logout = runAuthTransition(
      async () => {
        events.push("logout");
      },
      () => {
        events.push("clear");
      },
    );
    await Promise.resolve();
    expect(events).toEqual(["refresh"]);
    complete();
    await refresh;
    await logout;
    expect(events).toEqual(["refresh", "publish", "logout", "clear"]);
    await expect(
      runAuthTransition(
        async () => {
          throw new Error("failure");
        },
        () => {},
      ),
    ).rejects.toThrow("failure");
    await expect(
      runAuthTransition(
        async () => "retry",
        () => {},
      ),
    ).resolves.toBe("retry");
  });
  it("does not publish an operation invalidated by another tab", async () => {
    let complete!: () => void;
    const publish = vi.fn();
    const result = runAuthTransition(
      () =>
        new Promise<void>((resolve) => {
          complete = resolve;
        }),
      publish,
    );
    await Promise.resolve();
    invalidateAuthSession();
    complete();
    await expect(result).rejects.toThrow("Auth context changed");
    expect(publish).not.toHaveBeenCalled();
  });
  it("uses the same cross-tab Web Lock for cookie mutations", async () => {
    const request = vi.fn(async (_name: string, callback: () => Promise<unknown>) => callback());
    vi.stubGlobal("navigator", { locks: { request } });
    await runAuthTransition(
      async () => "session",
      () => {},
    );
    expect(request).toHaveBeenCalledWith("legacyvault-auth-cookie", expect.any(Function));
  });
});
