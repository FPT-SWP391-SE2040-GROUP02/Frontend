import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { ROUTES } from "@/shared/config/routes.config";
import { Compass } from "lucide-react";

/**
 * @description Màn hình lỗi 404 (Không tìm thấy trang).
 */
export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 animate-in fade-in-50">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
        <Compass className="h-10 w-10 animate-spin-slow" />
      </div>
      <h1 className="text-6xl font-black tracking-tight text-primary">404</h1>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
        Không tìm thấy trang yêu cầu
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Đường dẫn bạn vừa truy cập không tồn tại hoặc đã được di chuyển sang một vị trí khác.
      </p>
      <div className="mt-8 flex gap-3">
        <Link to={ROUTES.HOME}>
          <Button>Quay về trang chủ</Button>
        </Link>
      </div>
    </div>
  );
}
