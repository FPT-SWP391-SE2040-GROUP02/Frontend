const planLabels: Record<string, { title: string; description: string }> = {
  DRAFT: {
    title: "Kế hoạch đang được chuẩn bị",
    description: "Hoàn thiện các điều kiện bên dưới trước khi kích hoạt kế hoạch bàn giao.",
  },
  ACTIVE: {
    title: "Kế hoạch đang hoạt động",
    description: "Tiếp tục sắp xếp kho và điểm danh theo lịch của bạn.",
  },
  CHECKIN_OVERDUE: {
    title: "Bạn đã quá hạn điểm danh",
    description: "Kiểm tra kỳ điểm danh và xác nhận hoạt động của bạn.",
  },
  AWAITING_CHECK: {
    title: "Kế hoạch đang chờ kiểm tra",
    description: "Theo dõi thông báo và trạng thái được cập nhật từ hệ thống.",
  },
  DEATH_CASE_OPEN: {
    title: "Kho có hồ sơ chứng tử đang xử lý",
    description: "Đọc cảnh báo bên trên. Nếu bạn vẫn còn sống, hãy báo ngay bằng nút Tôi còn sống.",
  },
  HANDOVER_IN_PROGRESS: {
    title: "Kế hoạch đang trong quá trình bàn giao",
    description: "Theo dõi hồ sơ và các thông báo liên quan đến kho của bạn.",
  },
  CLOSED: {
    title: "Kế hoạch đã đóng",
    description: "Kiểm tra thông tin kho và nhật ký để xem các cập nhật trước đó.",
  },
  BLOCKED: {
    title: "Kế hoạch đang bị chặn",
    description: "Kiểm tra thông báo của hệ thống trước khi thực hiện thao tác tiếp theo.",
  },
};

/** Chỉ mô tả trạng thái server; giá trị mới không bị biến thành trạng thái an toàn. */
export function presentOverviewPlan(status: string) {
  return (
    planLabels[status] ?? {
      title: "Cần kiểm tra trạng thái kế hoạch",
      description: "Mở trang kế hoạch bàn giao để xem thông tin chi tiết từ hệ thống.",
    }
  );
}

import { formatDate } from "@/shared/lib/dateFormat";

export function overviewDate(value: string | null | undefined): string {
  return formatDate(value);
}

/** Phần trăm chỉ dùng cho thanh dung lượng; không thay thế kiểm tra quota bằng byte. */
export function storagePercent(used: number, quota: number): number {
  if (quota <= 0) return 0;
  return Math.min(100, Math.max(0, (used / quota) * 100));
}
