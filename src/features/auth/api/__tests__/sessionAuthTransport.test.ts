import { afterEach, describe, expect, it } from "vitest";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { authService, sessionAuthService } from "../authService";
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
const originalAdapter = apiClient.defaults.adapter;
afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
  accessTokenMemory.clear();
});
describe("Auth service through the real Axios body interceptor", () => {
  it("transports both Google branches and link-confirm as raw bodies with fresh CSRF proof", async () => {
    const routes: string[] = [];
    let proofs = 0;
    let googleCalls = 0;
    apiClient.defaults.adapter = async (config) => {
      routes.push(config.url!);
      let data: unknown;
      if (config.url === "/auth/csrf") data = { requestToken: `proof-${++proofs}` };
      else {
        expect(config.withCredentials).toBe(true);
        expect(config.headers.get("X-CSRF-Token")).toBe(`proof-${proofs}`);
        const request: unknown = JSON.parse(config.data as string);
        if (config.url === "/auth/google") {
          expect(request).toEqual({
            idToken: "google-id-token",
            nonce: "random-nonce",
            rememberMe: true,
            returnUrl: "/dashboard?tab=files",
          });
          data =
            ++googleCalls === 1
              ? {
                  signedIn: false,
                  accountCreated: false,
                  returnUrl: "/dashboard?tab=files",
                  session: null,
                  linkTicket: "opaque-ticket",
                  maskedEmail: "u***@example.test",
                }
              : {
                  signedIn: true,
                  accountCreated: false,
                  returnUrl: null,
                  session: { accessToken: "google-access", expiresIn: 900, user },
                  linkTicket: null,
                  maskedEmail: null,
                };
        } else {
          expect(config.url).toBe("/auth/google/link-confirm");
          expect(request).toEqual({
            linkTicket: "opaque-ticket",
            password: "old",
            rememberMe: true,
          });
          data = { accessToken: "linked-access", expiresIn: 900, user };
        }
      }
      return { data, status: 200, statusText: "OK", headers: {}, config };
    };
    const payload = {
      idToken: "google-id-token",
      nonce: "random-nonce",
      rememberMe: true,
      returnUrl: "/dashboard?tab=files",
    };
    expect(await authService.loginWithGoogle(payload)).toMatchObject({
      signedIn: false,
      linkTicket: "opaque-ticket",
    });
    expect(
      await authService.linkGoogleAccount({
        linkTicket: "opaque-ticket",
        password: "old",
        rememberMe: true,
      }),
    ).toMatchObject({ accessToken: "linked-access" });
    expect(await authService.loginWithGoogle(payload)).toMatchObject({
      signedIn: true,
      session: { accessToken: "google-access" },
    });
    expect(routes).toEqual([
      "/auth/csrf",
      "/auth/google",
      "/auth/csrf",
      "/auth/google/link-confirm",
      "/auth/csrf",
      "/auth/google",
    ]);
  });
  it("accepts raw Backend bodies, sends fresh proof and scopes the RAM Bearer header", async () => {
    const routes: string[] = [];
    apiClient.defaults.adapter = async (config) => {
      routes.push(config.url!);
      let data: unknown;
      if (config.url === "/auth/csrf") data = { requestToken: "fixture-proof" };
      else if (config.url === "/auth/login") {
        expect(config.headers.get("X-CSRF-Token")).toBe("fixture-proof");
        data = { accessToken: "fixture-access", expiresIn: 900, user };
      } else {
        expect(config.headers.get("Authorization")).toBe("Bearer fixture-access");
        data = user;
      }
      return { data, status: 200, statusText: "OK", headers: {}, config };
    };
    const session = await sessionAuthService.login({
      email: user.email,
      password: "fixture",
      rememberMe: false,
    });
    accessTokenMemory.set(session.accessToken);
    expect(await sessionAuthService.getSession()).toEqual(user);
    expect(routes).toEqual(["/auth/csrf", "/auth/login", "/auth/session"]);
  });
});
