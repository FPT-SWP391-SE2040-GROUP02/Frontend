import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { HeritageAuthLayout } from "@/features/auth/ui/HeritageAuthLayout";
import { RequestPanel } from "@/features/handover-request";

/** Trang công khai của link riêng hoặc từ trang Nhận tài sản: người nhận gửi yêu cầu nhận tài sản kèm giấy tờ. */
export function RequestPage() {
  const [params] = useSearchParams();
  const userId = useSelector((state: { auth: AuthState }) => state.auth.user?.id);
  return (
    <HeritageAuthLayout
      sideTitle="Khi có việc xảy ra, bạn gửi yêu cầu nhận tài sản."
      sideSubtitle="Luật sư xét giấy tờ và lập biên bản bàn giao. Bạn chỉ nhận đúng phần ghi trong biên bản."
    >
      <h1 className="sr-only">Yêu cầu nhận tài sản</h1>
      <RequestPanel
        key={`${params.get("token") ?? ""}:${params.get("vaultId") ?? ""}:${userId ?? "guest"}`}
      />
    </HeritageAuthLayout>
  );
}
