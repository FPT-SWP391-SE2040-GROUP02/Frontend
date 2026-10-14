import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authService } from "@/features/auth/api/authService";
import { VERIFY_EMAIL_CONTENT as content } from "@/features/auth/model/verifyEmail.schema";
import { VerifyEmailPage } from "../VerifyEmailPage";
vi.mock("@/features/auth/api/authService", () => ({
  authService: { verifyEmail: vi.fn(), resendVerificationEmail: vi.fn() },
}));
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
});
afterEach(() => {
  cleanup();
  client.clear();
});
function setup(path: string, history = [path]) {
  const router = createMemoryRouter(
    [
      { path: "/verify-email", element: <VerifyEmailPage /> },
      { path: "/auth/verify-email", element: <VerifyEmailPage /> },
      { path: "/before", element: <p>Before verification</p> },
    ],
    { initialEntries: history, initialIndex: history.length - 1 },
  );
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}
describe("VerifyEmailPage URL lifecycle", () => {
  it.each(["/verify-email", "/auth/verify-email"])(
    "removes only the token with replace after confirmed success at %s",
    async (path) => {
      vi.mocked(authService.verifyEmail).mockResolvedValue(user);
      const url =
        path + "?token=opaque%2Btoken%2F&redirect=%2Fdashboard&invitation=unverified-marker";
      const router = setup(url, ["/before", url]);
      expect(authService.verifyEmail).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: content.verify }));
      expect(await screen.findByRole("status")).toHaveTextContent(content.verified);
      expect(authService.verifyEmail).toHaveBeenCalledExactlyOnceWith("opaque+token/");
      const params = new URLSearchParams(router.state.location.search);
      expect(params.has("token")).toBe(false);
      expect(params.get("redirect")).toBe("/dashboard");
      expect(params.get("invitation")).toBe("unverified-marker");
      await act(async () => router.navigate(-1));
      expect(screen.getByText("Before verification")).toBeInTheDocument();
    },
  );
  it("rejects duplicate token parameters rather than choosing one", () => {
    setup("/verify-email?token=one&token=two");
    expect(screen.getByRole("alert")).toHaveTextContent(content.invalidLink);
    expect(authService.verifyEmail).not.toHaveBeenCalled();
  });
  it("keeps a failed token in the URL for explicit recovery", async () => {
    vi.mocked(authService.verifyEmail).mockRejectedValue(new Error("fixture"));
    const router = setup("/verify-email?token=one");
    fireEvent.click(screen.getByRole("button", { name: content.verify }));
    await screen.findByRole("alert");
    expect(new URLSearchParams(router.state.location.search).get("token")).toBe("one");
  });
  it("does not show or publish an old response after navigating to another token", async () => {
    let resolve!: (value: typeof user) => void;
    vi.mocked(authService.verifyEmail).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const router = setup("/verify-email?token=old");
    fireEvent.click(screen.getByRole("button", { name: content.verify }));
    await screen.findByRole("button", { name: content.pending });
    await act(async () => router.navigate("/verify-email?token=new"));
    expect(screen.getByRole("button", { name: content.verify })).toBeEnabled();
    await act(async () => resolve(user));
    expect(new URLSearchParams(router.state.location.search).get("token")).toBe("new");
    expect(screen.queryByText(content.verified)).not.toBeInTheDocument();
    expect(authService.verifyEmail).toHaveBeenCalledExactlyOnceWith("old");
  });
  it("does not carry success to a later invalid link or recovery view", async () => {
    vi.mocked(authService.verifyEmail).mockResolvedValue(user);
    const router = setup("/verify-email?token=first");
    fireEvent.click(screen.getByRole("button", { name: content.verify }));
    await screen.findByRole("status");
    await act(async () => router.navigate("/verify-email?token="));
    expect(screen.getByRole("alert")).toHaveTextContent(content.invalidLink);
    await act(async () => router.navigate("/auth/verify-email"));
    expect(screen.queryByText(content.verified)).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Email nhận liên kết" })).toBeInTheDocument();
  });
});
