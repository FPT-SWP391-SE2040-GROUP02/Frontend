import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { authService } from "../api/authService";
import { getVerifyEmailFeedback } from "../lib/verifyEmailFeedback";
import {
  emailVerificationTokenSchema,
  VERIFY_EMAIL_CONTENT as content,
} from "../model/verifyEmail.schema";
import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";

/** Token chỉ thuộc card hiện tại; caller dùng key theo token để bỏ kết quả request cũ. */
export interface EmailVerificationCardProps {
  token: string;
  onVerified?: (email?: string) => void;
  className?: string;
}

/** Tự động kiểm tra và xác nhận email ngay khi người dùng bấm vào link; không ép bấm thêm nút thủ công. */
export function EmailVerificationCard({
  token,
  onVerified,
  className = "",
}: EmailVerificationCardProps) {
  const inFlight = useRef(false);
  const attempted = useRef(false);
  const mountedRef = useRef(true);
  const valid = emailVerificationTokenSchema.safeParse(token).success;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      const user = await authService.verifyEmail(token);
      if (!user.emailVerified) throw new Error("Verification response did not confirm email");
      return user;
    },
    retry: false,
    gcTime: 0,
    networkMode: "always",
  });

  const triggerVerification = useCallback(() => {
    if (inFlight.current || mutation.isPending) return;
    inFlight.current = true;
    mutation.mutate(undefined, {
      onSuccess: (user) => {
        if (!mountedRef.current) return;
        onVerified?.(user.email);
      },
      onSettled: () => {
        inFlight.current = false;
      },
    });
  }, [mutation, onVerified]);

  // Tự động kích hoạt xác minh ngay khi vào trang có token hợp lệ
  useEffect(() => {
    if (valid && !attempted.current) {
      attempted.current = true;
      triggerVerification();
    }
  }, [valid, triggerVerification]);

  const feedback = mutation.isError ? getVerifyEmailFeedback(mutation.error) : null;

  return (
    <section
      aria-labelledby="verify-email-title"
      className={`w-full space-y-5 text-left ${className}`}
    >
      <h1 id="verify-email-title" className="font-serif text-2xl font-bold text-[#0B291E]">
        {content.title}
      </h1>

      {!valid ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {content.invalidLink}
        </div>
      ) : mutation.isPending ? (
        <div className="flex items-center gap-3 rounded-xl border border-heritage-border bg-heritage-surface p-4 text-heritage-primary">
          <RefreshCw className="size-5 animate-spin text-heritage-gold" aria-hidden="true" />
          <span className="text-sm font-medium">Đang tiến hành xác minh liên kết của bạn...</span>
        </div>
      ) : mutation.isSuccess ? (
        <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold text-base">
            <CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" />
            <p role="status">{content.verified}</p>
          </div>
          <p className="text-sm text-emerald-900 leading-relaxed">{content.verifiedDescription}</p>
          <div className="pt-2">
            <Link
              to={`${ROUTES.AUTH.LOGIN}?verified=true${mutation.data?.email ? `&email=${encodeURIComponent(mutation.data.email)}` : ""}`}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0B291E] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#133E2B] focus-visible:outline-2 focus-visible:outline-[#B88E4C]"
            >
              Đăng nhập vào tài khoản ngay
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {feedback && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 leading-relaxed"
            >
              {feedback.message}
            </div>
          )}
          {feedback?.invalidToken !== true && (
            <Button
              type="button"
              disabled={mutation.isPending}
              onClick={triggerVerification}
              className="min-h-11 w-full"
            >
              {content.retry}
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-4 pt-2 text-sm">
        <Link
          to={ROUTES.AUTH.LOGIN}
          className="inline-flex min-h-11 items-center underline text-[#0B291E] font-medium"
        >
          {content.login}
        </Link>
        {!mutation.isSuccess && (
          <Link
            to={ROUTES.AUTH.VERIFY_EMAIL}
            className="inline-flex min-h-11 items-center underline text-heritage-muted"
          >
            {content.recover}
          </Link>
        )}
      </div>
    </section>
  );
}
