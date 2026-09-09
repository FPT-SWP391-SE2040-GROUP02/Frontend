import { ROLES, type Role } from "./roles";
import { STATUS, type Status } from "./status";


/**
 * @description Preset màu sắc và nhãn hiển thị cho từng Vai trò người dùng (Role).
 * Giúp tuân thủ Zero Hardcoding và Design Tokens đồng nhất toàn hệ thống.
 */
export const ROLE_STYLES: Record<Role, { badge: string; label: string }> = {
  [ROLES.ADMIN]: {
    badge: "bg-rose-500 hover:bg-rose-600 text-white border-transparent",
    label: "Quản trị viên",
  },
  [ROLES.STAFF]: {
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
    label: "Nhân viên",
  },
  [ROLES.CUSTOMER]: {
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    label: "Khách hàng",
  },
  [ROLES.GUEST]: {
    badge: "bg-muted text-muted-foreground border-border",
    label: "Khách",
  },
};

/**
 * @description Preset màu sắc và nhãn hiển thị cho Trạng thái nghiệp vụ thực thể (Status).
 */
export const STATUS_STYLES: Record<Status, { badge: string; label: string }> = {
  [STATUS.ACTIVE]: {
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    label: "Hoạt động",
  },
  [STATUS.INACTIVE]: {
    badge: "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30",
    label: "Ngừng hoạt động",
  },
  [STATUS.PENDING]: {
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    label: "Chờ duyệt",
  },
  [STATUS.APPROVED]: {
    badge: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30",
    label: "Đã duyệt",
  },
  [STATUS.REJECTED]: {
    badge: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
    label: "Từ chối",
  },
  [STATUS.CANCELLED]: {
    badge: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/30",
    label: "Đã hủy",
  },
  [STATUS.COMPLETED]: {
    badge: "bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-500/30",
    label: "Hoàn thành",
  },
  [STATUS.DRAFT]: {
    badge: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
    label: "Bản nháp",
  },
};

/**
 * @description Các class tiện ích bố cục (Layout & Transitions) dùng chung cho UI.
 */
export const LAYOUT_STYLES = {
  /** Căn giữa tuyệt đối flexbox */
  FLEX_CENTER: "flex items-center justify-center",
  /** Phân bổ 2 đầu flexbox */
  FLEX_BETWEEN: "flex items-center justify-between",
  /** Khung chứa trang chuẩn (Container) */
  PAGE_CONTAINER: "container mx-auto px-4 py-6 md:px-8 md:py-8",
  /** Hiệu ứng hover thẻ card */
  CARD_HOVER: "transition-all duration-200 hover:shadow-md hover:border-primary/30",
} as const;
