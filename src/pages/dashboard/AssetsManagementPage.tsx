import { useSearchParams } from "react-router-dom";
import { SlidingTabs } from "@/shared/ui/SlidingTabs";
import { Info } from "lucide-react";
import { useVaultPageTitle } from "@/features/vault-management/model/useVaultPageTitle";
import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerSection } from "@/widgets/OwnerWorkspace/OwnerSection";

const ASSIGNMENTS_TAB = "assignments";
/** Đường dẫn cũ từ thời còn gói tài sản; vẫn mở đúng tab để link đã lưu không hỏng. */
const LEGACY_GROUPS_TAB = "groups";
const ITEMS_TAB = "items";
/** Phạm vi dịch vụ: chỉ tài sản số, không nhận giấy tờ nhà đất, xe. */
const DIGITAL_ONLY_NOTICE = "Chỉ nhận tài sản số. Không xử lý giấy tờ nhà đất, xe…";
const TABS = [
  { key: ITEMS_TAB, label: "Mục trong kho" },
  { key: ASSIGNMENTS_TAB, label: "Phân chia" },
];

/** Kho của tôi: tab "Mục trong kho" và tab "Phân chia"; tab nằm trên URL (?tab=assignments). */
export function AssetsManagementPage() {
  const [params, setParams] = useSearchParams();
  const pageTitle = useVaultPageTitle();
  const tabParam = params.get("tab");
  const onAssignments = tabParam === ASSIGNMENTS_TAB || tabParam === LEGACY_GROUPS_TAB;

  function selectTab(assignments: boolean): void {
    const next = new URLSearchParams();
    if (assignments) {
      next.set("tab", ASSIGNMENTS_TAB);
    }
    setParams(next);
  }

  let activeTab = ITEMS_TAB;
  if (onAssignments) {
    activeTab = ASSIGNMENTS_TAB;
  }
  return (
    <OwnerWorkspace
      title={pageTitle.title}
      eyebrow={pageTitle.eyebrow}
      description="Mọi thứ bạn muốn để lại, được giữ kín. Bạn chọn từng mục sẽ về tay ai."
    >
      <p className="flex items-center gap-2 rounded-xl border border-heritage-border bg-[#F1E6CC]/50 px-4 py-2.5 text-sm text-heritage-muted">
        <Info className="size-4 shrink-0 text-[#7A5B24]" aria-hidden="true" />
        {DIGITAL_ONLY_NOTICE}
      </p>
      <SlidingTabs
        label="Kho của tôi"
        tabs={TABS}
        value={activeTab}
        onChange={(key) => selectTab(key === ASSIGNMENTS_TAB)}
      />
      <div role="tabpanel">
        {onAssignments && <OwnerSection section="assignments" />}
        {!onAssignments && <OwnerSection section="assets" />}
      </div>
    </OwnerWorkspace>
  );
}
