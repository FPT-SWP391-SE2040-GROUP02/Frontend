import { Outlet } from "react-router-dom";
import { Header } from "@/widgets/header/Header";
import { Sidebar } from "@/widgets/sidebar/Sidebar";

/**
 * @description DashboardLayout dành cho khu vực quản trị nội bộ (Admin / Staff).
 * Tích hợp thanh Header và thanh Sidebar điều hướng.
 */
export function DashboardLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header showSidebarToggle={true} />
      <div className="flex-1 flex">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
