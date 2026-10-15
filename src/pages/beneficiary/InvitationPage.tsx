import { useParams, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { AppHeader } from "@/widgets/Header/AppHeader";
import { InvitationPanel } from "@/features/handover/ui/InvitationPanel";
/** Landing công khai của đường dẫn email Handover. */
export function InvitationPage() {
  const { token } = useParams();
  const [params] = useSearchParams();
  const userId = useSelector((state: { auth: AuthState }) => state.auth.user?.id);
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <h1 className="text-2xl font-semibold">Lời mời tiếp nhận</h1>
        <InvitationPanel key={`${token ?? params.get("token") ?? ""}:${userId ?? "guest"}`} />
      </main>
    </>
  );
}
