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
function setup(token: string | null = null) {
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
        <VerifyEmailNotice email={EMAIL} token={token} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("VerifyEmailNotice resend feedback", () => {
  it("hiện thông báo tiếp nhận và khóa nút với response không có body", async () => {
    vi.mocked(authService.resendVerificationEmail).mockResolvedValue(undefined);

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

  it("hiện lỗi và cho thử lại khi request bị từ chối", async () => {
    vi.mocked(authService.resendVerificationEmail).mockRejectedValue(new Error("request rejected"));

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
    vi.mocked(authService.resendVerificationEmail).mockReturnValue(new Promise<void>(() => {}));

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

describe("VerifyEmailNotice token scaffold", () => {
  it.each(["", " ", "x".repeat(257)])(
    "shows an invalid-link error for an invalid token",
    (token) => {
      setup(token);
      expect(screen.getByRole("alert")).toHaveTextContent("Liên kết xác minh không hợp lệ");
      expect(authService.resendVerificationEmail).not.toHaveBeenCalled();
      expect(screen.queryByRole("button", { name: "Gửi lại email" })).not.toBeInTheDocument();
    },
  );
  it("does not claim success or submit a token from a URL automatically", () => {
    setup("opaque-fixture-token");
    expect(screen.getByRole("alert")).toHaveTextContent("chưa khả dụng");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(authService.resendVerificationEmail).not.toHaveBeenCalled();
  });
});
