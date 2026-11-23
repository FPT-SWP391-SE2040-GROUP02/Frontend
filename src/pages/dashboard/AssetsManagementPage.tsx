import { useSearchParams } from "react-router-dom";
import { SlidingTabs } from "@/shared/ui/SlidingTabs";
import { useVaultPageTitle } from "@/features/vault-management/model/useVaultPageTitle";
import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerSection } from "@/widgets/OwnerWorkspace/OwnerSection";

const ASSIGNMENTS_TAB = "assignments";
/** Đường dẫn cũ từ thời còn gói tài sản; vẫn mở đúng tab để link đã lưu không hỏng. */
const LEGACY_GROUPS_TAB = "groups";
const ITEMS_TAB = "items";
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
