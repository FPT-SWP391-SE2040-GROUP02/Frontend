import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { ExecutorInvitationPanel } from "@/features/plan-setup/ui/ExecutorInvitationPanel";
import { AppHeader } from "@/widgets/Header/AppHeader";
/** Public invitation landing; login is requested before responding. Fragment avoids HTTP/referrer token exposure. */
export function ExecutorInvitationPage() {
  const { hash } = useLocation();
  const token = new URLSearchParams(hash.slice(1)).get("token") ?? "";
  const userId = useSelector((state: { auth: AuthState }) => state.auth.user?.id);
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <h1 className="text-2xl font-semibold">Lời mời nhiệm vụ Executor</h1>
        <ExecutorInvitationPanel key={`${token}:${userId ?? "guest"}`} token={token} />
      </main>
    </>
  );
}
