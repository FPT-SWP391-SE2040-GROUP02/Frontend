import type { ReactNode } from "react";
import { cn } from "cn";

/** Thẻ "việc cần làm ngay" dùng cho các cổng theo từng bước (người nhận). */

export type HeroTone = "plain" | "gold" | "ok" | "info" | "bad";

const heroTones: Record<HeroTone, string> = {
  plain: "border-heritage-border bg-heritage-surface",
  gold: "border-heritage-gold-soft bg-heritage-warning-bg",
  ok: "border-heritage-success-border bg-heritage-success-bg",
  info: "border-heritage-border-strong bg-heritage-sunken",
  bad: "border-heritage-danger-border bg-heritage-danger-bg",
};

const eyebrowTones: Record<HeroTone, string> = {
  plain: "text-heritage-muted",
  gold: "text-heritage-warning",
  ok: "text-heritage-success",
  info: "text-heritage-primary",
  bad: "text-heritage-danger",
};

/**
 * Thẻ "việc cần làm ngay" của một bước: dòng nhỏ phía trên (eyebrow) nói đang ở bước nào, tiêu đề, giải thích,
 * rồi nút hành động. Mỗi bước chỉ có một thẻ này nên người nhận luôn biết bấm gì tiếp theo.
 */
export function Hero({
  tone = "plain",
  eyebrow,
  title,
  children,
  actions,
}: {
  tone?: HeroTone;
  eyebrow: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className={cn("pm-rise rounded-[18px] border px-6 py-5 shadow-card", heroTones[tone])}>
      <p
        className={cn(
          "mb-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider",
          eyebrowTones[tone],
        )}
      >
        {eyebrow}
      </p>
      <h2 className="text-xl font-semibold leading-snug text-heritage-primary">{title}</h2>
      {children && (
        <div className="mt-2 max-w-[68ch] text-sm leading-6 text-heritage-text">{children}</div>
      )}
      {actions && <div className="mt-4 flex flex-wrap gap-3">{actions}</div>}
    </section>
  );
}
