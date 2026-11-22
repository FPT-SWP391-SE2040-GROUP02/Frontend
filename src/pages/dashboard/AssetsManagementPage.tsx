import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { SlidingTabs } from "@/shared/ui/SlidingTabs";
import { useVaultPageTitle } from "@/features/vault-management/model/useVaultPageTitle";
import { useOwnerVaultLock } from "@/features/vault-management/model/useOwnerVaultLock";
import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerSection } from "@/widgets/OwnerWorkspace/OwnerSection";

const GROUPS_TAB = "groups";
const ITEMS_TAB = "items";
const TABS = [
  { key: ITEMS_TAB, label: "Mục trong kho" },
  { key: GROUPS_TAB, label: "Gói bàn giao" },
];

/** Kho của tôi: tab "Mục trong kho" và tab "Gói bàn giao"; tab nằm trên URL (?tab=groups). */
export function AssetsManagementPage() {
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const pageTitle = useVaultPageTitle();
  const lockReason = useOwnerVaultLock();
  const onGroups = params.get("tab") === GROUPS_TAB;

  function selectTab(groups: boolean): void {
    const next = new URLSearchParams();
    if (groups) {
      next.set("tab", GROUPS_TAB);
    }
    setParams(next);
  }

  let activeTab = ITEMS_TAB;
  if (onGroups) {
    activeTab = GROUPS_TAB;
  }
  let headerAction = null;
  if (onGroups) {
    headerAction = (
      <Button
        size="lg"
        className="bg-heritage-primary font-semibold text-white shadow-none hover:bg-heritage-primary-hover"
        disabled={lockReason !== null}
        title={lockReason ?? undefined}
        onClick={() => setCreating(true)}
      >
        Tạo gói bàn giao
      </Button>
    );
  }
  return (
    <OwnerWorkspace
      title={pageTitle.title}
      eyebrow={pageTitle.eyebrow}
      description="Mọi thứ bạn muốn để lại, được giữ kín. Người nhận được gắn theo gói bàn giao, không gắn từng mục."
      headerAction={headerAction}
    >
      <SlidingTabs
        label="Kho của tôi"
        tabs={TABS}
        value={activeTab}
        onChange={(key) => selectTab(key === GROUPS_TAB)}
      />
      <div role="tabpanel">
        {onGroups && (
          <OwnerSection
            section="groups"
            groupCreate={{ open: creating, onOpenChange: setCreating }}
          />
        )}
        {!onGroups && <OwnerSection section="assets" />}
      </div>
    </OwnerWorkspace>
  );
}
