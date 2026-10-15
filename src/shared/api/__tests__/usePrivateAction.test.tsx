import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { accessTokenMemory } from "../accessToken";
import { usePrivateAction } from "../usePrivateAction";
afterEach(() => {
  cleanup();
  accessTokenMemory.clear();
});
it("blocks duplicates and drops a late result after an account change", async () => {
  accessTokenMemory.set("account-a");
  let resolve!: (value: string) => void;
  const operation = vi.fn(
    () =>
      new Promise<string>((done) => {
        resolve = done;
      }),
  );
  const publish = vi.fn();
  const { result } = renderHook(usePrivateAction);
  let pending!: Promise<boolean>;
  act(() => {
    pending = result.current.execute(operation, publish);
  });
  await act(async () => {
    await result.current.execute(operation, publish);
  });
  expect(operation).toHaveBeenCalledTimes(1);
  accessTokenMemory.set("account-b");
  await act(async () => {
    resolve("private result");
    await pending;
  });
  expect(publish).not.toHaveBeenCalled();
  expect(result.current.succeeded).toBe(false);
});
it("does not publish or expose exception content after unmount", async () => {
  accessTokenMemory.set("fixture");
  let resolve!: () => void;
  const publish = vi.fn();
  const { result, unmount } = renderHook(usePrivateAction);
  let pending!: Promise<boolean>;
  act(() => {
    pending = result.current.execute(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
      publish,
    );
  });
  unmount();
  resolve();
  await pending;
  expect(publish).not.toHaveBeenCalled();
});
it("keeps a server failure as failure without retry or leaking its message", async () => {
  accessTokenMemory.set("fixture");
  const operation = vi.fn().mockRejectedValue(new Error("private secret"));
  const { result } = renderHook(usePrivateAction);
  await act(async () => {
    await result.current.execute(operation, vi.fn());
  });
  expect(operation).toHaveBeenCalledTimes(1);
  expect(result.current.error).not.toContain("private secret");
  expect(result.current.succeeded).toBe(false);
});
