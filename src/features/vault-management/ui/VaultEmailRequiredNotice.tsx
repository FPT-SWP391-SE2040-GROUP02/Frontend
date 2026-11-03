import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles } from "@/shared/ui/heritageKit";

/**
 * Kho được tạo tự động khi vào dashboard; BE chỉ tạo cho tài khoản đã xác minh email (AC-01).
 * Hiện thay cho nội dung kho khi chưa xác minh, kèm lối sang trang xác minh/gửi lại liên kết.
 */
export function VaultEmailRequiredNotice() {
  return (
    <div
      role="status"
      className="rounded-xl border border-dashed border-heritage-border bg-heritage-surface px-6 py-12 text-center"
    >
      <MailCheck className="mx-auto mb-4 size-8 text-heritage-gold" aria-hidden="true" />
      <h2 className="text-base font-semibold">Xác minh email để mở kho di sản</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-heritage-muted">
        Kho của bạn sẽ được tạo tự động ngay sau khi email được xác minh.
      </p>
      <Link to={ROUTES.AUTH.VERIFY_EMAIL} className={`mt-5 ${buttonStyles.outline}`}>
        Xác minh email / gửi lại liên kết
      </Link>
    </div>
  );
}
