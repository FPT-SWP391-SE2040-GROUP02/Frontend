import { Link, useLocation, useSearchParams } from "react-router-dom";
import { WorkspaceFrame } from "@/widgets/WorkspaceFrame/WorkspaceFrame";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { ROUTES } from "@/shared/config/routes.config";
import { ADMIN_UI_CONTENT as content } from "./model/admin.content";

/** UI quản trị: dữ liệu mẫu chỉ hiển thị ở preview, không thay đổi quyền/tài khoản. */
export function AdminWorkspacePage() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const preview = import.meta.env.DEV && location.pathname.startsWith("/preview/");
  const requested =
    params.get("view") ??
    (location.pathname === ROUTES.ADMIN.AUDIT_LOG
      ? "audit"
      : location.pathname === ROUTES.DASHBOARD.USERS
        ? "users"
        : "overview");
  const view = content.tabs.find((item) => item.id === requested)?.id ?? "overview";
  const search = params.get("search") ?? "";
  const filtered = content.userRows.filter((item) =>
    `${item.name} ${item.role} ${item.status}`
      .toLocaleLowerCase("vi-VN")
      .includes(search.toLocaleLowerCase("vi-VN")),
  );
  // TODO: [BẢN THIẾT KẾ THỰC THI - DEVELOPER BLUEPRINT]
  // 1. [MỤC TIÊU]: Quản trị người dùng và tra cứu audit log theo quyền Admin.
  // 2. [INPUT & OUTPUT]: Phiên Admin và bộ lọc URL -> DTO phân trang/thống kê/audit.
  // 3. [CÁC BƯỚC]: Chốt contract; tạo service/hooks; áp dụng bộ lọc; xử lý 4 trạng thái;
  //    xác nhận trước thay đổi quyền; chỉ cập nhật cache sau backend xác nhận.
  // 4. [HÀM / THƯ VIỆN]: createBaseService, TanStack Query, Zod, useSearchParams.
  // 5. [ĐIỀU KIỆN BIÊN]: Mất quyền, dữ liệu rỗng, 429/500; không lộ bí mật trong audit;
  //    không lấy quyền Admin hoặc dữ liệu người dùng từ URL.
  return (
    <WorkspaceFrame
      title={content.title}
      description={content.description}
      preview={preview}
      role="admin"
      active={view}
      navigation={content.tabs.map((item) => ({ ...item, to: `?view=${item.id}` }))}
    >
      <nav aria-label={content.nav} className="flex flex-wrap gap-2">
        {content.tabs.map((item) => (
          <Link
            key={item.id}
            to={`?view=${item.id}`}
            aria-current={view === item.id ? "page" : undefined}
            className={`flex min-h-11 items-center rounded-xl border px-4 text-sm ${view === item.id ? "border-heritage-primary bg-heritage-primary text-white" : "border-heritage-border bg-heritage-surface"}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {!preview ? (
        <section className="rounded-2xl border border-heritage-border bg-heritage-surface p-8">
          <h2 className="text-xl font-semibold">{content.noData}</h2>
          <p className="mt-3 text-sm leading-7 text-heritage-muted">{content.noDataDetail}</p>
        </section>
      ) : (
        <>
          {view === "overview" && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                {content.stats.map((item) => (
                  <section
                    key={item.label}
                    className="rounded-2xl border border-heritage-border bg-heritage-surface p-6"
                  >
                    <p className="text-sm text-heritage-muted">{item.label}</p>
                    <p className="mt-3 text-3xl font-semibold">{item.value}</p>
                  </section>
                ))}
              </div>
              <section className="rounded-2xl border border-heritage-border bg-heritage-surface p-8">
                <h2 className="text-xl font-semibold">{content.health}</h2>
                <p className="mt-3 text-sm leading-7 text-heritage-muted">{content.healthDetail}</p>
              </section>
            </>
          )}
          {view === "users" && (
            <section className="min-w-0 rounded-2xl border border-heritage-border bg-heritage-surface p-5 sm:p-8">
              <h2 className="text-xl font-semibold">{content.users}</h2>
              <label htmlFor="admin-user-search" className="mb-2 mt-5 block text-sm">
                {content.search}
              </label>
              <Input
                id="admin-user-search"
                type="search"
                value={search}
                className="mb-6 h-12 max-w-md"
                onChange={(event) => {
                  const next = new URLSearchParams(params);
                  next.set("search", event.target.value);
                  setParams(next, { replace: true });
                }}
              />
              <Table>
                <TableHeader>
                  <TableRow>
                    {content.columns.map((column) => (
                      <TableHead key={column}>{column}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.role}</TableCell>
                      <TableCell>{item.status}</TableCell>
                      <TableCell>
                        <Button size="lg" variant="outline" disabled title={content.disabled}>
                          {content.edit}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filtered.length === 0 && (
                <p role="status" className="py-6 text-sm text-heritage-muted">
                  {content.empty}
                </p>
              )}
            </section>
          )}
          {view === "audit" && (
            <section className="min-w-0 rounded-2xl border border-heritage-border bg-heritage-surface p-5 sm:p-8">
              <h2 className="mb-6 text-xl font-semibold">{content.audit}</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    {content.auditColumns.map((column) => (
                      <TableHead key={column}>{column}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {content.auditRows.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.time}</TableCell>
                      <TableCell>{item.event}</TableCell>
                      <TableCell>{item.id}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-5 text-xs leading-6 text-heritage-muted">{content.note}</p>
            </section>
          )}
        </>
      )}
    </WorkspaceFrame>
  );
}
