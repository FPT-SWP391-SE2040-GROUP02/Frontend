import { compactButton } from "@/shared/ui/SectionCard";
import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { Chip } from "@/shared/ui/heritageKit";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";
import { divisionAssets, pairKey, type DivisionAsset } from "../model/divisionView";
import type { HandoverRecord } from "../model/handoverRecord.schema";

type View = "assets" | "people";
type Filter = "all" | "empty" | "differs";

const FIELD = "h-9 rounded-[10px] border border-heritage-border bg-white px-3 text-sm";
const CHIP =
  "inline-flex items-center gap-1 rounded-full border border-heritage-border bg-heritage-sunken py-1 pl-3 pr-1 text-sm font-medium";
const matches = (text: string, query: string) => text.toLocaleLowerCase("vi-VN").includes(query);

const CHIP_BUTTON =
  "inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-heritage-muted focus-visible:outline-2 focus-visible:outline-heritage-gold-hover disabled:pointer-events-none disabled:opacity-50";

/** Đánh dấu người do luật sư thêm ở biên bản này (sửa, xóa được). */
function AddedTag() {
  return (
    <span className="shrink-0 whitespace-nowrap" title="Do bạn thêm ở biên bản này">
      <Chip tone="success">Mới</Chip>
    </span>
  );
}

/** Một thẻ đã chọn kèm nút gỡ; người do luật sư thêm có thêm nút sửa. */
function RemovableChip({
  text,
  removeLabel,
  disabled,
  onRemove,
  editLabel,
  onEdit,
}: {
  text: string;
  removeLabel: string;
  disabled: boolean;
  onRemove: () => void;
  editLabel?: string;
  onEdit?: () => void;
}) {
  return (
    <span className={CHIP}>
      {text}
      {onEdit && (
        <>
          <span className="ml-1">
            <AddedTag />
          </span>
          <button
            type="button"
            aria-label={editLabel}
            disabled={disabled}
            onClick={onEdit}
            className={`${CHIP_BUTTON} hover:text-heritage-primary`}
          >
            <Pencil className="size-3.5" aria-hidden="true" />
          </button>
        </>
      )}
      <button
        type="button"
        aria-label={removeLabel}
        disabled={disabled}
        onClick={onRemove}
        className={`${CHIP_BUTTON} hover:text-heritage-danger`}
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </span>
  );
}

/** Hộp chọn người nhận cho một tài sản; có ô tìm để dùng được khi kho có nhiều người. */
function PeoplePicker({
  record,
  asset,
  selected,
  rejected,
  disabled,
  onToggle,
  onClose,
}: {
  record: HandoverRecord;
  asset: DivisionAsset;
  selected: Set<string>;
  rejected: Set<string>;
  disabled: boolean;
  onToggle: (key: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLocaleLowerCase("vi-VN");
  const ownerIds = new Set(asset.ownerPeople.map((person) => person.id));
  const people = record.availableRecipients.filter(
    (person) => matches(person.fullName, query) || person.citizenId.includes(query),
  );
  const ownerText = asset.ownerPeople.map((person) => person.fullName).join(", ");
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-3 sm:max-w-md">
        <DialogTitle className="text-lg font-semibold">{`Chọn người nhận: ${asset.name}`}</DialogTitle>
        <DialogDescription className="text-sm text-heritage-muted">
          {ownerText ? `Chủ tài sản chia cho: ${ownerText}` : "Chủ tài sản chưa chia tài sản này."}
        </DialogDescription>
        <input
          type="search"
          aria-label="Tìm người nhận"
          placeholder="Gõ tên hoặc số căn cước"
          className={`${FIELD} w-full shrink-0`}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <ul className="min-h-0 flex-1 divide-y divide-heritage-border overflow-y-auto">
          {people.map((person) => {
            const key = pairKey(person.beneficiaryId, asset.assetId);
            const blocked = rejected.has(person.beneficiaryId);
            return (
              <li key={key}>
                <label className="flex min-h-12 cursor-pointer items-center gap-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-5 shrink-0 cursor-pointer accent-heritage-primary"
                    aria-label={`${person.fullName} nhận ${asset.name}`}
                    checked={selected.has(key)}
                    disabled={disabled || blocked}
                    onChange={() => onToggle(key)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{person.fullName || "—"}</span>
                    <span className="text-heritage-muted">{`CCCD ${person.citizenId}`}</span>
                  </span>
                  {blocked && <Chip tone="danger">Giấy tờ bị từ chối</Chip>}
                  {!blocked && ownerIds.has(person.beneficiaryId) && (
                    <Chip tone="success">Chủ tài sản đã chia</Chip>
                  )}
                </label>
              </li>
            );
          })}
          {people.length === 0 && (
            <li className="py-4 text-center text-sm text-heritage-muted">Không tìm thấy ai.</li>
          )}
        </ul>
        <button type="button" className={compactButton.dark} onClick={onClose}>
          Xong
        </button>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Chia tài sản cho người nhận dạng danh sách dọc (không phải bảng ngang) nên đông người vẫn đọc được. Xem theo tài sản
 * để chọn người, hoặc theo từng người để soát lại ai nhận gì. Người do luật sư thêm sửa, xóa được ngay trong danh sách.
 */
export function RecipientSplitPanel({
  record,
  selected,
  rejected,
  disabled,
  onToggle,
  onEditPerson,
  onRemovePerson,
}: {
  record: HandoverRecord;
  selected: Set<string>;
  rejected: Set<string>;
  disabled: boolean;
  onToggle: (key: string) => void;
  onEditPerson: (beneficiaryId: string) => void;
  onRemovePerson: (beneficiaryId: string) => void;
}) {
  const editable = new Set(
    record.availableRecipients
      .filter((person) => person.canEdit)
      .map((person) => person.beneficiaryId),
  );
  const [view, setView] = useState<View>("assets");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [pickingId, setPickingId] = useState<string | null>(null);
  const query = search.trim().toLocaleLowerCase("vi-VN");
  const assets = divisionAssets(record, selected);
  const picking = assets.find((asset) => asset.assetId === pickingId);

  if (record.availableRecipients.length === 0) {
    return (
      <p className="text-sm text-heritage-muted">
        Chưa có người nhận nào. Bấm “Thêm người nhận” ở đầu mục này.
      </p>
    );
  }

  const shownAssets = assets.filter((asset) => {
    if (filter === "empty" && asset.people.length > 0) return false;
    if (filter === "differs" && !asset.differsFromOwner) return false;
    return matches(asset.name, query) || asset.people.some((p) => matches(p.fullName, query));
  });
  const shownPeople = record.availableRecipients
    .map((person) => ({
      ...person,
      assets: assets.filter((asset) => asset.people.some((p) => p.id === person.beneficiaryId)),
    }))
    .filter(
      (person) =>
        matches(person.fullName, query) ||
        person.citizenId.includes(query) ||
        person.assets.some((asset) => matches(asset.name, query)),
    );
  const viewButton = (value: View, text: string) => (
    <button
      type="button"
      aria-pressed={view === value}
      className={`min-h-8 cursor-pointer rounded-lg px-3 text-sm font-semibold ${
        view === value ? "bg-heritage-primary text-white" : "text-heritage-muted"
      }`}
      onClick={() => setView(value)}
    >
      {text}
    </button>
  );
  const empty = <li className="py-4 text-center text-heritage-muted">Không có mục nào phù hợp.</li>;

  return (
    <div className="space-y-3">
      <div className="-mx-5 flex flex-wrap items-center gap-2 border-y border-heritage-border bg-heritage-sunken px-5 py-2.5">
        <div className="inline-flex rounded-[10px] border border-heritage-border-strong bg-white p-0.5">
          {viewButton("assets", "Theo tài sản")}
          {viewButton("people", "Theo từng người")}
        </div>
        <input
          type="search"
          aria-label="Tìm tài sản hoặc người nhận"
          placeholder="Tìm tài sản hoặc người nhận"
          className={`${FIELD} min-w-0 flex-1 basis-48`}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {view === "assets" && (
          <select
            aria-label="Lọc tài sản"
            className={FIELD}
            value={filter}
            onChange={(event) => setFilter(event.target.value as Filter)}
          >
            <option value="all">Tất cả</option>
            <option value="empty">Chưa chia ai</option>
            {record.ownerSplit.length > 0 && <option value="differs">Khác Chủ tài sản</option>}
          </select>
        )}
      </div>

      <ul
        aria-label={view === "assets" ? "Chia theo tài sản" : "Chia theo từng người"}
        className="-mx-5 !mt-0 max-h-[460px] divide-y divide-heritage-border overflow-y-auto border-b border-heritage-border text-sm"
      >
        {view === "assets" &&
          shownAssets.map((asset, index) => (
            <li key={asset.assetId} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <div className="min-w-0 basis-full sm:basis-2/5">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  <span className="font-normal text-heritage-muted">{index + 1}.</span>
                  <span>{asset.name}</span>
                  {asset.differsFromOwner && <Chip tone="warning">Khác Chủ tài sản</Chip>}
                </p>
                {record.ownerSplit.length > 0 && (
                  <p className="text-heritage-muted">
                    {`Chủ tài sản chia: ${asset.ownerPeople.map((p) => p.fullName).join(", ") || "chưa chia"}`}
                  </p>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                {asset.people.length === 0 && (
                  <span className="italic text-heritage-muted">Chưa chia cho ai</span>
                )}
                {asset.people.map((person) => (
                  <RemovableChip
                    key={person.id}
                    text={person.fullName}
                    removeLabel={`Gỡ ${person.fullName} khỏi ${asset.name}`}
                    disabled={disabled}
                    onRemove={() => onToggle(pairKey(person.id, asset.assetId))}
                    editLabel={`Sửa người nhận ${person.fullName}`}
                    onEdit={editable.has(person.id) ? () => onEditPerson(person.id) : undefined}
                  />
                ))}
              </div>
              <button
                type="button"
                className={compactButton.outline}
                disabled={disabled}
                aria-label={`Chọn người nhận ${asset.name}`}
                onClick={() => setPickingId(asset.assetId)}
              >
                {`Chọn người (${asset.people.length})`}
              </button>
            </li>
          ))}
        {view === "people" &&
          shownPeople.map((person) => (
            <li key={person.beneficiaryId} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <div className="min-w-0 basis-full sm:basis-2/5">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  <span>{person.fullName || "—"}</span>
                  {person.canEdit && <AddedTag />}
                </p>
                <p className="text-heritage-muted">{`CCCD ${person.citizenId} · ${person.assets.length} tài sản`}</p>
              </div>
              <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                {person.assets.length === 0 && (
                  <span className="italic text-heritage-muted">Chưa được chia tài sản nào</span>
                )}
                {person.assets.map((asset) => (
                  <RemovableChip
                    key={asset.assetId}
                    text={asset.name}
                    removeLabel={`Gỡ ${person.fullName} khỏi ${asset.name}`}
                    disabled={disabled}
                    onRemove={() => onToggle(pairKey(person.beneficiaryId, asset.assetId))}
                  />
                ))}
              </div>
              {person.canEdit && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={compactButton.outline}
                    disabled={disabled}
                    aria-label={`Sửa người nhận ${person.fullName}`}
                    onClick={() => onEditPerson(person.beneficiaryId)}
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    className={compactButton.danger}
                    disabled={disabled}
                    aria-label={`Xóa người nhận ${person.fullName}`}
                    onClick={() => onRemovePerson(person.beneficiaryId)}
                  >
                    Xóa
                  </button>
                </div>
              )}
            </li>
          ))}
        {view === "assets" && shownAssets.length === 0 && empty}
        {view === "people" && shownPeople.length === 0 && empty}
      </ul>

      {picking && (
        <PeoplePicker
          record={record}
          asset={picking}
          selected={selected}
          rejected={rejected}
          disabled={disabled}
          onToggle={onToggle}
          onClose={() => setPickingId(null)}
        />
      )}
    </div>
  );
}
