import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useServerNow } from "../useServerNow";

describe("useServerNow", () => {
  it("trả giờ của trình duyệt", () => {
    const before = Date.now();
    const { result } = renderHook(() => useServerNow());
    const after = Date.now();
    expect(result.current.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.current.getTime()).toBeLessThanOrEqual(after);
  });
});
