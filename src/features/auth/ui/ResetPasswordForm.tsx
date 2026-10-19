import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { clearCredentials } from "@/entities/user/model/authSlice";
import {
  invalidateAuthSession,
  notifyAuthChange,
  runAuthTransition,
} from "../model/authTransitions";
import { passwordRecoveryService } from "../api/passwordRecoveryService";
import { passwordRecoveryFeedback } from "../lib/passwordRecoveryFeedback";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import {
  RESET_PASSWORD_CONTENT as content,
  resetPasswordSchema,
  type ResetPasswordInput,
} from "../model/resetPassword.schema";

/** Submit chủ động; password/token chỉ ở form/closure, không vào MutationCache. */
export function ResetPasswordForm({
  token,
  onCompleted,
}: {
  token: string;
  onCompleted: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<ReturnType<typeof passwordRecoveryFeedback> | null>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  const client = useQueryClient();
  const dispatch = useDispatch();
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const {
    register,
    handleSubmit,
    trigger,
    reset,
    formState: { errors, touchedFields },
  } = useForm<ResetPasswordInput>({
    mode: "onBlur",
    reValidateMode: "onBlur",
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  async function submit(input: ResetPasswordInput) {
    if (busy.current || failure?.invalidToken) return;
    busy.current = true;
    setPending(true);
    setFailure(null);
    try {
      await runAuthTransition(
        () => passwordRecoveryService.reset(token, input),
        async (_, current) => {
          await client.cancelQueries();
          if (!current()) throw new Error("Auth context changed");
          invalidateAuthSession();
          dispatch(clearCredentials());
          client.clear();
          notifyAuthChange();
        },
      );
      if (mounted.current) {
        reset();
        setVisible(false);
        onCompleted();
      }
    } catch (error) {
      if (mounted.current) setFailure(passwordRecoveryFeedback(error));
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }
  return (
    <form
      noValidate
      onSubmit={(event) => {
        void handleSubmit(submit)(event);
      }}
      className="space-y-6"
    >
      {failure && (
        <p role="alert" className="text-sm text-destructive">
          {failure.message}
        </p>
      )}
      {failure?.invalidToken && (
        <Link
          to={ROUTES.AUTH.FORGOT_PASSWORD}
          className="inline-flex min-h-11 items-center underline"
        >
          {content.request}
        </Link>
      )}
      {(["password", "confirmPassword"] as const).map((field) => {
        const registeredField = register(field);
        const errorId = errors[field] ? `reset-${field}-error` : undefined;
        const describedBy =
          field === "password"
            ? ["reset-password-hint", errorId].filter(Boolean).join(" ")
            : errorId;

        return (
          <div key={field}>
            <label htmlFor={`reset-${field}`} className="mb-2 block text-sm font-medium">
              {field === "password" ? content.password : content.confirm}
            </label>
            <div className="relative">
              <Input
                id={`reset-${field}`}
                type={visible ? "text" : "password"}
                autoComplete="new-password"
                disabled={pending || failure?.invalidToken}
                className="h-12 pr-14 text-sm"
                aria-invalid={Boolean(errors[field])}
                aria-describedby={describedBy}
                {...registeredField}
                onBlur={async (event) => {
                  await registeredField.onBlur(event);
                  if (field === "password" && touchedFields.confirmPassword) {
                    await trigger("confirmPassword");
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="absolute right-1 top-1"
                aria-label={visible ? content.hide : content.show}
                aria-pressed={visible}
                disabled={pending}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </Button>
            </div>
            {errors[field] && (
              <p id={`reset-${field}-error`} role="alert" className="mt-2 text-sm text-red-700">
                {errors[field]?.message}
              </p>
            )}
          </div>
        );
      })}
      <p id="reset-password-hint" className="text-xs text-heritage-muted">
        {content.hint}
      </p>
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={pending || failure?.invalidToken}
      >
        {pending ? "Đang đặt lại mật khẩu…" : content.submit}
      </Button>
      <Link
        className="flex min-h-11 items-center justify-center text-sm font-medium underline underline-offset-4"
        to={ROUTES.AUTH.LOGIN}
      >
        {content.login}
      </Link>
    </form>
  );
}
