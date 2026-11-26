import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronUp } from "lucide-react";
import { HistoryIcon, PlanIcon, SettingsIcon } from "@/shared/ui/LegacyVaultArtwork";
import { ROUTES } from "@/shared/config/routes.config";
import { UserAvatar } from "@/entities/user/ui/UserAvatar";
import type { AuthState } from "@/entities/user/model/authSlice";
import { RailLabel } from "@/shared/ui/sideRail/RailLabel";

interface AccountMenuItem {
  label: string;
  to: string;
  icon: typeof HistoryIcon;
}

const ITEMS: AccountMenuItem[] = [
  { label: "Nhật ký hoạt động", to: ROUTES.DASHBOARD.AUDIT_LOG, icon: HistoryIcon },
  { label: "Gói dịch vụ", to: ROUTES.BILLING.PLANS, icon: PlanIcon },
  { label: "Cài đặt", to: ROUTES.DASHBOARD.SETTINGS, icon: SettingsIcon },
];

/**
 * Menu tài khoản ở chân thanh bên: bấm vào khối người dùng thì mở danh sách mục thuộc tài khoản (nhật ký, gói dịch
 * vụ, cài đặt) nổi lên phía trên. Esc hoặc bấm ra ngoài thì đóng và trả tiêu điểm về nút mở.
 */
export function AccountMenu({
  user,
  currentPath,
  tier,
}: {
  user: AuthState["user"];
  /** Đường dẫn đang xem, để đánh dấu mục tương ứng. */
  currentPath: string;
  /** Huy hiệu gói dịch vụ hiện dưới tên (đã dựng sẵn bởi nơi gọi). */
  tier: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const inMenu = ITEMS.some(
    (item) => currentPath === item.to || currentPath.startsWith(`${item.to}/`),
  );

  return (
    <div ref={rootRef} className="account-menu">
      <div
        id={menuId}
        role="group"
        aria-label="Mục tài khoản"
        className="account-menu-panel"
        data-open={open}
        inert={!open}
      >
        {ITEMS.map((item, index) => {
          const Icon = item.icon;
          const active = currentPath === item.to || currentPath.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              title={item.label}
              className="account-menu-link"
              onClick={() => setOpen(false)}
            >
              <Icon className="size-[18px] shrink-0" aria-hidden="true" />
              <RailLabel order={index}>{item.label}</RailLabel>
            </Link>
          );
        })}
      </div>
      <button
        ref={buttonRef}
        type="button"
        className="u040-me account-menu-trigger"
        title={user?.fullName ?? "Tài khoản"}
        aria-expanded={open}
        aria-controls={menuId}
        data-current={inMenu}
        onClick={() => setOpen(!open)}
      >
        <UserAvatar
          user={user}
          fallbackLetter="T"
          className="u040-avatar size-10 shrink-0 bg-heritage-gold-soft text-heritage-primary"
        />
        <span className="u040-label min-w-0 flex-1 text-left">
          <span className="block truncate text-sm font-semibold text-white">
            {user?.fullName ?? "Tài khoản"}
          </span>
          <span className="block text-sm text-heritage-gold-soft">Chủ tài sản</span>
          {tier && <span className="account-menu-tier mt-1 block">{tier}</span>}
        </span>
        <ChevronUp className="account-menu-chevron size-4 shrink-0" aria-hidden="true" />
      </button>
    </div>
  );
}
