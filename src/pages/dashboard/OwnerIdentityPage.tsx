import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { EkycStatusPanel } from "@/features/ekyc/ui/EkycStatusPanel";
import { ROUTES } from "@/shared/config/routes.config";

/** Luồng Chủ kho riêng; không dùng trang xác minh Người nhận hoặc suy diễn quyền từ URL. */
export function OwnerIdentityPage() {
  const client = useQueryClient();
  return (
    <OwnerWorkspace
      title="Xác minh danh tính"
      description="Xác minh giấy tờ và khuôn mặt để chuẩn bị kế hoạch bàn giao của bạn."
    >
      <Link
        to={ROUTES.DASHBOARD.ROOT}
        className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
      >
        ← Trở về Tổng quan
      </Link>
      <EkycStatusPanel
        purpose="OWNER_ENROLLMENT"
        turnId={null}
        onVerified={() => {
          void client.invalidateQueries({ queryKey: ["plan-setup"] });
          void client.invalidateQueries({ queryKey: ["owner-vault"] });
        }}
      />
    </OwnerWorkspace>
  );
}
