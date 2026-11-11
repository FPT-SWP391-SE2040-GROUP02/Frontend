import { useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Check } from "lucide-react";
import type { PackageResponse } from "@/entities/package/model/package.types";
import { Button } from "@/shared/ui/button";
import { useOwnerPackages } from "@/features/vault-management/model/useOwnerVault";
import type {
  GroupAssetOption,
  GroupBeneficiaryOption,
} from "@/features/vault-management/model/groupMembers";
import { CreateGroupDialog } from "@/features/vault-management/ui/CreateGroupDialog";
import { GroupCard } from "@/features/vault-management/ui/GroupCard";
import { RenameGroupDialog } from "@/features/vault-management/ui/RenameGroupDialog";
import { AddGroupMembersDialog } from "@/features/vault-management/ui/AddGroupMembersDialog";
import { usePlanSetup } from "@/features/plan-setup/model/usePlanSetup";
import { useVaultAssets } from "@/features/assets/model/useVaultAssets";
import { useBeneficiaries } from "@/features/beneficiaries/model/useBeneficiaries";

const PAGE_SIZE = 10;
/** Một kho có tối đa 50 gói chưa xóa nên một trang 100 dòng đủ để biết tài sản đang ở gói nào. */
const LOOKUP_PAGE = { pageIndex: 1, pageSize: 100 };
const GOLD_BUTTON = "bg-[#E0C486] font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B]";

interface MemberEditing {
  group: PackageResponse;
  relation: "assets" | "beneficiaries";
}

/**
 * Tab "Gói bàn giao" của Kho của tôi: thẻ từng gói kèm chip tài sản, người nhận và chỗ bổ sung phần còn thiếu.
 * Nút "Tạo gói bàn giao" ở đầu trang do trang cha điều khiển qua `createOpen`.
 */
export function OwnerGroups({
  vaultId,
  createOpen,
  onCreateOpenChange,
  lockReason = null,
}: {
  vaultId: string;
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
  /** Lý do kho đang bị khóa; khác null thì không tạo, đổi tên, thêm thành viên cho gói được. */
  lockReason?: string | null;
}) {
  const [params, setParams] = useSearchParams();
  const [renaming, setRenaming] = useState<PackageResponse | null>(null);
  const [editing, setEditing] = useState<MemberEditing | null>(null);
  const requested = Number(params.get("page") ?? 1);
  let page = 1;
  if (Number.isSafeInteger(requested) && requested >= 1 && requested <= 1_000_000) {
    page = requested;
  }
  const query = useOwnerPackages(vaultId, true, { pageIndex: page, pageSize: PAGE_SIZE });
  const allGroups = useOwnerPackages(vaultId, true, LOOKUP_PAGE);
  const assetQuery = useVaultAssets(vaultId, LOOKUP_PAGE);
  const beneficiaryQuery = useBeneficiaries(vaultId, LOOKUP_PAGE);
  // Mục chưa thuộc gói bàn giao nào sẽ không nằm trong phạm vi bàn giao; chỉ nhắc khi đã biết chắc.
  const planSetup = usePlanSetup(vaultId);

  // Bảng tài sản -> gói, dựng từ assetIds của các gói (AssetResponse không có trường này).
  const groupOfAsset = new Map<string, PackageResponse>();
  if (allGroups.data) {
    for (const group of allGroups.data.items) {
      for (const assetId of group.assetIds) {
        groupOfAsset.set(assetId, group);
      }
    }
  }
  const assets: GroupAssetOption[] = [];
  const assetsById = new Map<string, GroupAssetOption>();
  if (assetQuery.data) {
    for (const item of assetQuery.data.items) {
      const owner = groupOfAsset.get(item.id);
      let containerId: string | null = null;
      let containerName: string | null = null;
      if (owner) {
        containerId = owner.id;
        containerName = owner.name;
      }
      const option: GroupAssetOption = {
        id: item.id,
        name: item.name,
        kind: item.kind,
        containerId,
        containerName,
      };
      assets.push(option);
      assetsById.set(option.id, option);
    }
  }
  const beneficiaries: GroupBeneficiaryOption[] = [];
  const beneficiariesById = new Map<string, GroupBeneficiaryOption>();
  if (beneficiaryQuery.data) {
    for (const item of beneficiaryQuery.data.items) {
      const option: GroupBeneficiaryOption = {
        id: item.id,
        fullName: item.fullName,
        citizenIdLast4: item.citizenIdLast4,
      };
      beneficiaries.push(option);
      beneficiariesById.set(option.id, option);
    }
  }

  function goTo(value: number): void {
    const next = new URLSearchParams(params);
    next.set("page", String(value));
    setParams(next);
  }

  let body: ReactNode;
  if (query.isPending) {
    body = (
      <p role="status" className="mt-4 text-sm text-heritage-muted">
        Đang tải danh sách gói bàn giao…
      </p>
    );
  } else if (query.isError) {
    body = (
      <div role="alert" className="mt-4 space-y-3">
        <p className="text-sm">Không tải được danh sách gói bàn giao.</p>
        <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
          Thử lại
        </Button>
      </div>
    );
  } else if (query.data.items.length === 0) {
    let emptyTitle = "Bạn chưa có gói bàn giao nào.";
    if (page > 1) {
      emptyTitle = "Trang này không có gói bàn giao.";
    }
    body = (
      <div className="mt-6 space-y-3">
        <Check className="size-5 text-green-700" aria-hidden="true" />
        <p className="font-semibold">{emptyTitle}</p>
        <p className="text-sm text-heritage-muted">
          Gói bàn giao gom các tài sản và người nhận có chung mục đích chuyển giao di sản.
        </p>
        {page === 1 && (
          <Button
            size="lg"
            className={GOLD_BUTTON}
            disabled={lockReason !== null}
            title={lockReason ?? undefined}
            onClick={() => onCreateOpenChange(true)}
          >
            Tạo gói bàn giao đầu tiên
          </Button>
        )}
      </div>
    );
  } else {
    const cards: ReactNode[] = [];
    for (const group of query.data.items) {
      cards.push(
        <GroupCard
          key={group.id}
          group={group}
          assetsById={assetsById}
          beneficiariesById={beneficiariesById}
          onRename={setRenaming}
          onAddMembers={(target, relation) => setEditing({ group: target, relation })}
          lockReason={lockReason}
        />,
      );
    }
    body = (
      <>
        <ul className="mt-4 space-y-4">{cards}</ul>
        {(page > 1 || query.data.hasNextPage) && (
          <nav
            aria-label="Phân trang gói bàn giao"
            className="mt-4 flex items-center justify-between gap-3"
          >
            <Button
              variant="outline"
              disabled={page === 1 || query.isFetching}
              onClick={() => goTo(page - 1)}
            >
              Trang trước
            </Button>
            <span className="text-sm">Trang {page}</span>
            <Button
              variant="outline"
              disabled={!query.data.hasNextPage || query.isFetching}
              onClick={() => goTo(page + 1)}
            >
              Trang sau
            </Button>
          </nav>
        )}
      </>
    );
  }

  let outsideCount = 0;
  if (planSetup.data) {
    outsideCount = planSetup.data.assetsOutsideContainer.length;
  }

  return (
    <div className="space-y-6">
      {outsideCount > 0 && (
        <p role="status" className="rounded-xl bg-[#F1E7D0] px-4 py-3 text-sm text-[#7A5B24]">
          Có {outsideCount} mục chưa thuộc gói bàn giao nào. Những mục này chưa được giao cho ai và
          sẽ không nằm trong phạm vi bàn giao.
        </p>
      )}
      <section
        aria-label="Danh sách gói bàn giao"
        className="rounded-2xl border border-heritage-border bg-heritage-surface p-6"
      >
        <h2 className="text-xl font-medium text-heritage-primary">Danh sách gói bàn giao</h2>
        <p className="mt-3 max-w-2xl rounded-xl border border-heritage-border bg-[#FBFAF5] px-4 py-3 text-sm text-[#4D4D4B]">
          Một gói gom các tài sản có cùng người nhận. Gói chuyển sang <strong>sẵn sàng</strong> khi
          có ít nhất một tài sản và một người nhận. Kế hoạch bàn giao cần ít nhất một gói sẵn sàng
          mới kích hoạt được.
        </p>
        {body}
      </section>
      {createOpen && (
        <CreateGroupDialog
          vaultId={vaultId}
          assets={assets}
          beneficiaries={beneficiaries}
          onClose={() => onCreateOpenChange(false)}
        />
      )}
      {renaming && <RenameGroupDialog group={renaming} onClose={() => setRenaming(null)} />}
      {editing && (
        <AddGroupMembersDialog
          group={editing.group}
          relation={editing.relation}
          assets={assets}
          beneficiaries={beneficiaries}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
