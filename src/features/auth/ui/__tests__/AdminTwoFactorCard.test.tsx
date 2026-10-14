import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { APP_MESSAGES } from "@/shared/constants";
import { useTwoFactorVerify } from "../../model/useAuth";
import { AdminTwoFactorCard } from "../AdminTwoFactorCard";

vi.mock("../../model/useAuth", () => ({ useTwoFactorVerify: vi.fn() }));
const mutate = vi.fn();
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

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
  return screen.getAllByRole("textbox");
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
    expect(mutate).toHaveBeenCalledWith({ code: "012345" }, expect.any(Object));
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
});
