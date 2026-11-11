import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowRight, UserCheck } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { formatDateTime, planStageLabel } from "../model/admin.content";
import { useAdminDashboard } from "../model/useAdmin";
import { useSystemConfig } from "../model/useSystemConfig";
import { SYSTEM_CONFIG_SERVICES } from "../model/systemConfig.content";
import { AdminErrorMessage } from "./AdminStateMessage";
import { ROUTES } from "@/shared/config/routes.config";

/** Màu thanh theo giai đoạn kế hoạch: xanh khi chạy ổn, vàng khi chờ người, xanh dương khi đang xử lý, đỏ khi bị đóng băng. */
function planStageBarColor(stage: string) {
  switch (stage) {
    case "ACTIVE":
      return "bg-emerald-600";
    case "CHECKIN_OVERDUE":
    case "AWAITING_CHECK":
      return "bg-amber-600";
    case "DEATH_CASE_OPEN":
    case "HANDOVER_IN_PROGRESS":
      return "bg-sky-700";
    case "BLOCKED":
      return "bg-red-700";
    default:
      return "bg-stone-400";
  }
}

const TILE_ICON_TONES = {
  bad: "bg-red-50 text-red-800",
  warn: "bg-amber-50 text-amber-800",
  neutral: "bg-[#e5ede8] text-heritage-primary",
} as const;

/** Một ô số liệu của Tổng quan: biểu tượng trong ô màu nhạt, nhãn, số lớn và chú thích. */
function Tile({
  icon: Icon,
  label,
  value,
  caption,
  tone,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  caption: ReactNode;
  tone: keyof typeof TILE_ICON_TONES;
  onClick?: () => void;
}) {
  // Ô có đích đến thì là nút bấm; không có thì chỉ là khối số liệu tĩnh.
  const Tag = onClick ? "button" : "div";
  const clickable = onClick
    ? " transition-colors hover:border-heritage-gold hover:shadow-[0_1px_2px_rgba(11,41,30,.06),0_6px_18px_rgba(11,41,30,.05)]"
    : "";
  return (
    <Tag
      {...(onClick ? { type: "button" as const, onClick } : {})}
      className={`flex min-h-[132px] flex-col items-start gap-0.5 rounded-[14px] border bg-white px-[18px] py-4 text-left${clickable} ${
        tone === "bad" ? "border-red-300 shadow-[inset_0_3px_0_#a32119]" : "border-heritage-border"
      }`}
    >
      <span
        className={`mb-1.5 grid size-9 place-items-center rounded-[10px] ${TILE_ICON_TONES[tone]}`}
      >
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <span className="text-sm font-semibold text-heritage-muted">{label}</span>
      <b
        className={`text-[34px] font-bold leading-[1.15] tabular-nums ${
          tone === "bad" ? "text-red-700" : "text-heritage-primary"
        }`}
      >
        {value}
      </b>
      <span className="text-xs text-heritage-muted">{caption}</span>
    </Tag>
  );
}

/** Tổng quan quản trị: ô số liệu và các khối số liệu vận hành. Phần sự cố đang tạm ẩn. */
export function AdminOverview({ actionLabel }: { actionLabel?: (action: string) => string }) {
  const navigate = useNavigate();
  const query = useAdminDashboard();
  const serviceConfig = useSystemConfig();

  if (query.isPending)
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Đang tải số liệu quản trị"
        className="mt-6 space-y-6"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );

  if (query.isError)
    return (
      <div className="mt-6">
        <AdminErrorMessage
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      </div>
    );

  const data = query.data;

  const goToHolds = () => {
    navigate(`${ROUTES.ADMIN.ROOT}?view=holds`);
  };

  return (
    <div className="mt-6 space-y-8" aria-busy={query.isFetching}>
      {/* Hai ô số liệu: biểu tượng trong ô màu nhạt, nhãn, số lớn, chú thích; ô tạm giữ bấm để mở trang Tạm giữ. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Tile
          icon={ShieldAlert}
          label="Kho đang tạm giữ"
          value={data.activeHolds}
          caption={
            data.holdsPastReview > 0
              ? `${data.holdsPastReview} kho quá hạn rà soát`
              : "Bảo vệ kho chờ phán quyết"
          }
          tone={data.holdsPastReview > 0 ? "warn" : "neutral"}
          onClick={goToHolds}
        />
        <Tile
          icon={UserCheck}
          label="Chờ người xét duyệt"
          value={data.casesWithoutVerifier}
          caption="Hồ sơ chứng tử cần chỉ định"
          tone={data.casesWithoutVerifier > 0 ? "warn" : "neutral"}
        />
      </div>

      <div className="grid gap-[22px]">
        <aside className="space-y-4" aria-label="Số liệu vận hành">
          {data.planStages.length > 0 && (
            <section
              aria-labelledby="admin-plan-stages"
              className="rounded-2xl border border-heritage-border bg-[#faf9f5] p-5 shadow-[0_1px_2px_rgba(11,41,30,.06),0_6px_18px_rgba(11,41,30,.05)]"
            >
              <h2
                id="admin-plan-stages"
                className="mb-3 text-[15px] font-bold text-heritage-primary"
              >
                Kế hoạch theo giai đoạn
              </h2>
              <ul className="mt-3 space-y-3">
                {data.planStages.map((stage) => (
                  <li key={stage.stage} className="space-y-1">
                    <p className="flex items-center justify-between gap-3 text-sm">
                      <span>{planStageLabel(stage.stage)}</span>
                      <b className="tabular-nums">{stage.count}</b>
                    </p>
                    <span className="block h-1.5 rounded-full bg-stone-100">
                      <i
                        className={`block h-full rounded-full ${planStageBarColor(stage.stage)}`}
                        style={{
                          width: `${Math.max(4, Math.round((stage.count / Math.max(...data.planStages.map((s) => s.count))) * 100))}%`,
                        }}
                      />
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-heritage-muted">
                Đã đóng {data.closedPlans} kho, không tính ở đây.
              </p>
            </section>
          )}
          {serviceConfig.isSuccess && serviceConfig.data.services.length > 0 && (
            <section
              aria-labelledby="admin-external-services"
              className="rounded-2xl border border-heritage-border bg-[#faf9f5] p-5 shadow-[0_1px_2px_rgba(11,41,30,.06),0_6px_18px_rgba(11,41,30,.05)]"
            >
              <h2
                id="admin-external-services"
                className="mb-3 text-[15px] font-bold text-heritage-primary"
              >
                Dịch vụ ngoài
              </h2>
              <ul className="mt-3 divide-y divide-heritage-border">
                {serviceConfig.data.services.map((service) => {
                  const failed = service.status.lastOutcome === "FAILED";
                  const ok = service.status.lastOutcome === "SUCCEEDED";
                  return (
                    <li
                      key={service.serviceKey}
                      className="flex items-center justify-between gap-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className={`size-2.5 rounded-full ${
                            failed ? "bg-red-600" : ok ? "bg-emerald-600" : "bg-stone-300"
                          }`}
                        />
                        {SYSTEM_CONFIG_SERVICES[service.serviceKey]?.title ?? service.serviceKey}
                      </span>
                      <span
                        className={failed ? "font-semibold text-red-700" : "text-heritage-muted"}
                      >
                        {failed
                          ? `Lỗi ${service.status.lastErrorCode ?? ""}`.trim()
                          : ok
                            ? "Hoạt động"
                            : "Chưa có lần gọi"}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-heritage-muted">
                Theo lần gọi gần nhất từ lúc máy chủ khởi động.
              </p>
            </section>
          )}
          {data.verifierLoad.length > 0 && (
            <section
              aria-labelledby="admin-verifier-load"
              className="rounded-2xl border border-heritage-border bg-[#faf9f5] p-5 shadow-[0_1px_2px_rgba(11,41,30,.06),0_6px_18px_rgba(11,41,30,.05)]"
            >
              <h2
                id="admin-verifier-load"
                className="mb-3 text-[15px] font-bold text-heritage-primary"
              >
                Tải việc người xét duyệt
              </h2>
              <ul className="mt-3 divide-y divide-heritage-border">
                {data.verifierLoad.map((verifier) => (
                  <li
                    key={verifier.userId}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <span className="min-w-0 break-words">{verifier.fullName}</span>
                    <b className="shrink-0 tabular-nums">
                      {verifier.openCases} hồ sơ
                      {verifier.overdueCases > 0 && (
                        <span className="text-red-700"> · {verifier.overdueCases} quá hạn</span>
                      )}
                    </b>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {data.recentActivity.length > 0 && (
            <section
              aria-labelledby="admin-recent-activity"
              className="rounded-2xl border border-heritage-border bg-[#faf9f5] p-5 shadow-[0_1px_2px_rgba(11,41,30,.06),0_6px_18px_rgba(11,41,30,.05)]"
            >
              <h2
                id="admin-recent-activity"
                className="mb-3 text-[15px] font-bold text-heritage-primary"
              >
                Hoạt động gần đây
              </h2>
              <ul className="mt-3 space-y-2">
                {data.recentActivity.map((activity, index) => (
                  <li key={`${activity.at}-${index}`} className="flex gap-3 text-sm">
                    <time
                      dateTime={activity.at}
                      className="shrink-0 tabular-nums text-heritage-muted"
                    >
                      {formatDateTime(activity.at).slice(-5)}
                    </time>
                    <span className="min-w-0 break-words">
                      <b>{activity.actorFullName ?? "Hệ thống"}</b>{" "}
                      {(actionLabel ?? ((action: string) => action))(activity.action)}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => navigate(ROUTES.ADMIN.AUDIT_LOG)}
              >
                Xem nhật ký <ArrowRight className="ml-1 size-3.5" aria-hidden="true" />
              </Button>
            </section>
          )}
        </aside>
      </div>

      <p className="text-xs text-heritage-muted">
        Zero-Knowledge: Quản trị viên chỉ quản lý hạ tầng và giám sát vận hành, tuyệt đối không giải
        mã và không đọc nội dung kho của người dùng.
      </p>
    </div>
  );
}
