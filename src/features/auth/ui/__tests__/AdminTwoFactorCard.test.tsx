import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APP_MESSAGES } from "@/shared/constants";
import { useTwoFactorVerify } from "../../model/useAuth";
import { twoFactorChallengeMemory } from "../../model/twoFactorChallenge";
import { AdminTwoFactorCard } from "../AdminTwoFactorCard";

vi.mock("../../model/useAuth", () => ({ useTwoFactorVerify: vi.fn() }));
const mutate = vi.fn();
beforeEach(() => {
  twoFactorChallengeMemory.set({
    twoFactorRequired: true,
    challengeToken: "challenge",
    expiresIn: 300,
  });
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  twoFactorChallengeMemory.clear();
});

function problem(status: number, code: string) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("x", undefined, config, undefined, {
    status,
    statusText: "",
    headers: {},
    config,
    data: { code },
  });
}

function setup(pending = false, error: Error | null = null) {
  vi.mocked(useTwoFactorVerify).mockReturnValue({
    mutate,
    isPending: pending,
    isError: error !== null,
    error,
  } as unknown as ReturnType<typeof useTwoFactorVerify>);
  render(
    <MemoryRouter>
      <AdminTwoFactorCard />
    </MemoryRouter>,
  );
  return screen.queryAllByRole("textbox");
}
function paste(input: HTMLElement, text: string) {
  fireEvent.paste(input, { clipboardData: { getData: () => text } });
}

describe("AdminTwoFactorCard", () => {
  it("clears stale digits on short paste and preserves a leading zero", () => {
    const inputs = setup();
    paste(inputs[0], "123456");
    paste(inputs[0], "09");
    expect(inputs.map((input) => (input as HTMLInputElement).value)).toEqual([
      "0",
      "9",
      "",
      "",
      "",
      "",
    ]);
    expect(screen.getByRole("button", { name: "Xác nhận" })).toBeDisabled();
    expect(inputs[2]).toHaveFocus();
    paste(inputs[0], "012345");
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    expect(mutate).toHaveBeenCalledWith("012345", expect.any(Object));
  });
  it("spreads a whole code autofilled into the first box across all boxes", () => {
    const inputs = setup();
    fireEvent.change(inputs[0], { target: { value: "086041" } });
    expect(inputs.map((input) => (input as HTMLInputElement).value).join("")).toBe("086041");
    expect(inputs[5]).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    expect(mutate).toHaveBeenCalledWith("086041", expect.any(Object));
  });
  it("still replaces a single digit when typing over it", () => {
    const inputs = setup();
    fireEvent.change(inputs[0], { target: { value: "1" } });
    fireEvent.change(inputs[0], { target: { value: "12" } });
    expect((inputs[0] as HTMLInputElement).value).toBe("2");
  });
  it("moves back from an empty digit and filters non-numeric input", () => {
    const inputs = setup();
    fireEvent.change(inputs[0], { target: { value: "x" } });
    expect(inputs[0]).toHaveValue("");
    fireEvent.keyDown(inputs[1], { key: "Backspace" });
    expect(inputs[0]).toHaveFocus();
  });
  it("blocks submission and editing while pending", () => {
    const inputs = setup(true);
    for (const input of inputs) expect(input).toBeDisabled();
    fireEvent.submit(inputs[0].closest("form")!);
    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Đang xác thực..." })).toBeDisabled();
  });
  it("does not expose raw operation errors", () => {
    setup(false, new Error("private backend details"));
    expect(screen.getByRole("alert")).toHaveTextContent(APP_MESSAGES.ERROR.DEFAULT);
    expect(screen.queryByText("private backend details")).not.toBeInTheDocument();
  });
  it("tells the Admin the code was wrong without ending the challenge", () => {
    const inputs = setup(false, problem(401, "INVALID_TWO_FACTOR_CODE"));
    expect(screen.getByRole("alert")).toHaveTextContent(/Mã chưa đúng/);
    for (const input of inputs) expect(input).toBeEnabled();
  });
  it("locks the form and asks to sign in again when the challenge is gone", () => {
    const inputs = setup(false, problem(401, "TWO_FACTOR_CHALLENGE_INVALID"));
    expect(screen.getByRole("alert")).toHaveTextContent(/đăng nhập lại/);
    for (const input of inputs) expect(input).toBeDisabled();
    fireEvent.submit(inputs[0].closest("form")!);
    expect(mutate).not.toHaveBeenCalled();
  });
  it("cannot submit without a challenge held in memory (for example after a reload)", () => {
    twoFactorChallengeMemory.clear();
    const inputs = setup();
    expect(screen.getByRole("alert")).toHaveTextContent(/Chưa có phiên xác thực/);
    paste(inputs[0], "012345");
    fireEvent.submit(inputs[0].closest("form")!);
    expect(mutate).not.toHaveBeenCalled();
  });
  it("switches to a recovery code and submits it as typed", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Dùng mã khôi phục" }));
    const field = screen.getByLabelText("Mã khôi phục");
    expect(screen.getByRole("button", { name: "Xác nhận" })).toBeDisabled();
    fireEvent.change(field, { target: { value: "ab12cd-34ef56" } });
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    expect(mutate).toHaveBeenCalledWith("ab12cd-34ef56", expect.any(Object));
  });
});
