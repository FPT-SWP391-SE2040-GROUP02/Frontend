import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { ROUTES } from "@/shared/config/routes.config";
import { ShieldAlert } from "lucide-react";

/**
 * @description Màn hình lỗi 403 (Từ chối truy cập / Không đủ quyền hạn).
 */
export function ForbiddenPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 animate-in fade-in-50">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-6">
        <ShieldAlert className="h-10 w-10" />
      </div>
      <h1 className="text-6xl font-black tracking-tight text-destructive">403</h1>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
        Truy cập bị từ chối
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Tài khoản của bạn không có đủ quyền hạn để truy cập vào khu vực này. Vui lòng liên hệ Quản trị viên nếu cần cấp quyền.
      </p>
      <div className="mt-8 flex gap-3">
        <Link to={ROUTES.HOME}>
          <Button variant="outline">Quay về trang chủ</Button>
        </Link>
      </div>
    </div>
  );
}
