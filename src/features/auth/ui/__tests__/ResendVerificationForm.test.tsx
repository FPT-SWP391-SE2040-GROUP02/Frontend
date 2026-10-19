import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { authService } from "../../api/authService";
import { VerifyEmailNotice } from "../VerifyEmailNotice";
import { VERIFY_EMAIL_CONTENT as content } from "../../model/verifyEmail.schema";
vi.mock("../../api/authService", () => ({ authService: { resendVerificationEmail: vi.fn() } }));
let client: QueryClient;
beforeEach(() => {
  vi.resetAllMocks();
  client = new QueryClient();
});
afterEach(() => {
  cleanup();
  client.clear();
});
function setup() {
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <VerifyEmailNotice />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
describe("Email verification recovery", () => {
  it("blocks duplicate submissions while a request is in flight", async () => {
    let resolve!: () => void;
    vi.mocked(authService.resendVerificationEmail).mockReturnValue(
      new Promise<void>((done) => {
        resolve = done;
      }),
    );
    setup();
    const field = screen.getByRole("textbox", { name: "Email nhận liên kết" });
    fireEvent.change(field, { target: { value: "fixture@example.test" } });
    const button = screen.getByRole("button", { name: "Gửi lại email" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(await screen.findByRole("button", { name: "Đang gửi…" })).toBeDisabled();
    expect(field).toBeDisabled();
    expect(authService.resendVerificationEmail).toHaveBeenCalledTimes(1);
    await act(async () => resolve());
    await screen.findByText(content.resendAccepted);
  });
  it("validates the email and sends nothing for invalid input", async () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Gửi lại email" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(authService.resendVerificationEmail).not.toHaveBeenCalled();
  });
  it("accepts a bodyless 202 without disclosing account existence", async () => {
    vi.mocked(authService.resendVerificationEmail).mockResolvedValue(undefined);
    setup();
    fireEvent.change(screen.getByRole("textbox", { name: "Email nhận liên kết" }), {
      target: { value: "fixture@example.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Gửi lại email" }));
    expect(await screen.findByRole("status")).toHaveTextContent(content.resendAccepted);
    expect(authService.resendVerificationEmail).toHaveBeenCalledExactlyOnceWith(
      "fixture@example.test",
    );
    expect(screen.getByRole("button", { name: "Gửi lại email" })).toBeDisabled();
  });
  it("preserves input and allows explicit retry on failure", async () => {
    vi.mocked(authService.resendVerificationEmail).mockRejectedValue(new Error("fixture"));
    setup();
    const field = screen.getByRole("textbox", { name: "Email nhận liên kết" });
    fireEvent.change(field, { target: { value: "fixture@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Gửi lại email" }));
    await screen.findByRole("alert");
    expect(field).toHaveValue("fixture@example.test");
    expect(screen.getByRole("button", { name: "Gửi lại email" })).toBeEnabled();
    expect(authService.resendVerificationEmail).toHaveBeenCalledTimes(1);
  });
});
