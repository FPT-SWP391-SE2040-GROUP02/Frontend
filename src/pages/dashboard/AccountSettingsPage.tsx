import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Monitor, ShieldCheck, UserRound } from "lucide-react";
import { WorkspaceFrame } from "@/widgets/WorkspaceFrame/WorkspaceFrame";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { SETTINGS_UI_CONTENT as content } from "./model/settings.content";

/** Trang cài đặt chỉ đọc, không thay đổi mật khẩu, thiết bị hoặc cấu hình bảo mật. */
export function AccountSettingsPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const preview = import.meta.env.DEV && location.pathname.startsWith("/preview/");
  const view = content.tabs.find((item) => item.id === params.get("view"))?.id ?? "profile";
  // TODO: [P1][ACCOUNT-01] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
  // 1. [MỤC TIÊU]: Nối hồ sơ và quản trị phiên theo DTO /me và security đã chốt.
  // 2. [INPUT & OUTPUT]: Phiên + form -> hồ sơ cập nhật/danh sách phiên/step-up challenge.
  // 3. [CÁC BƯỚC]: Sau AUTH-02 chốt /me và endpoints security/sessions; schema -> service -> hooks -> UI bốn trạng thái; xác nhận thu hồi; invalidate sau thành công.
  // 4. [HÀM / THƯ VIỆN]: React Hook Form, Zod, createBaseService, TanStack Query, dialogs.
  // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Không đổi role/status từ PATCH profile; Google không mặc định có password; không bỏ login method cuối; logout/đổi account dọn cache; Passkey theo AUTH-11.
  return (
    <WorkspaceFrame
      title={content.title}
      description={content.description}
      preview={preview}
      active="settings"
    >
      {view !== "sessions" && (
        <section className="rounded-2xl border border-heritage-border bg-heritage-surface p-6 sm:p-8">
          <h2 className="flex items-center gap-3 text-xl font-semibold">
            <UserRound aria-hidden="true" className="size-6 text-heritage-gold" />
            {content.profile}
          </h2>
          {!preview && <p className="mt-3 text-sm text-heritage-muted">{content.waiting}</p>}
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {content.fields.map((item, index) => (
              <div key={item.label} className="space-y-2">
                <label htmlFor={`settings-profile-${index}`} className="block text-sm font-medium">
                  {item.label}
                </label>
                <Input
                  id={`settings-profile-${index}`}
                  type={item.type}
                  value={preview ? item.value : ""}
                  readOnly
                  className="h-12 text-sm"
                />
              </div>
            ))}
          </div>
          <Button size="lg" className="mt-8" disabled title={content.disabled}>
            {content.save}
          </Button>
        </section>
      )}
      {view !== "sessions" && (
        <section className="rounded-2xl border border-heritage-border bg-heritage-surface p-6 sm:p-8">
          <h2 className="text-xl font-semibold">{content.heartbeat}</h2>
          <ul className="mt-4 divide-y divide-heritage-border">
            {content.reminders.map((item) => (
              <li key={item.title} className="flex items-center justify-between gap-5 py-5">
                <div>
                  <h3 className="text-sm font-medium">{item.title}</h3>
                  <p className="mt-1 text-xs leading-6 text-heritage-muted">{item.detail}</p>
                </div>
                {item.value ? (
                  <span className="shrink-0 rounded-full bg-heritage-canvas px-3 py-2 text-xs">
                    {preview ? item.value : content.waiting}
                  </span>
                ) : (
                  <input
                    type="checkbox"
                    role="switch"
                    aria-label={item.title}
                    checked={preview && item.enabled}
                    disabled
                    className="size-6 shrink-0 accent-heritage-primary"
                  />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      {view !== "sessions" && (
        <section className="divide-y divide-heritage-border rounded-2xl border border-heritage-border bg-heritage-surface px-6 sm:px-8">
          <h2 className="py-6 text-xl font-semibold">{content.securityTitle}</h2>
          {content.security.map((item) => (
            <div
              key={item.title}
              className="flex flex-wrap items-center justify-between gap-5 py-6"
            >
              <div className="flex max-w-2xl gap-4">
                <ShieldCheck aria-hidden="true" className="size-7 shrink-0 text-heritage-gold" />
                <div>
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-heritage-muted">{item.detail}</p>
                </div>
              </div>
              <Button size="lg" variant="outline" disabled title={content.disabled}>
                {item.action}
              </Button>
            </div>
          ))}
          <Link
            to="?view=sessions"
            className="flex min-h-14 items-center py-4 text-sm font-medium underline underline-offset-4"
          >
            {content.viewDevices}
          </Link>
        </section>
      )}
      {view !== "sessions" && (
        <section className="rounded-2xl border border-heritage-border bg-heritage-surface p-6 sm:p-8">
          <h2 className="text-xl font-semibold">{content.account}</h2>
          <p className="mt-3 text-sm leading-7 text-heritage-muted">{content.accountHint}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" variant="outline" disabled>
              {content.export}
            </Button>
            <Button size="lg" variant="outline" className="text-red-700" disabled>
              {content.delete}
            </Button>
          </div>
        </section>
      )}
      {view === "sessions" && (
        <section className="rounded-2xl border border-heritage-border bg-heritage-surface p-6 sm:p-8">
          <Link
            to="?view=profile"
            className="mb-5 flex min-h-11 items-center text-sm underline underline-offset-4"
          >
            {content.back}
          </Link>
          <h2 className="text-xl font-semibold">{content.devices}</h2>
          {preview ? (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-5 rounded-xl border border-heritage-border p-5">
              <div className="flex gap-4">
                <Monitor aria-hidden="true" className="size-7 shrink-0 text-heritage-gold" />
                <div>
                  <h3 className="font-medium">{content.device}</h3>
                  <p className="mt-2 text-xs leading-6 text-heritage-muted">{content.deviceHint}</p>
                </div>
              </div>
              <Button size="lg" variant="outline" disabled>
                {content.revoke}
              </Button>
            </div>
          ) : (
            <p className="mt-5 text-sm text-heritage-muted">{content.emptySessions}</p>
          )}
          <p className="mt-5 text-sm leading-7 text-heritage-muted">{content.noSession}</p>
          <Button size="lg" className="mt-5" disabled>
            {content.revokeAll}
          </Button>
        </section>
      )}
    </WorkspaceFrame>
  );
}
