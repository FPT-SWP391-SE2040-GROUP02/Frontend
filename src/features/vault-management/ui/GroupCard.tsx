import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Plus } from "lucide-react";
import type { PackageResponse } from "@/entities/package/model/package.types";
import { ROUTES } from "@/shared/config/routes.config";
import { ChipOverflow, type ChipOverflowItem } from "@/shared/ui/ChipOverflow";
import { Chip } from "@/shared/ui/heritageKit";
import {
  assetKindLabel,
  maskedCitizenId,
  type GroupAssetOption,
  type GroupBeneficiaryOption,
} from "../model/groupMembers";

const SMALL_OUTLINE =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-[#BDB8A6] bg-white px-4 text-xs font-semibold text-[#0A281E] transition-colors hover:bg-[#F4F1E6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold disabled:opacity-50";
const SMALL_DARK =
  "inline-flex min-h-9 items-center justify-center rounded-full bg-[#0A281E] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#12392C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold disabled:opacity-50";
const LINK_STYLE =
  "text-xs font-semibold text-[#0A281E] underline decoration-[#B68F4C] underline-offset-4 hover:decoration-2";

export interface GroupCardProps {
  group: PackageResponse;
  /** Tra tên tài sản theo id. */
  assetsById: Map<string, GroupAssetOption>;
  /** Tra hồ sơ người nhận theo id. */
  beneficiariesById: Map<string, GroupBeneficiaryOption>;
  onRename: (group: PackageResponse) => void;
  onAddMembers: (group: PackageResponse, relation: "assets" | "beneficiaries") => void;
}

function MissingNotice({
  needAssets,
  needPeople,
  onAddAssets,
  onAddPeople,
}: {
  needAssets: boolean;
  needPeople: boolean;
  onAddAssets: () => void;
  onAddPeople: () => void;
}) {
  let message: ReactNode;
  let actions: ReactNode;
  if (needAssets && needPeople) {
    message = (
      <>
        Gói này còn trống. Cần <strong>tài sản</strong> và <strong>người nhận</strong>.
      </>
    );
    actions = (
      <>
        <button type="button" className={SMALL_OUTLINE} onClick={onAddAssets}>
          Thêm tài sản
        </button>
        <button type="button" className={SMALL_OUTLINE} onClick={onAddPeople}>
          Chọn người nhận
        </button>
      </>
    );
  } else if (needPeople) {
    message = (
      <>
        Còn thiếu <strong>người nhận</strong>. Gói đã có tài sản, chỉ cần chọn ai sẽ nhận là xong.
      </>
    );
    actions = (
      <button type="button" className={SMALL_DARK} onClick={onAddPeople}>
        Chọn người nhận
      </button>
    );
  } else {
    message = (
      <>
        Còn thiếu <strong>tài sản</strong>. Gói đã có người nhận, chỉ cần thêm tài sản là xong.
      </>
    );
    actions = (
      <button type="button" className={SMALL_DARK} onClick={onAddAssets}>
        Thêm tài sản
      </button>
    );
  }
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EADFC4] bg-[#F7F1E1] px-4 py-3"
    >
      <p className="flex min-w-0 items-center gap-3 text-sm text-[#4D4D4B]">
        <span
          aria-hidden="true"
          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#E0C486] text-xs font-bold text-[#0A281E]"
        >
          !
        </span>
        <span>{message}</span>
      </p>
      <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
    </div>
  );
}

/** Thẻ một gói bàn giao: trạng thái, chip tài sản và người nhận, và chỗ bổ sung ngay phần còn thiếu. */
export function GroupCard({
  group,
  assetsById,
  beneficiariesById,
  onRename,
  onAddMembers,
}: GroupCardProps) {
  const ready = group.status === "READY";
  // Ưu tiên lý do do server trả; nếu thiếu thì suy ra từ số thành viên hiện có.
  let needAssets = group.missingRequirements.includes("NO_ASSET");
  let needPeople = group.missingRequirements.includes("NO_DESIGNATION");
  if (!ready && !needAssets && !needPeople) {
    needAssets = group.assetIds.length === 0;
    needPeople = group.beneficiaryIds.length === 0;
  }

  const assetChips: ChipOverflowItem[] = [];
  for (const id of group.assetIds) {
    const asset = assetsById.get(id);
    if (asset) {
      assetChips.push({ id, label: asset.name, detail: assetKindLabel(asset.kind) });
    } else {
      assetChips.push({ id, label: "Tài sản chưa tải được tên" });
    }
  }
  const peopleChips: ChipOverflowItem[] = [];
  for (const id of group.beneficiaryIds) {
    const person = beneficiariesById.get(id);
    if (person) {
      peopleChips.push({
        id,
        label: person.fullName,
        detail: maskedCitizenId(person.citizenIdLast4),
      });
    } else {
      peopleChips.push({ id, label: "Người nhận chưa tải được tên" });
    }
  }

  const detailLink = ROUTES.DASHBOARD.GROUP_DETAIL(group.id);
  const showNotice = !ready && (needAssets || needPeople);

  return (
    <li className="space-y-4 rounded-2xl border border-heritage-border bg-[#FBFAF5] p-5 shadow-[0_1px_2px_rgba(10,40,30,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h3 className="break-words text-lg font-semibold text-[#0A281E]">{group.name}</h3>
          {ready && (
            <Chip tone="success" className="gap-1">
              <Check className="size-3.5" aria-hidden="true" />
              Sẵn sàng
            </Chip>
          )}
          {!ready && (
            <Chip tone="warning" className="border border-[#E6D4A8]">
              Chưa sẵn sàng
            </Chip>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button type="button" className={SMALL_OUTLINE} onClick={() => onRename(group)}>
            Đổi tên
          </button>
          <Link to={detailLink} aria-label={`Mở gói bàn giao ${group.name}`} className={SMALL_DARK}>
            Xem chi tiết
            <ArrowRight className="ml-1.5 size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {showNotice && (
        <MissingNotice
          needAssets={needAssets}
          needPeople={needPeople}
          onAddAssets={() => onAddMembers(group, "assets")}
          onAddPeople={() => onAddMembers(group, "beneficiaries")}
        />
      )}

      {/* Gói trống hoàn toàn thì hộp cảnh báo đã đủ, không lặp hai cột rỗng. */}
      {(group.assetIds.length > 0 || group.beneficiaryIds.length > 0) && (
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,14rem)]">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-semibold text-[#4D4D4B]">
              {group.assetIds.length} tài sản trong gói
            </p>
            {assetChips.length > 0 && (
              <ChipOverflow
                items={assetChips}
                visibleCount={2}
                popupTitle={`${assetChips.length} tài sản trong gói`}
                searchPlaceholder={`Tìm trong ${assetChips.length} tài sản…`}
                footer={
                  <Link to={detailLink} className={LINK_STYLE}>
                    Sửa danh sách
                  </Link>
                }
              />
            )}
            {assetChips.length === 0 && (
              <p className="text-xs text-heritage-muted">Chưa có tài sản</p>
            )}
          </div>
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-semibold text-[#4D4D4B]">Người nhận</p>
            {peopleChips.length > 0 && (
              <ChipOverflow
                items={peopleChips}
                withInitial
                visibleCount={2}
                popupTitle={`${peopleChips.length} người nhận của gói`}
                searchPlaceholder={`Tìm trong ${peopleChips.length} người nhận…`}
                footer={
                  <Link to={ROUTES.DASHBOARD.BENEFICIARIES} className={LINK_STYLE}>
                    Quản lý người nhận
                  </Link>
                }
              />
            )}
            {peopleChips.length === 0 && (
              <p className="text-xs font-medium text-[#7A5B25]">Chưa có ai</p>
            )}
            {peopleChips.length > 0 && (
              <button
                type="button"
                className={SMALL_OUTLINE}
                onClick={() => onAddMembers(group, "beneficiaries")}
              >
                <Plus className="size-3.5" aria-hidden="true" />
                Thêm người nhận
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
