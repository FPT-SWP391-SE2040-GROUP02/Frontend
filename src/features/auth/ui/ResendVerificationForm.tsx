import { useForm } from "react-hook-form";
import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { useResendEmailVerification } from "../model/useAuth";
import {
  verificationEmailSchema,
  VERIFY_EMAIL_CONTENT as content,
} from "../model/verifyEmail.schema";
import { getRegisterErrorMessage } from "../lib/registerFeedback";
import { ROUTES } from "@/shared/config/routes.config";
import { useSuccessHold } from "@/shared/lib/useSuccessHold";
import { ActionButton } from "@/shared/ui/ActionButton";
import { buttonVariants } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

const schema = z.object({ email: verificationEmailSchema });

/** Phục hồi từ liên kết không có email; dùng resend hiện có và thông báo chống enumeration. */
export function ResendVerificationForm({ className = "" }: { className?: string }) {
  const inFlight = useRef(false);
  const mutation = useResendEmailVerification();
  const sent = useSuccessHold();
  // Còn bật sau khi mutation xong để nút kịp hiện dấu tích.
  const [sending, setSending] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { email: "" },
  });
  return (
    <form
      noValidate
      className={`space-y-4 ${className}`}
      onSubmit={(event) => {
        void handleSubmit(async ({ email }) => {
          if (inFlight.current || mutation.isPending || mutation.isSuccess) return;
          inFlight.current = true;
          setSending(true);
          try {
            await sent.hold(() => mutation.mutateAsync(email));
          } catch {
            /* Lỗi mutation được hiển thị inline bên dưới. */
          } finally {
            inFlight.current = false;
            setSending(false);
          }
        })(event);
      }}
    >
      <h1 className="font-serif text-2xl">{content.recover}</h1>
      <label htmlFor="verification-recovery-email" className="block text-sm font-medium">
        Email nhận liên kết
      </label>
      <Input
        id="verification-recovery-email"
        type="email"
        autoComplete="email"
        className="min-h-11"
        {...register("email", { onChange: () => mutation.reset() })}
        disabled={mutation.isPending}
        aria-invalid={Boolean(errors.email)}
        aria-describedby={errors.email ? "recovery-email-error" : undefined}
      />
      {errors.email && (
        <p id="recovery-email-error" role="alert" className="text-sm text-heritage-danger">
          {errors.email.message}
        </p>
      )}
      {mutation.isError && (
        <p role="alert" className="text-sm text-heritage-danger">
          {getRegisterErrorMessage(mutation.error)}
        </p>
      )}
      {mutation.isSuccess && (
        <p role="status" className="text-sm text-heritage-success">
          {content.resendAccepted}
        </p>
      )}
      <ActionButton
        type="submit"
        className={buttonVariants({ className: "min-h-11 w-full" })}
        pending={sending}
        done={sent.done}
        pendingLabel="Đang gửi…"
        doneLabel="Đã gửi"
        disabled={isSubmitting || mutation.isSuccess}
      >
        Gửi lại email
      </ActionButton>
      <Link to={ROUTES.AUTH.LOGIN} className="inline-flex min-h-11 items-center underline">
        {content.login}
      </Link>
    </form>
  );
}
