import { afterEach, describe, expect, it } from "vitest";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { sessionAuthService } from "../authService";
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
