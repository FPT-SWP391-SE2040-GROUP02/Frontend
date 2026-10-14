import { APP_MESSAGES } from "@/shared/constants";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AxiosError } from "axios";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authService } from "../../api/authService";
import { VERIFY_EMAIL_CONTENT } from "../../model/verifyEmail.schema";
import { VerifyEmailNotice } from "../VerifyEmailNotice";

vi.mock("../../api/authService", () => ({
  authService: {
    resendVerificationEmail: vi.fn(),
  },
}));

const EMAIL = "owner@example.com";
const clients: QueryClient[] = [];

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  cleanup();

  for (const client of clients) {
    client.clear();
  }

  clients.length = 0;
});

/**
 * @description Render thông báo với React Query và router thật.
 * @returns Kết quả render để kiểm tra giao diện.
 */
function setup() {
  const client = new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
    },
  });

  clients.push(client);

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <VerifyEmailNotice email={EMAIL} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("VerifyEmailNotice resend feedback", () => {
  it("hiện thông báo tiếp nhận và khóa nút khi success là true", async () => {
    vi.mocked(authService.resendVerificationEmail).mockResolvedValue({
      success: true,
    });

    setup();

    fireEvent.click(screen.getByRole("button", { name: "Gửi lại email" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      VERIFY_EMAIL_CONTENT.resendAccepted,
    );

    expect(screen.getByRole("button", { name: /Gửi lại sau/ })).toBeDisabled();

    expect(authService.resendVerificationEmail).toHaveBeenCalledTimes(1);
    expect(authService.resendVerificationEmail).toHaveBeenCalledWith(EMAIL);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("hiện lỗi và cho thử lại khi success là false", async () => {
    vi.mocked(authService.resendVerificationEmail).mockResolvedValue({
      success: false,
    });

    setup();

    fireEvent.click(screen.getByRole("button", { name: "Gửi lại email" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(APP_MESSAGES.ERROR.DEFAULT);

    expect(screen.getByRole("button", { name: "Gửi lại email" })).toBeEnabled();

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Gửi lại sau/ })).not.toBeInTheDocument();

    expect(authService.resendVerificationEmail).toHaveBeenCalledTimes(1);
  });

  it("hiện lỗi mạng và cho người dùng chủ động thử lại", async () => {
    vi.mocked(authService.resendVerificationEmail).mockRejectedValue(
      new AxiosError("Network Error", AxiosError.ERR_NETWORK),
    );

    setup();

    fireEvent.click(screen.getByRole("button", { name: "Gửi lại email" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(APP_MESSAGES.ERROR.NETWORK);

    expect(screen.getByRole("button", { name: "Gửi lại email" })).toBeEnabled();

    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    expect(screen.queryByRole("button", { name: /Gửi lại sau/ })).not.toBeInTheDocument();

    expect(authService.resendVerificationEmail).toHaveBeenCalledTimes(1);
  });

  it("khóa nút trong lúc gửi và không gọi service lần hai", async () => {
    vi.mocked(authService.resendVerificationEmail).mockReturnValue(
      new Promise<{ success: boolean }>(() => {}),
    );

    setup();

    fireEvent.click(screen.getByRole("button", { name: "Gửi lại email" }));

    const pendingButton = await screen.findByRole("button", {
      name: "Đang gửi...",
    });

    expect(pendingButton).toBeDisabled();

    fireEvent.click(pendingButton);

    expect(authService.resendVerificationEmail).toHaveBeenCalledTimes(1);
    expect(authService.resendVerificationEmail).toHaveBeenCalledWith(EMAIL);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
