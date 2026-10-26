import { Link } from "react-router-dom";
import { ChevronDown, Lock } from "lucide-react";
import type { VaultResponse } from "@/entities/vault/model/vault.types";
import {
  useOwnerVault,
  isOwnerVaultMissing,
} from "@/features/vault-management/model/useOwnerVault";
import { CreateVaultForm } from "@/features/vault-management/ui/CreateVaultForm";
import { EditVaultForm } from "@/features/vault-management/ui/EditVaultForm";
import { OwnerDeathCasePanel } from "@/features/owner-objection";
import { Button } from "@/shared/ui/button";
import { buttonStyles, Chip } from "@/shared/ui/heritageKit";
import { ROUTES } from "@/shared/config/routes.config";
import { useOverviewResources } from "../model/useOverviewResources";
import { OwnerOverviewSummary } from "./OwnerOverviewSummary";
import { OwnerOverviewPlan } from "./OwnerOverviewPlan";
import { OwnerOverviewLists } from "./OwnerOverviewLists";
import { OwnerOverviewDetails } from "./OwnerOverviewDetails";
import "./owner-overview.css";

/** Không mount các truy vấn con trước khi có phiên và kho được BE xác nhận. */
export function OwnerDashboard({ enabled }: { enabled: boolean }) {
  const vault = useOwnerVault(enabled);
  if (!enabled) return <p role="status">Vui lòng đăng nhập để xem kho của bạn.</p>;
  if (vault.isPending)
    return (
      <div role="status" className="overview-card overview-loading">
        Đang tải tổng quan kho…
      </div>
    );
  if (vault.isError) {
    if (isOwnerVaultMissing(vault.error)) return <OwnerVaultOnboarding />;
    return (
      <div role="alert" className="overview-card space-y-4">
        <p>Không tải được kho của bạn.</p>
        <Button disabled={vault.isFetching} onClick={() => void vault.refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }
  return <OwnerDashboardContent key={vault.data.id} vault={vault.data} />;
}

const ONBOARDING_STEPS = [
  {
    title: "Tạo kho",
    text: "Kho là nơi bạn gom mật khẩu, giấy tờ và lời nhắn.",
    badge: "Bây giờ",
  },
  {
    title: "Thêm mục đầu tiên",
    text: "Chọn tài sản số, giấy tờ hoặc lời nhắn bạn muốn để lại.",
    badge: "Sau đó",
  },
  {
    title: "Chọn người nhận và người tin cậy",
    text: "Bạn chọn ai nhận, và mời người thực hiện để báo tin khi cần.",
    badge: "Sau đó",
  },
] as const;

const VAULT_BENEFITS = [
  { title: "Lưu giữ có tổ chức", text: "Mật khẩu, giấy tờ, lời nhắn ở một nơi" },
  { title: "Chỉ bàn giao khi cần", text: "Người nhận không xem được gì cho đến khi bàn giao mở" },
  { title: "Mã hóa nội dung", text: "Người xét duyệt và quản trị viên không đọc được nội dung" },
] as const;

/** Màn chưa có kho (thiết kế 188): ba bước, form tạo kho, lợi ích của kho và lối vào xác minh. */
function OwnerVaultOnboarding() {
  return (
    <section className="space-y-6" aria-label="Tạo kho di sản">
      <div className="rounded-2xl bg-[#1B4A3C] px-8 py-7 text-white">
        <h2 className="font-serif text-3xl">Bắt đầu với kho đầu tiên của bạn</h2>
        <p className="mt-3 text-sm text-white/80">
          Bạn mới cần làm một việc: tạo kho. Phần còn lại bạn làm dần, lúc nào cũng được.
        </p>
      </div>
      <ol className="grid gap-4 md:grid-cols-3">
        {ONBOARDING_STEPS.map((step, index) => {
          const current = index === 0;
          return (
            <li
              key={step.title}
              aria-current={current ? "step" : undefined}
              className={`rounded-2xl border p-5 ${current ? "border-2 border-[#0A281E] bg-white" : "border-heritage-border bg-[#F4F1E6]"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`flex size-8 items-center justify-center rounded-full text-sm font-semibold ${current ? "bg-[#0A281E] text-white" : "bg-[#DAD5C5] text-[#0A281E]"}`}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <Chip tone={current ? "warning" : "neutral"}>{step.badge}</Chip>
              </div>
              <h3 className="mt-4 font-semibold text-heritage-primary">{step.title}</h3>
              <p className="mt-2 text-sm text-heritage-muted">{step.text}</p>
            </li>
          );
        })}
      </ol>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <CreateVaultForm showIntro={false} />
        <div className="space-y-6">
          <section
            aria-labelledby="vault-benefits-title"
            className="rounded-2xl border border-heritage-border bg-heritage-surface p-6"
          >
            <h2 id="vault-benefits-title" className="text-xl font-semibold text-heritage-primary">
              Kho giúp bạn làm gì
            </h2>
            <ul className="mt-4 divide-y divide-heritage-border">
              {VAULT_BENEFITS.map((item) => (
                <li key={item.title} className="py-3">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-heritage-muted">{item.text}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-center gap-2 text-xs text-heritage-muted">
              <Lock className="size-3.5 shrink-0 text-[#1F7A55]" aria-hidden="true" />
              Bạn vẫn đổi hoặc xóa nội dung kho bất cứ lúc nào.
            </p>
          </section>
          <section
            aria-labelledby="vault-identity-title"
            className="space-y-4 rounded-2xl border border-heritage-border bg-heritage-surface p-6"
          >
            <h2 id="vault-identity-title" className="text-xl font-semibold text-heritage-primary">
              Xác minh danh tính
            </h2>
            <p className="text-sm text-heritage-muted">
              Bạn nên xác minh danh tính sớm để kế hoạch bàn giao có thể được kích hoạt sau này.
            </p>
            <Link to={ROUTES.DASHBOARD.IDENTITY} className={buttonStyles.outline}>
              Xác minh danh tính
            </Link>
          </section>
        </div>
      </div>
    </section>
  );
}

function OwnerDashboardContent({ vault }: { vault: VaultResponse }) {
  const data = useOverviewResources(vault.id);
  return (
    <div className="owner-overview-layout">
      <OwnerDeathCasePanel vaultId={vault.id} enabled />
      <OwnerOverviewSummary vault={vault} data={data} />
      <OwnerOverviewPlan data={data} />
      <OwnerOverviewLists data={data} />
      <OwnerOverviewDetails vault={vault} data={data} />
      <details className="overview-card overview-vault-details group">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-semibold text-heritage-primary focus-visible:outline-2 focus-visible:outline-heritage-gold">
          <span>Thông tin kho: {vault.name}</span>
          <ChevronDown
            className="size-4 shrink-0 text-heritage-muted transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="mt-4 border-t border-heritage-border pt-4">
          <EditVaultForm vault={vault} />
        </div>
      </details>
    </div>
  );
}
