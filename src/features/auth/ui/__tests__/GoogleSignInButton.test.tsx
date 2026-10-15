import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { invalidateAuthSession } from "../../model/authTransitions";
import { GoogleSignInButton } from "../GoogleSignInButton";

const env = vi.hoisted(() => ({ GOOGLE_CLIENT_ID: "web-client-id" }));
vi.mock("@/shared/config/env", () => ({ ENV: env }));

let callback: (response: unknown) => void;
const initialize = vi.fn((config: { callback: typeof callback }) => {
  callback = config.callback;
});
const renderButton = vi.fn();
function installSdk() {
  Object.defineProperty(window, "google", {
    configurable: true,
    value: { accounts: { id: { initialize, renderButton } } },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  env.GOOGLE_CLIENT_ID = "web-client-id";
  installSdk();
});
afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, "google");
  vi.useRealTimers();
});

describe("Google credential acquisition", () => {
  it("uses the public client ID and a random nonce, accepts only one pending credential", async () => {
    let complete!: () => void;
    const onCredential = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          complete = resolve;
        }),
    );
    const view = render(<GoogleSignInButton disabled={false} onCredential={onCredential} />);
    const config = initialize.mock.calls[0][0] as {
      callback: typeof callback;
      nonce: string;
      client_id: string;
    };
    expect(config.client_id).toBe("web-client-id");
    expect(config.nonce).toMatch(/^[0-9a-f-]{36}$/);
    expect(renderButton).toHaveBeenCalledOnce();
    act(() => {
      callback({ credential: "id-token" });
      callback({ credential: "duplicate" });
    });
    expect(onCredential).toHaveBeenCalledExactlyOnceWith("id-token", config.nonce);
    await act(async () => complete());
    view.rerender(<GoogleSignInButton disabled={true} onCredential={onCredential} />);
    act(() => callback({ credential: "while-password-pending" }));
    expect(onCredential).toHaveBeenCalledOnce();
    view.unmount();
    act(() => callback({ credential: "late-callback" }));
    expect(onCredential).toHaveBeenCalledOnce();
  });

  it("ignores callbacks after another tab invalidates auth and allows restarting", () => {
    const onCredential = vi.fn(async () => undefined);
    render(<GoogleSignInButton disabled={false} onCredential={onCredential} />);
    invalidateAuthSession();
    act(() => callback({ credential: "old-context" }));
    expect(onCredential).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại Google" }));
    act(() => callback({ credential: "fresh-context" }));
    expect(onCredential).toHaveBeenCalledOnce();
  });

  it("rejects malformed credentials without forwarding profile data", () => {
    const onCredential = vi.fn(async () => undefined);
    render(<GoogleSignInButton disabled={false} onCredential={onCredential} />);
    act(() => callback({ email: "untrusted@example.test" }));
    expect(onCredential).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("times out script loading, retries with a new script and ignores the old onload", () => {
    vi.useFakeTimers();
    Reflect.deleteProperty(window, "google");
    render(<GoogleSignInButton disabled={false} onCredential={vi.fn(async () => undefined)} />);
    const first = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    )!;
    expect(first).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(15_000));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    installSdk();
    fireEvent.load(first);
    expect(initialize).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại Google" }));
    expect(initialize).toHaveBeenCalledOnce();
    expect(first).not.toBeInTheDocument();
  });

  it("reports script errors and loads successfully on an explicit retry", () => {
    Reflect.deleteProperty(window, "google");
    render(<GoogleSignInButton disabled={false} onCredential={vi.fn(async () => undefined)} />);
    fireEvent.error(
      document.querySelector('script[src="https://accounts.google.com/gsi/client"]')!,
    );
    fireEvent.click(screen.getByRole("button", { name: "Thử lại Google" }));
    installSdk();
    fireEvent.load(document.querySelector('script[src="https://accounts.google.com/gsi/client"]')!);
    expect(initialize).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not load Google or acquire credentials when configuration is missing", () => {
    env.GOOGLE_CLIENT_ID = "";
    render(<GoogleSignInButton disabled={false} onCredential={vi.fn(async () => undefined)} />);
    expect(screen.getByRole("status")).toHaveTextContent("chưa được cấu hình");
    expect(initialize).not.toHaveBeenCalled();
    expect(
      document.querySelector('script[src="https://accounts.google.com/gsi/client"]'),
    ).toBeNull();
  });
});
