import { Outlet } from "react-router-dom";
import { Header } from "@/widgets/header/Header";
import { Footer } from "@/widgets/footer/Footer";

/**
 * @description MainLayout chuẩn dành cho trang công khai (Home, Blog, Giới thiệu...).
 */
export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 container px-4 py-8 md:px-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
