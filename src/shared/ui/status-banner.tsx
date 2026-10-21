import type { ReactNode } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";

const TONES = {
  error: {
    role: "alert",
    style: "border-red-200 bg-red-50 text-red-800",
    Icon: CircleAlert,
  },
  success: {
    role: "status",
    style: "border-green-200 bg-green-50 text-green-800",
    Icon: CircleCheck,
  },
} as const;

/** Thông báo kết quả thao tác nổi bật: đỏ khi lỗi (role alert), xanh khi thành công (role status). */
export function StatusBanner({
  tone,
  children,
  className = "",
}: {
  tone: keyof typeof TONES;
  children: ReactNode;
  className?: string;
}) {
  const { role, style, Icon } = TONES[tone];
  return (
    <div
      role={role}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${style} ${className}`}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 space-y-2">{children}</div>
    </div>
  );
}
