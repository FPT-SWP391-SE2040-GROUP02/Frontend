import { describe, expect, it } from "vitest";
import { vaultPageTitle } from "../vaultPageTitle";

describe("vaultPageTitle", () => {
  it("uses the vault name as the title and moves the default label to the eyebrow", () => {
    expect(vaultPageTitle("tài sản cua tao")).toEqual({
      title: "tài sản cua tao",
      eyebrow: "Tài sản của tôi",
    });
  });

  it("trims the name before using it", () => {
    expect(vaultPageTitle("  Tài sản gia đình  ").title).toBe("Tài sản gia đình");
  });

  it.each([undefined, null, "", "   "])("falls back to the default label for %j", (name) => {
    expect(vaultPageTitle(name)).toEqual({ title: "Tài sản của tôi" });
  });

  it("does not repeat the label when the vault kept the default name", () => {
    expect(vaultPageTitle("Tài sản của tôi")).toEqual({ title: "Tài sản của tôi" });
  });
});
