import { useEffect, useState, type ReactNode } from "react";
import { isAxiosError } from "axios";
import { useAppDispatch } from "@/app/store";
import { setUser, clearCredentials, setHydrating } from "@/entities/user/model/authSlice";
import { sessionAuthService } from "@/features/auth/api/authService";
import { authKeys } from "@/features/auth/model/useAuth";
import {
  canRestoreSession,
  runAuthTransition,
  invalidateAuthSession,
  AUTH_CHANGE_CHANNEL,
  AUTH_TAB_ID,
} from "@/features/auth/model/authTransitions";
import { toAuthUserViewModel } from "@/entities/user/lib/adapters";
import { isCancelledError, useQueryClient } from "@tanstack/react-query";
import { subscribeSessionFailure } from "@/shared/api/sessionFailure";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { APP_MESSAGES, HTTP_STATUS } from "@/shared/constants";
import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";

/** Restore raw Bearer session; Query cache chỉ giữ user, không giữ credential. */
export function AuthBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const resetSession = () => {
      invalidateAuthSession();
      dispatch(clearCredentials());
      void queryClient.cancelQueries();
      queryClient.clear();
    };
    const unsubscribe = subscribeSessionFailure(resetSession);
    if (typeof BroadcastChannel === "undefined") return unsubscribe;
    const channel = new BroadcastChannel(AUTH_CHANGE_CHANNEL);
    channel.onmessage = (event) => {
      const data: unknown = event.data;
      if (
        typeof data !== "object" ||
        data === null ||
        !("type" in data) ||
        data.type !== "invalidate" ||
        !("sender" in data) ||
        typeof data.sender !== "string" ||
        data.sender === AUTH_TAB_ID
      )
        return;
      resetSession();
    };
    return () => {
      channel.close();
      unsubscribe();
    };
  }, [dispatch, queryClient]);

  useEffect(() => {
    if (
      import.meta.env.DEV &&
      Object.values(ROUTES.PREVIEW).some((path) => path === window.location.pathname)
    ) {
      dispatch(setHydrating(false));
      return;
    }
    // Không xoay shared cookie tự động khi thiếu cross-tab lock. Manual login vẫn dùng được.
    if (!accessTokenMemory.get() && !canRestoreSession()) {
      dispatch(clearCredentials());
      return;
    }
    let mounted = true;
    dispatch(setHydrating(true));
    async function hydrate() {
      try {
        const response = await queryClient.fetchQuery({
          queryKey: authKeys.session(),
          queryFn: async () => {
            if (accessTokenMemory.get()) return { user: await sessionAuthService.getSession() };
            const session = await runAuthTransition(
              () => sessionAuthService.refresh(),
              (result) => {
                accessTokenMemory.set(result.accessToken);
              },
            );
            return { user: session.user };
          },
          staleTime: 5 * 60 * 1000,
          retry: false,
        });
        if (!mounted) return;
        setFailed(false);
        dispatch(setUser(toAuthUserViewModel(response.user)));
      } catch (error: unknown) {
        if (!mounted || isCancelledError(error)) return;
        accessTokenMemory.clear();
        dispatch(clearCredentials());
        setFailed(!(isAxiosError(error) && error.response?.status === HTTP_STATUS.UNAUTHORIZED));
      }
    }
    void hydrate();
    return () => {
      mounted = false;
    };
  }, [dispatch, queryClient, attempt]);

  return (
    <>
      {failed && (
        <div role="alert" className="flex items-center gap-3 bg-red-50 p-3 text-sm text-red-700">
          <span>Không thể khôi phục phiên. Bạn có thể thử lại hoặc đăng nhập.</span>
          <Button
            variant="outline"
            onClick={() => {
              setFailed(false);
              setAttempt((value) => value + 1);
            }}
          >
            {APP_MESSAGES.UI.RETRY}
          </Button>
        </div>
      )}
      {children}
    </>
  );
}
