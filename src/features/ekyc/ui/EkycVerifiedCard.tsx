import { Link } from "react-router-dom";
import type { z } from "zod";
import { CircleCheck } from "lucide-react";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonVariants } from "@/shared/ui/button";
import type { ekycStatusSchema } from "../model/ekyc.schema";

const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Huy hiệu đã xác minh: vòng tròn xanh có dấu tích trắng trên nền mảng màu xanh nhạt (vẽ bằng SVG, không dùng ảnh). */
function VerifiedBadge() {
  return (
    <svg viewBox="0 0 100 100" className="size-20 shrink-0" aria-hidden="true">
      <path
        d="M22 38C28 18 56 10 76 24C92 36 90 62 76 76C62 90 34 90 24 74C16 62 16 50 22 38Z"
        fill="#2FAE73"
        fillOpacity="0.18"
      />
      <circle cx="50" cy="50" r="27" fill="#2FAE73" />
      <circle cx="50" cy="50" r="19" fill="#FFFFFF" />
      <path
        d="M39 51L47 59L62 42"
        fill="none"
        stroke="#2FAE73"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Màn kết quả khi Chủ kho đã xác minh đạt: tóm tắt từ trạng thái của máy chủ và gợi ý bước tiếp theo. */
export function EkycVerifiedCard({ live }: { live: z.infer<typeof ekycStatusSchema> }) {
  let completedAt = "Không có thông tin";
  if (live.completedAt) {
    completedAt = dateTimeFormatter.format(new Date(live.completedAt));
  }
  let spoof = "Chưa có thông tin";
  if (live.spoofCheckPassed === true) {
    spoof = "Qua kiểm tra chống giả mạo";
  }
  let backSide = "Chưa đối chiếu được mã MRZ";
  if (live.backSideChecked) {
    backSide = "Đã đọc";
  }
  const facts = [
    { label: "Số căn cước", value: `•••• ${live.citizenIdLast4}` },
    { label: "Hoàn tất lúc", value: completedAt },
    { label: "Khuôn mặt", value: "Khớp với giấy tờ" },
    { label: "Chống giả mạo", value: spoof },
    { label: "Mặt sau giấy tờ", value: backSide },
  ];
  return (
    <section
      aria-label="Kết quả xác minh danh tính"
      className="space-y-6 rounded-2xl border border-green-200 bg-heritage-surface p-6"
    >
      <div className="flex flex-wrap items-center gap-4">
        <VerifiedBadge />
        <div className="min-w-0 flex-1 space-y-1">
          <p role="status" className="text-xl font-medium text-heritage-primary">
            Danh tính đã được xác minh.
          </p>
          <p className="text-sm text-heritage-muted">
            Bạn chỉ cần xác minh một lần, không phải làm lại.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
          <CircleCheck className="size-4" aria-hidden="true" />
          Đã xác minh
        </span>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.label} className="rounded-xl bg-heritage-canvas px-4 py-3">
            <dt className="text-xs text-heritage-muted">{fact.label}</dt>
            <dd className="text-sm font-medium">{fact.value}</dd>
          </div>
        ))}
      </dl>
      <div className="space-y-3 rounded-xl bg-[#F1E7D0] p-4 text-[#7A5B24]">
        <p className="text-sm font-semibold">Bước tiếp theo</p>
        <p className="text-sm">
          Mua gói dịch vụ cần lần xác minh này (còn hiệu lực 90 ngày kể từ lúc hoàn tất).
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to={ROUTES.BILLING.PLANS}
            className="inline-flex min-h-11 items-center rounded-xl bg-[#E0C486] px-6 text-sm font-semibold text-[#0A281E] hover:bg-[#E6C98B] focus-visible:outline-2 focus-visible:outline-heritage-gold"
          >
            Chọn gói dịch vụ
          </Link>
          <Link
            to={ROUTES.DASHBOARD.ROOT}
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Về Tổng quan
          </Link>
        </div>
      </div>
    </section>
  );
}
