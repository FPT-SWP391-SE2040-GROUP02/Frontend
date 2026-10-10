import type { ReactNode } from "react";
import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NavLink } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";

/** Nhãn và thông báo của khu thử giao diện development. */
const CONTENT = {
  title: "Bản xem trước giao diện legacy",
  description: "Dữ liệu và nghiệp vụ mẫu đang chờ đồng bộ SRS mới. Các thao tác ghi bị vô hiệu hóa trong khu xem trước này.",
  navigation: "Chọn màn hình xem trước",
  blockedMutation: "Bản xem trước chỉ cho phép xem giao diện. Thao tác chưa được gửi.",
  links: [
    { to: ROUTES.PREVIEW.OWNER, label: "Tổng quan" },
    { to: ROUTES.PREVIEW.ASSETS, label: "Tài sản" },
    { to: ROUTES.PREVIEW.PLANS, label: "Kế hoạch" },
    { to: ROUTES.PREVIEW.PLAN_WIZARD, label: "Wizard cũ" },
    { to: ROUTES.PREVIEW.DMS, label: "Điểm danh" },
    { to: ROUTES.PREVIEW.EXECUTOR, label: "Người thực hiện" },
    { to: ROUTES.PREVIEW.VERIFIER, label: "Xét duyệt" },
  ],
} as const;

/** Cache preview độc lập, không kế thừa dữ liệu query hoặc mutation của phiên thật. */
const previewClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
  mutationCache: new MutationCache({
    /** Chặn trước mutationFn và onMutate của feature, kể cả khi caller tự bật nút. */
    onMutate: () => { throw new Error(CONTENT.blockedMutation); },
  }),
});

/** Props của lớp bao preview; không truyền session giả hoặc vai trò giả. */
interface PreviewWorkspaceProps {
  /** Trang legacy cần xem giao diện trong development. */
  children: ReactNode;
}

/**
 * @description Bao trang legacy trong cache chỉ đọc và nhãn development.
 * @param props Trang con được AppRoutes đăng ký riêng trong development.
 * @returns Thanh điều hướng preview và trang con; production không render trang con.
 * @example <PreviewWorkspace><AssetsManagementPage /></PreviewWorkspace>
 */
export function PreviewWorkspace({ children }: PreviewWorkspaceProps) {
  if (!import.meta.env.DEV) return null;

  return (
    <QueryClientProvider client={previewClient}>
      <aside aria-label={CONTENT.title} className="border-b border-heritage-gold-border bg-heritage-gold-light p-4 text-heritage-text">
        <p className="font-semibold">{CONTENT.title}</p>
        <p className="mt-1 text-sm">{CONTENT.description}</p>
        <nav aria-label={CONTENT.navigation} className="mt-3 flex flex-wrap gap-2">
          {CONTENT.links.map(({ to, label }) => (
            <NavLink key={to} to={to} end className={({ isActive }) =>
              `inline-flex min-h-11 items-center rounded-lg border px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-primary ${isActive ? "border-heritage-primary bg-heritage-primary text-heritage-surface" : "border-heritage-border bg-heritage-surface"}`
            }>{label}</NavLink>
          ))}
        </nav>
      </aside>
      {children}
    </QueryClientProvider>
  );
}
