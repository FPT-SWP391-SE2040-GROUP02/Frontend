import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";
import { Link } from "react-router-dom";
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
  onVerified?: () => void;
  className?: string;
}

/** Xác minh thủ công; response này không cấp session hoặc thay user đang đăng nhập. */
export function EmailVerificationCard({
  token,
  onVerified,
  className = "",
}: EmailVerificationCardProps) {
  const inFlight = useRef(false);
  const valid = emailVerificationTokenSchema.safeParse(token).success;
  const mutation = useMutation({
    // Không đặt token trong mutation variables/query keys; closure chỉ thuộc card đang mở.
    mutationFn: async () => {
      const user = await authService.verifyEmail(token);
      if (!user.emailVerified) throw new Error("Verification response did not confirm email");
    },
    retry: false,
    gcTime: 0,
    networkMode: "always",
  });
  const feedback = mutation.isError ? getVerifyEmailFeedback(mutation.error) : null;
  return (
    <section
      aria-labelledby="verify-email-title"
      className={`w-full space-y-4 text-left ${className}`}
    >
      <h1 id="verify-email-title" className="font-serif text-2xl">
        {content.title}
      </h1>
      {!valid ? (
        <p role="alert" className="text-sm text-red-700">
          {content.invalidLink}
        </p>
      ) : mutation.isSuccess ? (
        <>
          <p role="status" className="text-sm text-emerald-700">
            {content.verified}
          </p>
          <p>{content.verifiedDescription}</p>
        </>
      ) : (
        <>
          <p className="text-sm text-heritage-muted">{content.ready}</p>
          {feedback && (
            <p role="alert" className="text-sm text-red-700">
              {feedback.message}
            </p>
          )}
          <Button
            type="button"
            disabled={mutation.isPending || feedback?.invalidToken === true}
            onClick={() => {
              if (inFlight.current || mutation.isPending) return;
              inFlight.current = true;
              mutation.mutate(undefined, {
                onSuccess: onVerified,
                onSettled: () => {
                  inFlight.current = false;
                },
              });
            }}
            className="min-h-11 w-full"
          >
            {mutation.isPending
              ? content.pending
              : mutation.isError
                ? content.retry
                : content.verify}
          </Button>
          {mutation.isPending && (
            <p role="status" className="sr-only">
              {content.pending}
            </p>
          )}
        </>
      )}
      <div className="flex flex-wrap gap-4">
        <Link to={ROUTES.AUTH.LOGIN} className="inline-flex min-h-11 items-center underline">
          {content.login}
        </Link>
        {!mutation.isSuccess && (
          <Link
            to={ROUTES.AUTH.VERIFY_EMAIL}
            className="inline-flex min-h-11 items-center underline"
          >
            {content.recover}
          </Link>
        )}
      </div>
    </section>
  );
}
