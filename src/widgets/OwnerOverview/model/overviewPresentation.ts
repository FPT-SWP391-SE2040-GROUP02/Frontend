const planLabels: Record<string, { title: string; description: string }> = {
  DRAFT: {
    title: "Kế hoạch đang được chuẩn bị",
    description: "Hoàn thiện các điều kiện bên dưới trước khi kích hoạt kế hoạch bàn giao.",
  },
  ACTIVE: {
    title: "Kế hoạch đang hoạt động",
    description: "Tiếp tục sắp xếp kho. Khi cần, Người thực thi sẽ mở bàn giao.",
  },
  HANDOVER_REQUESTED: {
    title: "Kho đã mở bàn giao",
    description:
      "Người thực thi đã mở bàn giao, kho đang bị khóa trong lúc luật sư lập biên bản bàn giao.",
  },
  HANDOVER_IN_PROGRESS: {
    title: "Kế hoạch đang trong quá trình bàn giao",
    description: "Luật sư đã chốt biên bản. Người nhận đang xác minh, ký và nhận tài sản.",
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
