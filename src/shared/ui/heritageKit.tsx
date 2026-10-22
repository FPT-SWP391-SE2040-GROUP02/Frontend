import type { ReactNode } from "react";
import { cn } from "cn";

/** Khối giao diện dùng chung theo bộ thiết kế LegacyVault (thẻ, nhãn trạng thái, banner, nút). */

export type Tone = "success" | "warning" | "neutral" | "danger";

const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold disabled:pointer-events-none disabled:opacity-50";

/** Kiểu nút theo thiết kế (nền vàng chữ xanh đen, nền xanh đậm, viền, đỏ). Dùng cho cả <button> và <Link>. */
export const buttonStyles = {
  gold: `${buttonBase} bg-[#E0C486] text-[#0A281E] hover:bg-[#E8CF9B]`,
  dark: `${buttonBase} bg-[#0A281E] text-white hover:bg-[#12392C]`,
  outline: `${buttonBase} border border-[#BDB8A6] bg-transparent text-[#0A281E] hover:bg-[#F4F1E6]`,
  danger: `${buttonBase} border border-[#A32119] bg-transparent text-[#A32119] hover:bg-[#F8E1DE]`,
};

const chipTones: Record<Tone, string> = {
  success: "bg-[#DDEFE6] text-[#1F7A55]",
  warning: "bg-[#F1E6CC] text-[#7A5B25]",
  neutral: "bg-[#ECE8DB] text-[#4D4D4B]",
  danger: "bg-[#F8E1DE] text-[#A32119]",
};

const noticeTones: Record<Tone, string> = {
  success: "bg-[#DDEFE6] text-[#1F7A55]",
  warning: "bg-[#F1E6CC] text-[#7A5B25]",
  neutral: "bg-[#ECE8DB] text-heritage-muted",
  danger: "bg-[#F8E1DE] text-[#A32119]",
};

/** Nhãn trạng thái dạng viên thuốc. */
export function Chip({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold",
        chipTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Thẻ nội dung có tiêu đề tùy chọn. */
export function Panel({
  title,
  action,
  children,
  className,
  labelledBy,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  return (
    <section
      aria-labelledby={title && labelledBy ? labelledBy : undefined}
      className={cn("rounded-2xl border border-heritage-border bg-heritage-surface p-6", className)}
    >
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && (
            <h2 id={labelledBy} className="text-xl font-semibold text-heritage-primary">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Dải thông báo màu: xanh (an toàn), vàng (lưu ý), đỏ (cảnh báo). */
export function Notice({
  tone = "neutral",
  title,
  children,
  action,
  role,
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  role?: "status" | "alert";
}) {
  return (
    <div
      role={role}
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-5",
        noticeTones[tone],
      )}
    >
      <div className="min-w-0 space-y-1">
        {title && <p className="text-lg font-semibold">{title}</p>}
        {children && <div className="text-sm leading-6">{children}</div>}
      </div>
      {action}
    </div>
  );
}

/** Chữ cái đầu trong vòng tròn vàng nhạt. */
export function Initial({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-full bg-[#E0C486] text-base font-semibold text-[#0A281E]",
        className,
      )}
    >
      {name.trim().charAt(0).toLocaleUpperCase("vi-VN") || "?"}
    </span>
  );
}

/** Một dòng "nhãn - giá trị" trong thẻ thông tin. */
export function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] items-baseline gap-3 py-1.5 text-sm">
      <dt className="text-heritage-muted">{label}</dt>
      <dd className="font-semibold">{children}</dd>
    </div>
  );
}

export { formatDate, formatDateTime } from "@/shared/lib/dateFormat";
