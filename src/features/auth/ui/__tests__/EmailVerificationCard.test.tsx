import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { AxiosError, AxiosHeaders } from "axios";
import { authService } from "../../api/authService";
import { EmailVerificationCard } from "../EmailVerificationCard";
import { VERIFY_EMAIL_CONTENT as content } from "../../model/verifyEmail.schema";
import { accessTokenMemory } from "@/shared/api/accessToken";
vi.mock("../../api/authService", () => ({ authService: { verifyEmail: vi.fn() } }));
const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "fixture@example.test",
  fullName: "Fixture",
  phone: null,
  role: "USER",
  status: "ACTIVE",
  emailVerified: true,
  hasPassword: true,
  createdAt: "2026-10-14T00:00:00Z",
} as const;
let client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  client = new QueryClient();
  accessTokenMemory.set("existing-fixture-session");
});
afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
});
function setup(token = "opaque+token/", onVerified = vi.fn()) {
  return {
    onVerified,
    ...render(
      <StrictMode>
        <QueryClientProvider client={client}>
          <MemoryRouter>
            <EmailVerificationCard token={token} onVerified={onVerified} />
          </MemoryRouter>
        </QueryClientProvider>
      </StrictMode>,
    ),
  };
}
describe("EmailVerificationCard", () => {
  it("does not POST on mount or StrictMode", () => {
    setup();
    expect(authService.verifyEmail).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: content.verify })).toBeEnabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
  it("waits for server, prevents duplicate clicks, and never replaces the active session", async () => {
    let resolve!: (value: typeof user) => void;
    vi.mocked(authService.verifyEmail).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const { onVerified } = setup();
    const button = screen.getByRole("button", { name: content.verify });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(await screen.findByRole("button", { name: content.pending })).toBeDisabled();
    expect(onVerified).not.toHaveBeenCalled();
    await act(async () => resolve(user));
    await screen.findByText(content.verified);
    expect(screen.getByRole("status")).toHaveTextContent(content.verified);
    expect(onVerified).toHaveBeenCalledTimes(1);
    expect(authService.verifyEmail).toHaveBeenCalledExactlyOnceWith("opaque+token/");
    expect(accessTokenMemory.get()).toBe("existing-fixture-session");
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    for (const mutation of client.getMutationCache().getAll())
      expect(mutation.state.variables).toBeUndefined();
  });
  it("does not report success for an unverified response", async () => {
    vi.mocked(authService.verifyEmail).mockResolvedValue({ ...user, emailVerified: false });
    const { onVerified } = setup();
    fireEvent.click(screen.getByRole("button", { name: content.verify }));
    expect(await screen.findByRole("alert")).toHaveTextContent(content.unexpected);
    expect(onVerified).not.toHaveBeenCalled();
    expect(screen.queryByText(content.verified)).not.toBeInTheDocument();
  });
  it("shows the combined invalid/expired/consumed error and recovery without retrying the token", async () => {
    const config = { headers: new AxiosHeaders() };
    vi.mocked(authService.verifyEmail).mockRejectedValue(
      new AxiosError("private details", undefined, config, undefined, {
        status: 400,
        statusText: "Bad Request",
        config,
        headers: {},
        data: { code: "INVALID_VERIFICATION_TOKEN", detail: "private details" },
      }),
    );
    setup();
    fireEvent.click(screen.getByRole("button", { name: content.verify }));
    expect(await screen.findByRole("alert")).toHaveTextContent(content.invalidLink);
    expect(screen.getByRole("button", { name: content.retry })).toBeDisabled();
    expect(screen.getByRole("link", { name: content.recover })).toBeInTheDocument();
    expect(authService.verifyEmail).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("private details")).not.toBeInTheDocument();
  });
  it("lets the user retry a network error explicitly", async () => {
    vi.mocked(authService.verifyEmail)
      .mockRejectedValueOnce(new AxiosError("fixture", AxiosError.ERR_NETWORK))
      .mockResolvedValueOnce(user);
    setup();
    fireEvent.click(screen.getByRole("button", { name: content.verify }));
    expect(await screen.findByRole("alert")).toHaveTextContent(content.uncertain);
    expect(authService.verifyEmail).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: content.retry }));
    expect(await screen.findByRole("status")).toHaveTextContent(content.verified);
    expect(authService.verifyEmail).toHaveBeenCalledTimes(2);
  });
  it.each(["", " ", "x".repeat(257)])("does not POST invalid token", (token) => {
    setup(token);
    expect(screen.getByRole("alert")).toHaveTextContent(content.invalidLink);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(authService.verifyEmail).not.toHaveBeenCalled();
  });
});
