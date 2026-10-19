import { describe, expect, it } from "vitest";
import {
  authCsrfTokenResponseSchema,
  authSessionResponseSchema,
  currentSessionResponseSchema,
} from "../authContract.schema";
const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "user@example.test",
  fullName: "Fixture",
  phone: null,
  role: "USER",
  status: "ACTIVE",
  createdAt: "2026-10-14T00:00:00Z",
  emailVerified: true,
  hasPassword: true,
};
const session = { accessToken: "opaque_access+/=", expiresIn: 900, user };
describe("Backend 838ebe1 raw contract", () => {
  it("preserves the raw opaque proof and rejects the old envelope", () => {
    expect(authCsrfTokenResponseSchema.parse({ requestToken: "proof+/=" })).toEqual({
      requestToken: "proof+/=",
    });
    expect(authCsrfTokenResponseSchema.safeParse({ data: { requestToken: "proof" } }).success).toBe(
      false,
    );
  });
  it.each([undefined, null, "", "   ", 123, {}, []])("rejects invalid proof %j", (requestToken) => {
    expect(authCsrfTokenResponseSchema.safeParse({ requestToken }).success).toBe(false);
  });
  it("validates raw login/refresh and strips refresh/private fields", () => {
    expect(
      authSessionResponseSchema.parse({
        ...session,
        refreshToken: "secret",
        user: { ...user, passwordHash: "secret" },
      }),
    ).toEqual(session);
    expect(authSessionResponseSchema.safeParse({ data: session }).success).toBe(false);
  });
  it("accepts raw UserResponse and requires backend fields", () => {
    expect(currentSessionResponseSchema.parse(user)).toEqual(user);
    expect(currentSessionResponseSchema.safeParse({ user }).success).toBe(false);
    expect(currentSessionResponseSchema.safeParse({ ...user, phone: undefined }).success).toBe(
      false,
    );
    expect(
      currentSessionResponseSchema.safeParse({ ...user, emailVerified: undefined }).success,
    ).toBe(false);
  });
  it.each(["USER", "VERIFIER", "ADMIN"])("preserves system role %s", (role) => {
    expect(currentSessionResponseSchema.parse({ ...user, role }).role).toBe(role);
  });
  it.each(["OWNER", "NOTARY", "EXECUTOR", "unexpected"])("rejects non-system role %s", (role) => {
    expect(currentSessionResponseSchema.safeParse({ ...user, role }).success).toBe(false);
  });
  it.each([-1, 1.5, "900"])("rejects invalid expiresIn %s", (expiresIn) => {
    expect(authSessionResponseSchema.safeParse({ ...session, expiresIn }).success).toBe(false);
  });
  it.each(["", " ", null])("rejects missing credential %j", (accessToken) => {
    expect(authSessionResponseSchema.safeParse({ ...session, accessToken }).success).toBe(false);
  });
});
