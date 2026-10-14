import { describe, expect, it } from "vitest";
import {
  authCsrfTokenResponseSchema,
  authSessionResponseSchema,
  currentSessionResponseSchema,
} from "../authContract.schema";
import { AUTH_SYSTEM_ROLES, AUTH_USER_STATUSES } from "../authContract.types";

const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "owner@example.test",
  fullName: "Contract fixture",
  phone: null,
  role: AUTH_SYSTEM_ROLES.OWNER,
  status: AUTH_USER_STATUSES.ACTIVE,
  createdAt: "2026-10-12T01:00:00+07:00",
  updatedAt: null,
};
const session = { userId: user.id, expiresIn: 900, user };

describe("C# cookie auth contract", () => {
  it("accepts the CSRF envelope and preserves its opaque proof", () => {
    const payload = { data: { requestToken: "opaque_CSRF-proof+/=" } };
    expect(authCsrfTokenResponseSchema.parse(payload)).toEqual(payload);
  });

  it.each([undefined, null, "", "   ", 123, {}, []])(
    "rejects invalid CSRF proof %j",
    (requestToken) => {
      expect(authCsrfTokenResponseSchema.safeParse({ data: { requestToken } }).success).toBe(false);
    },
  );

  it("rejects missing CSRF envelope and strips unexpected credentials", () => {
    expect(authCsrfTokenResponseSchema.safeParse({ requestToken: "proof" }).success).toBe(false);
    expect(
      authCsrfTokenResponseSchema.parse({
        data: { requestToken: "proof", accessToken: "secret", refreshToken: "secret" },
      }),
    ).toEqual({ data: { requestToken: "proof" } });
  });

  it("accepts login/refresh without bearer secrets or a legacy success field", () => {
    expect(authSessionResponseSchema.parse({ data: session })).toEqual({ data: session });
  });

  it("accepts the distinct current-session envelope", () => {
    expect(currentSessionResponseSchema.parse({ data: { user } })).toEqual({ data: { user } });
  });

  it("preserves VERIFIER without substituting a UI relationship role", () => {
    const data = { ...session, user: { ...user, role: AUTH_SYSTEM_ROLES.VERIFIER } };
    expect(authSessionResponseSchema.parse({ data }).data.user.role).toBe(
      AUTH_SYSTEM_ROLES.VERIFIER,
    );
  });

  it("removes bearer secrets and private user fields at the boundary", () => {
    expect(
      authSessionResponseSchema.parse({
        data: {
          ...session,
          accessToken: "must-not-propagate",
          refreshToken: "must-not-propagate",
          user: { ...user, passwordHash: "must-not-propagate" },
        },
      }),
    ).toEqual({ data: session });
  });

  it.each([-1, 1.5, "900"])("rejects invalid expiresIn %s", (expiresIn) => {
    expect(authSessionResponseSchema.safeParse({ data: { ...session, expiresIn } }).success).toBe(
      false,
    );
  });

  it("rejects the unwrapped legacy bootstrap shape", () => {
    expect(currentSessionResponseSchema.safeParse({ user }).success).toBe(false);
  });

  it("requires nullable fields serialized by C# instead of silently accepting missing fields", () => {
    const incomplete = { ...user, phone: undefined, updatedAt: undefined };
    expect(currentSessionResponseSchema.safeParse({ data: { user: incomplete } }).success).toBe(
      false,
    );
  });
});
