import { describe, it, expect, beforeEach } from "vitest";
import { storage } from "../storage";
import { ROLES } from "@/shared/constants/roles";

describe("storage utility - Active Role and Object Storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should return OWNER as default active role when localStorage is empty", () => {
    expect(storage.getActiveRole()).toBe(ROLES.OWNER);
  });

  it("should update and persist active role correctly", () => {
    storage.setActiveRole(ROLES.NOTARY);
    expect(storage.getActiveRole()).toBe(ROLES.NOTARY);

    storage.setActiveRole(ROLES.BENEFICIARY);
    expect(storage.getActiveRole()).toBe(ROLES.BENEFICIARY);
  });

  it("should store and retrieve serialized objects correctly", () => {
    const data = { theme: "dark", preferences: { sound: true } };
    storage.set("app_prefs", data);
    expect(storage.get("app_prefs")).toEqual(data);

    storage.remove("app_prefs");
    expect(storage.get("app_prefs")).toBeNull();
  });

  it("should return default value when key does not exist", () => {
    expect(storage.get("non_existent", "default_val")).toBe("default_val");
  });
});
