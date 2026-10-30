import { describe, expect, it } from "vitest";
import { isWeakPin, isWellFormedPin } from "../pinRules";
import {
  changePinFormSchema,
  PIN_FORMAT_MESSAGE,
  PIN_MISMATCH_MESSAGE,
  PIN_WEAK_MESSAGE,
  resetPinFormSchema,
  setPinFormSchema,
} from "../vaultPin.schema";

describe("isWeakPin", () => {
  it.each(["000000", "111111", "999999", "123456", "234567", "012345", "654321", "987654"])(
    "rejects %s",
    (pin) => {
      expect(isWeakPin(pin)).toBe(true);
    },
  );

  it.each(["482913", "135790", "123450", "112233"])("accepts %s", (pin) => {
    expect(isWeakPin(pin)).toBe(false);
  });
});

describe("isWellFormedPin", () => {
  it("needs exactly six digits", () => {
    expect(isWellFormedPin("482913")).toBe(true);
    expect(isWellFormedPin("48291")).toBe(false);
    expect(isWellFormedPin("4829130")).toBe(false);
    expect(isWellFormedPin("48291a")).toBe(false);
    expect(isWellFormedPin("")).toBe(false);
  });
});

describe("pin form schemas", () => {
  it("accepts a good matching pin", () => {
    expect(setPinFormSchema.safeParse({ pin: "482913", confirmPin: "482913" }).success).toBe(true);
  });

  it("reports the format problem on the pin field", () => {
    const result = setPinFormSchema.safeParse({ pin: "12ab", confirmPin: "12ab" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({ path: ["pin"], message: PIN_FORMAT_MESSAGE });
  });

  it("reports a weak pin on the pin field", () => {
    const result = setPinFormSchema.safeParse({ pin: "123456", confirmPin: "123456" });
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({ path: ["pin"], message: PIN_WEAK_MESSAGE }),
    );
  });

  it("reports a mismatched confirmation on the confirm field", () => {
    const result = setPinFormSchema.safeParse({ pin: "482913", confirmPin: "482914" });
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({ path: ["confirmPin"], message: PIN_MISMATCH_MESSAGE }),
    );
  });

  it("change needs the current pin too", () => {
    expect(
      changePinFormSchema.safeParse({
        currentPin: "482913",
        newPin: "715284",
        confirmPin: "715284",
      }).success,
    ).toBe(true);
    expect(
      changePinFormSchema.safeParse({ currentPin: "", newPin: "715284", confirmPin: "715284" })
        .success,
    ).toBe(false);
  });

  it("reset needs the account password", () => {
    expect(
      resetPinFormSchema.safeParse({ password: "", newPin: "715284", confirmPin: "715284" })
        .success,
    ).toBe(false);
    expect(
      resetPinFormSchema.safeParse({
        password: "Matkhau-cua-toi-1",
        newPin: "715284",
        confirmPin: "715284",
      }).success,
    ).toBe(true);
  });
});
