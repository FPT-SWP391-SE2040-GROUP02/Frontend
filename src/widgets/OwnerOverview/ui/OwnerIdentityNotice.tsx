import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles, Notice } from "@/shared/ui/heritageKit";
import type { OverviewResources } from "../model/useOverviewResources";

/**
 * Dòng báo đầu Tổng quan: chưa xác minh danh tính thì nhắc, xác minh rồi thì ẩn hẳn.
 * Chỉ dựa vào điều kiện máy chủ trả về; chưa đọc được thì không hiện, không đoán.
 */
export function OwnerIdentityNotice({ data }: { data: OverviewResources }) {
  const setup = data.setup.data;
  if (!setup || !setup.missingRequirements.includes("OWNER_EKYC_REQUIRED")) return null;
  return (
    <Notice
      tone="warning"
      title="Bạn chưa xác minh danh tính"
      action={
        <Link className={buttonStyles.dark} to={ROUTES.DASHBOARD.IDENTITY}>
          Xác minh ngay
        </Link>
      }
    >
      Hoàn tất xác minh danh tính để chuẩn bị kích hoạt kế hoạch bàn giao.
    </Notice>
  );
}
