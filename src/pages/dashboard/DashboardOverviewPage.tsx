import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { AsyncState } from "@/shared/ui/AsyncState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Users, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";

/**
 * @description Màn hình tổng quan trang quản trị (Dashboard Overview).
 * Demo các thẻ thống kê tổng hợp và bảng dữ liệu mẫu có hỗ trợ AsyncState.
 * Tuân thủ Quy tắc 7: Logic gọi API dữ liệu thực tế đánh dấu // TODO để developer tự kết nối với backend.
 */
export function DashboardOverviewPage() {
  // TODO: 1. Sử dụng React Query hook (ví dụ useDashboardStats() hoặc useUsers()) để lấy dữ liệu thực tế từ backend C#
  // TODO: 2. Quản lý trạng thái phân trang, tìm kiếm qua useState hoặc URL search params
  const [isLoading] = useState<boolean>(false);
  const [error] = useState<Error | null>(null);

  // Dữ liệu mẫu minh họa giao diện ban đầu
  const sampleUsers = [
    { id: "1", name: "Nguyễn Văn A", email: "a@fpt.edu.vn", role: "Quản trị viên", status: "Hoạt động" },
    { id: "2", name: "Trần Thị B", email: "b@fpt.edu.vn", role: "Nhân viên", status: "Hoạt động" },
    { id: "3", name: "Lê Hoàng C", email: "c@fpt.edu.vn", role: "Khách hàng", status: "Chờ duyệt" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tổng Quan Quản Trị"
        description="Theo dõi các chỉ số hoạt động và dữ liệu mới nhất trong hệ thống."
        actions={<Button size="sm">+ Thêm bản ghi mới</Button>}
      />

      {/* Cards thống kê tóm tắt */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128.500.000 ₫</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500 inline" /> +12% so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Người dùng mới</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+245</div>
            <p className="text-xs text-muted-foreground mt-1">+18 thành viên tuần này</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đơn hàng</CardTitle>
            <ShoppingCart className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+1,204</div>
            <p className="text-xs text-muted-foreground mt-1">98% hoàn thành đúng hạn</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tỷ lệ tăng trưởng</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+24.8%</div>
            <p className="text-xs text-muted-foreground mt-1">Vượt mục tiêu quý</p>
          </CardContent>
        </Card>
      </div>

      {/* Bảng dữ liệu demo bọc trong AsyncState */}
      <Card>
        <CardHeader>
          <CardTitle>Danh Sách Người Dùng Gần Đây</CardTitle>
        </CardHeader>
        <CardContent>
          <AsyncState
            isLoading={isLoading}
            error={error}
            isEmpty={sampleUsers.length === 0}
            onRetry={() => {
              // TODO: Kích hoạt refetch dữ liệu khi người dùng bấm Thử lại
            }}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">#{user.id}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AsyncState>
        </CardContent>
      </Card>
    </div>
  );
}
