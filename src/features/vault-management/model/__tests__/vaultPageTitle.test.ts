import { describe, expect, it } from "vitest";
import { vaultPageTitle } from "../vaultPageTitle";

describe("vaultPageTitle", () => {
  it("uses the vault name as the title and moves the default label to the eyebrow", () => {
    expect(vaultPageTitle("kho cua tao")).toEqual({
      title: "kho cua tao",
      eyebrow: "Kho của tôi",
    });
  });

  it("trims the name before using it", () => {
    expect(vaultPageTitle("  Kho gia đình  ").title).toBe("Kho gia đình");
  });

  it.each([undefined, null, "", "   "])("falls back to the default label for %j", (name) => {
    expect(vaultPageTitle(name)).toEqual({ title: "Kho của tôi" });
  });

  it("does not repeat the label when the vault kept the default name", () => {
    expect(vaultPageTitle("Kho của tôi")).toEqual({ title: "Kho của tôi" });
  });
});
