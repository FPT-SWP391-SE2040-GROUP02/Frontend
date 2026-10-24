import { describe, expect, it } from "vitest";
import { ROLES } from "@/shared/constants/roles";
import { AUTH_SYSTEM_ROLES, AUTH_USER_STATUSES } from "../../model/authContract.types";
import type { AuthUserDto } from "../../model/authContract.types";
import { toAuthUserViewModel } from "../adapters";

const user: AuthUserDto = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "verifier@example.test",
  fullName: "Verifier fixture",
  phone: null,
  role: AUTH_SYSTEM_ROLES.VERIFIER,
  status: AUTH_USER_STATUSES.ACTIVE,
  createdAt: "2026-10-12T00:00:00Z",
  emailVerified: true,
  hasPassword: true,
};

describe("Backend raw user adapter", () => {
  it("preserves the system role without granting NOTARY or OWNER membership", () => {
    const mapped = toAuthUserViewModel(user);
    expect(mapped.role).toBe(ROLES.VERIFIER);
    expect(mapped.role).not.toBe(ROLES.NOTARY);
    expect(mapped.role).not.toBe(ROLES.OWNER);
  });

  it("maps nullable fields to optional UI values without inventing an avatar", () => {
    const mapped = toAuthUserViewModel(user);
    expect(mapped.phone).toBeUndefined();
    expect(mapped.updatedAt).toBeUndefined();
    expect(mapped).not.toHaveProperty("avatarUrl");
    expect(user.phone).toBeNull();
  });

  it("maps the avatar flag and timestamp from the Backend and defaults to no avatar", () => {
    expect(toAuthUserViewModel(user).hasAvatar).toBe(false);
    const withAvatar = toAuthUserViewModel({
      ...user,
      hasAvatar: true,
      avatarUpdatedAt: "2026-10-24T06:00:00Z",
    });
    expect(withAvatar.hasAvatar).toBe(true);
    expect(withAvatar.avatarUpdatedAt).toBe("2026-10-24T06:00:00Z");
  });

  it("preserves populated contact/timestamps and strips unexpected properties", () => {
    const publicUser = { ...user, phone: "0900000000", updatedAt: "2026-10-12T01:00:00Z" };
    const mapped = toAuthUserViewModel({
      ...publicUser,
      ...{ passwordHash: "must-not-propagate" },
    });
    expect(mapped).toEqual({
      ...user,
      phone: "0900000000",
      hasAvatar: false,
      avatarUpdatedAt: undefined,
    });
    expect(mapped).not.toHaveProperty("updatedAt");
    expect(mapped).not.toHaveProperty("passwordHash");
  });
});
