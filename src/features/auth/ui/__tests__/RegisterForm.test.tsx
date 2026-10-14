import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authService } from "../../api/authService";
import { RegisterForm } from "../RegisterForm";
import { ROUTES } from "@/shared/config/routes.config";
import { APP_MESSAGES } from "@/shared/constants";
vi.mock("../../api/authService", () => ({ authService: { register: vi.fn() } }));
const clients: QueryClient[] = [];
beforeEach(() => vi.resetAllMocks());
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
});
function Destination() {
  const location = useLocation();
  return (
    <p>
      {location.pathname}
      {location.search}
    </p>
  );
}
function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[ROUTES.AUTH.REGISTER]}>
        <Routes>
          <Route path={ROUTES.AUTH.REGISTER} element={<RegisterForm />} />
          <Route path={ROUTES.AUTH.VERIFY_EMAIL} element={<Destination />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  fireEvent.change(screen.getByLabelText("Họ và tên"), { target: { value: "Test User" } });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "user+invite@example.test" },
  });
  fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "Abcdefg!" } });
  fireEvent.change(screen.getByLabelText("Xác nhận mật khẩu"), { target: { value: "Abcdefg!" } });
  fireEvent.click(screen.getByRole("button", { name: "Tạo tài khoản" }));
}
describe("RegisterForm bodyless acceptance", () => {
  it("opens the verification notice with an encoded email after acceptance", async () => {
    vi.mocked(authService.register).mockResolvedValue(undefined);
    setup();
    expect(
      await screen.findByText(`${ROUTES.AUTH.VERIFY_EMAIL}?email=user%2Binvite%40example.test`),
    ).toBeInTheDocument();
    expect(authService.register).toHaveBeenCalledExactlyOnceWith({
      email: "user+invite@example.test",
      fullName: "Test User",
      password: "Abcdefg!",
      confirmPassword: "Abcdefg!",
    });
  });
  it("keeps the form and allows retry after failure", async () => {
    vi.mocked(authService.register).mockRejectedValue(new Error("private failure"));
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent(APP_MESSAGES.ERROR.DEFAULT);
    expect(screen.getByRole("button", { name: "Tạo tài khoản" })).toBeEnabled();
    expect(screen.getByLabelText("Email")).toHaveValue("user+invite@example.test");
  });
  it("disables fields and duplicate submissions while pending", async () => {
    vi.mocked(authService.register).mockReturnValue(new Promise<void>(() => {}));
    setup();
    const button = await screen.findByRole("button", { name: "Đang khởi tạo tài khoản..." });
    expect(button).toBeDisabled();
    expect(screen.getByLabelText("Email")).toBeDisabled();
    fireEvent.click(button);
    await waitFor(() => expect(authService.register).toHaveBeenCalledTimes(1));
  });
});
