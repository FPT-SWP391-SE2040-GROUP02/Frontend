import { useAppDispatch, useAppSelector } from "@/app/store";
import { toAuthUserViewModel } from "@/entities/user/lib/adapters";
import { clearCredentials, setHydrating, setUser } from "@/entities/user/model/authSlice";
import { sessionAuthService } from "@/features/auth/api/authService";
import {
  AUTH_CHANGE_CHANNEL,
  AUTH_TAB_ID,
  canRestoreSession,
  invalidateAuthSession,
  runAuthTransition,
} from "@/features/auth/model/authTransitions";
import { authKeys } from "@/features/auth/model/useAuth";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { subscribeSessionFailure } from "@/shared/api/sessionFailure";
import { APP_MESSAGES, HTTP_STATUS } from "@/shared/constants";
import { Button } from "@/shared/ui/button";
import { isCancelledError, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useEffect, useState, type ReactNode } from "react";

/** Restore raw Bearer session; Query cache chỉ giữ user, không giữ credential. */
export function AuthBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const user = useAppSelector((state) => state.auth.user);
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
      } finally {
        if (mounted) dispatch(setHydrating(false));
      }
    }
    void hydrate();
    return () => {
      mounted = false;
    };
  }, [dispatch, queryClient, attempt]);

  // Đồng bộ phiên đa trình duyệt: kiểm tra tính hợp lệ khi tab hiển thị lại hoặc định kỳ 10 giây
  useEffect(() => {
    if (!user || !accessTokenMemory.get()) return;

    let inFlight = false;
    const checkActiveSession = async () => {
      if (inFlight || !accessTokenMemory.get()) return;
      inFlight = true;
      try {
        await sessionAuthService.getSession();
      } catch {
        // Lỗi 401 SESSION_EXPIRED từ server (do thiết bị khác đã thu hồi toàn bộ phiên)
        // sẽ tự động kích hoạt reportSessionFailure trong axios interceptor -> resetSession().
      } finally {
        inFlight = false;
      }
    };

    const intervalId = window.setInterval(() => {
      void checkActiveSession();
    }, 10_000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkActiveSession();
      }
    };
    const handleFocus = () => {
      void checkActiveSession();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user]);

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
