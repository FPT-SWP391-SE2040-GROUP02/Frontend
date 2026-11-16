import type { ReactNode } from "react";
import { Mail, Smartphone } from "lucide-react";

function MethodRow({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <li className="flex items-center gap-4 border-b border-heritage-border py-4 last:border-b-0">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#E3EFE8] text-[#1F7A55]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm text-heritage-muted">{description}</p>
      </div>
      <span className="shrink-0 rounded-full bg-[#E3EFE8] px-3 py-1 text-sm font-semibold text-[#1F7A55]">
        Đang dùng
      </span>
    </li>
  );
}

/**
 * Thẻ "Cách điểm danh": bấm Điểm danh trên LegacyVault và thư nhắc trước hạn. Số thư và mốc ngày nhắc do Admin cấu hình
 * nên không in con số cố định ở đây.
 */
export function CheckInMethodsCard() {
  return (
    <section
      aria-labelledby="check-in-methods-title"
      className="rounded-2xl border border-heritage-border bg-heritage-surface p-6"
    >
      <h2 id="check-in-methods-title" className="text-xl font-medium text-heritage-primary">
        Cách điểm danh
      </h2>
      <ul className="mt-2">
        <MethodRow
          icon={<Smartphone className="size-5" aria-hidden="true" />}
          title="Điện thoại và máy tính"
          description="Bấm “Điểm danh” trên LegacyVault"
        />
        <MethodRow
          icon={<Mail className="size-5" aria-hidden="true" />}
          title="Nhắc qua email"
          description="Hệ thống gửi thư nhắc trước khi tới hạn điểm danh"
        />
      </ul>
    </section>
  );
}
