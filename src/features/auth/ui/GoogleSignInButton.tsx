import { useEffect, useRef, useState } from "react";
import { cn } from "cn";
import { z } from "zod";
import { GoogleBusyPill } from "./GoogleBusyPill";
import { ENV } from "@/shared/config/env";
import { authService } from "../api/authService";
import { captureAuthContext } from "../model/authTransitions";
import { googleLoginRequestSchema } from "../model/googleAuth.schema";

interface GoogleIdentityApi {
  initialize(config: {
    client_id: string;
    nonce: string;
    auto_select: boolean;
    callback: (response: unknown) => void;
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, string | number>): void;
}

const credentialSchema = z.object({ credential: googleLoginRequestSchema.shape.idToken });

/** Nút GIS chính thức; credential/nonce chỉ RAM, callback cũ và trùng bị bỏ qua. */
export function GoogleSignInButton({
  disabled,
  onCredential,
  progress = null,
  busyLabel = "Đang kết nối…",
  doneLabel = "Đã đăng nhập",
}: {
  disabled: boolean;
  onCredential: (idToken: string, nonce: string) => Promise<void>;
  /** Sau khi chọn tài khoản: "busy" khi server đang xử lý, "done" khi xong; nút Google được thay bằng nút trạng thái. */
  progress?: "busy" | "done" | null;
  busyLabel?: string;
  doneLabel?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const latest = useRef({ disabled, onCredential });
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    latest.current = { disabled, onCredential };
  }, [disabled, onCredential]);

  useEffect(() => {
    if (!ENV.GOOGLE_CLIENT_ID) return;
    let active = true;
    let processing = false;
    let failed = false;
    const current = captureAuthContext();
    let script: HTMLScriptElement | undefined;
    const parent = container.current;
    // Nonce một lần do Backend phát; chỉ có sau khi tải xong, trước khi khởi tạo nút Google.
    let nonce = "";
    const fail = () => {
      failed = true;
      if (active) setStatus("error");
    };
    const timeout = window.setTimeout(fail, 15_000);
    const initialize = () => {
      if (!active || failed) return;
      window.clearTimeout(timeout);
      const api = (window as Window & { google?: { accounts?: { id?: GoogleIdentityApi } } }).google
        ?.accounts?.id;
      if (!api || !parent) return fail();
      try {
        api.initialize({
          client_id: ENV.GOOGLE_CLIENT_ID,
          nonce,
          auto_select: false,
          callback: (response) => {
            if (!active || failed || processing || latest.current.disabled) return;
            if (!current()) return fail();
            const parsed = credentialSchema.safeParse(response);
            if (!parsed.success) return fail();
            processing = true;
            void latest.current
              .onCredential(parsed.data.credential, nonce)
              .catch(fail)
              .finally(() => {
                processing = false;
              });
          },
        });
        parent.replaceChildren();
        api.renderButton(parent, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          locale: "vi",
          width: Math.min(
            320,
            Math.max(200, Math.floor(parent.getBoundingClientRect().width / 1.1)),
          ),
        });
        setStatus("ready");
      } catch {
        fail();
      }
    };
    const start = () => {
      if ("google" in window) initialize();
      else {
        script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.onload = initialize;
        script.onerror = fail;
        document.head.append(script);
      }
    };
    authService
      .getGoogleNonce()
      .then((value) => {
        if (!active || failed) return;
        nonce = value;
        start();
      })
      .catch(fail);
    return () => {
      active = false;
      window.clearTimeout(timeout);
      script?.remove();
      parent?.replaceChildren();
    };
  }, [attempt]);

  if (!ENV.GOOGLE_CLIENT_ID)
    return <p role="status">Đăng nhập Google chưa được cấu hình. Bạn có thể dùng email.</p>;

  return (
    <div className="space-y-2">
      <div className="relative">
        {/* GIS large cao 40px; phóng đồng đều để hit target đạt 44px. Đang xử lý thì chỉ ẩn, không gỡ nút. */}
        <div
          ref={container}
          inert={disabled || status !== "ready" || progress !== null}
          className={cn("u401-gis min-h-11", progress !== null && "invisible")}
          style={{ zoom: 1.1 }}
        />
        {progress !== null && (
          <div className="absolute inset-0 flex items-center justify-center">
            <GoogleBusyPill
              done={progress === "done"}
              busyLabel={busyLabel}
              doneLabel={doneLabel}
            />
          </div>
        )}
      </div>
      {status === "loading" && <p role="status">Đang tải đăng nhập Google...</p>}
      {status === "error" && (
        <div role="alert">
          <p>Không tải được đăng nhập Google. Vui lòng thử lại hoặc dùng email.</p>
          <button
            type="button"
            disabled={disabled}
            className="min-h-11 underline"
            onClick={() => {
              setStatus("loading");
              setAttempt((value) => value + 1);
            }}
          >
            Thử lại Google
          </button>
        </div>
      )}
    </div>
  );
}
