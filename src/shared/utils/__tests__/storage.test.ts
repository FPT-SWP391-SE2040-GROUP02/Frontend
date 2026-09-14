import { describe, it, expect, beforeEach } from "vitest";
import { storage } from "../storage";
import { ROLES } from "@/shared/constants/roles";

describe("storage utility - Active Role and Demo Mode", () => {
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

  it("should return false for demo mode by default", () => {
    expect(storage.isDemoMode()).toBe(false);
  });

  it("should enable and disable demo mode correctly", () => {
    storage.setDemoMode(true);
    expect(storage.isDemoMode()).toBe(true);

    storage.setDemoMode(false);
    expect(storage.isDemoMode()).toBe(false);
  });
});
