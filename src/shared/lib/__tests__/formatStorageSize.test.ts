import { describe, expect, it } from "vitest";
import { formatStorageMegabytes, formatStorageSize } from "../formatStorageSize";

describe("vault storage in fixed MB", () => {
  it.each([
    [0, "0 MB"],
    [128, "< 0,01 MB"],
    [58285, "0,06 MB"],
    [7 * 1_048_576, "7 MB"],
    [20 * 1_048_576, "20 MB"],
    [200 * 1_048_576, "200 MB"],
    [500 * 1_048_576, "500 MB"],
    [1024 * 1_048_576, "1.024 MB"],
  ])("formats %s bytes as %s without changing quotas", (bytes, expected) => {
    expect(formatStorageMegabytes(bytes)).toBe(expected);
  });

  it.each([-1, NaN, Infinity, -Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "does not invent storage for invalid value %s",
    (bytes) => {
      expect(formatStorageMegabytes(bytes)).toBe("—");
    },
  );
});

describe("decimal storage display", () => {
  it.each([
    [0, "0 B"],
    [999, "999 B"],
    [1000, "1 KB"],
    [58285, "58,3 KB"],
    [999950, "1 MB"],
    [1000000, "1 MB"],
    [20971520, "20,97 MB"],
    [209715200, "209,72 MB"],
    [524288000, "524,29 MB"],
    [1000000000, "1 GB"],
    [1000000000000, "1 TB"],
  ])("formats %s bytes as %s without binary-unit relabeling", (bytes, expected) => {
    expect(formatStorageSize(bytes)).toBe(expected);
  });

  it.each([-1, NaN, Infinity, -Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "does not invent zero storage for invalid value %s",
    (bytes) => {
      expect(formatStorageSize(bytes)).toBe("—");
    },
  );
});
