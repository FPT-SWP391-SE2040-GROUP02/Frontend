import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerSection } from "@/widgets/OwnerWorkspace/OwnerSection";

const GROUPS_TAB = "groups";
const TAB_BASE =
  "inline-flex min-h-9 items-center rounded-lg px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-heritage-gold";

/** Kho của tôi: tab "Mục trong kho" và tab "Gói bàn giao"; tab nằm trên URL (?tab=groups). */
export function AssetsManagementPage() {
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const onGroups = params.get("tab") === GROUPS_TAB;

  function selectTab(groups: boolean): void {
    const next = new URLSearchParams();
    if (groups) {
      next.set("tab", GROUPS_TAB);
    }
    setParams(next);
  }

  let itemsTabStyle = `${TAB_BASE} bg-heritage-primary text-white`;
  let groupsTabStyle = `${TAB_BASE} text-heritage-muted hover:bg-heritage-primary/5`;
  if (onGroups) {
    itemsTabStyle = `${TAB_BASE} text-heritage-muted hover:bg-heritage-primary/5`;
    groupsTabStyle = `${TAB_BASE} bg-heritage-primary text-white`;
  }
  let headerAction = null;
  if (onGroups) {
    headerAction = (
      <Button
        size="lg"
        className="bg-[#E0C486] font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B]"
        onClick={() => setCreating(true)}
      >
        Tạo gói bàn giao
      </Button>
    );
  }
  return (
    <OwnerWorkspace
      title="Kho của tôi"
      description="Mọi thứ bạn muốn để lại, được giữ kín. Người nhận được gắn theo gói bàn giao, không gắn từng mục."
      headerAction={headerAction}
    >
      <div
        role="tablist"
        aria-label="Kho của tôi"
        className="inline-flex gap-1 rounded-xl border border-heritage-border bg-heritage-surface p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={!onGroups}
          className={itemsTabStyle}
          onClick={() => selectTab(false)}
        >
          Mục trong kho
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={onGroups}
          className={groupsTabStyle}
          onClick={() => selectTab(true)}
        >
          Gói bàn giao
        </button>
      </div>
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
