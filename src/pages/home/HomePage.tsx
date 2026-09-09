import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { ROUTES } from "@/shared/config/routes.config";
import { Layers, ShieldCheck, Zap, ArrowRight } from "lucide-react";

/**
 * @description Trang chủ mặc định giới thiệu dự án SWP391 và kiến trúc FSD.
 */
export function HomePage() {
  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <section className="text-center space-y-4 py-8 md:py-16">
        <div className="flex justify-center">
          <Badge variant="secondary" className="gap-1.5 py-1 px-3">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            SWP391 Boilerplate Ready
          </Badge>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-foreground">
          Nền Tảng Đồ Án <span className="text-primary">SWP391</span>
        </h1>
        <p className="max-w-2xl mx-auto text-muted-foreground text-base sm:text-lg">
          Kiến trúc Feature-Sliced Design (FSD), chuẩn C# ASP.NET Core Backend, giao diện Shadcn UI + Tailwind CSS v4 và tiêu chuẩn UI/UX Pro Max.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link to={ROUTES.DASHBOARD.ROOT}>
            <Button size="lg" className="gap-2">
              Vào Dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to={ROUTES.AUTH.LOGIN}>
            <Button size="lg" variant="outline">
              Trang Đăng Nhập
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="grid gap-6 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
              <Layers className="h-5 w-5" />
            </div>
            <CardTitle>Kiến Trúc FSD</CardTitle>
            <CardDescription>
              Phân tầng 6 lớp nghiêm ngặt, chia nhỏ module theo tính năng nghiệp vụ, dễ mở rộng và bảo trì.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <CardTitle>Zero Hardcoding & JSDoc</CardTitle>
            <CardDescription>
              Toàn bộ hằng số, thông điệp, mã HTTP được chuẩn hóa; tài liệu JSDoc đầy đủ cho 100% mã nguồn.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
              <Zap className="h-5 w-5" />
            </div>
            <CardTitle>Sẵn Sàng Mở Rộng</CardTitle>
            <CardDescription>
              Tích hợp sẵn React Query v5, Redux Toolkit, Zod validation và Base CRUD Service cho C# Backend.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}
