import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { createBeneficiarySchema } from "@/features/beneficiaries/model/beneficiary.schema";
import { beneficiaryService } from "@/features/beneficiaries/api/beneficiaryService";
import { createPackageSchema } from "@/entities/package/model/package.schema";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { backendAssetService } from "@/features/assets/api/backendAssetService";
import { validateAssetFile } from "@/features/assets/model/addAssetForm";
import { ownerVaultService } from "@/features/vault-management/api/ownerVaultService";
import { ownerVaultKeys } from "@/features/vault-management/model/useOwnerVault";

type DraftKind = "TEXT" | "FILE";

interface AssetDraft {
  key: number;
  kind: DraftKind;
  name: string;
  content: string;
  file: File | null;
}

interface PersonDraft {
  key: number;
  fullName: string;
  dateOfBirth: string;
  citizenId: string;
  email: string;
  phone: string;
}

const GOLD_BUTTON = "bg-[#E0C486] font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B]";
const FIELD = "w-full rounded-xl border border-[#BDB8A6] bg-white px-3 py-2 text-sm font-normal";

/**
 * Tạo gói bàn giao, thêm tài sản và người nhận vào gói trong cùng một form: nhập tên gói, tick mục/người
 * nhận đã có và/hoặc nhập mới. Lưu theo thứ tự: tạo gói, tạo mục và người nhận mới, gắn tất cả vào gói.
 */
export function CreatePackageWithAssetsDialog({
  vaultId,
  remainingBytes,
  existingAssets,
  existingPeople,
  onClose,
}: {
  vaultId: string;
  remainingBytes: number;
  existingAssets: Array<{ id: string; name: string }>;
  existingPeople: Array<{ id: string; name: string }>;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<AssetDraft[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [people, setPeople] = useState<PersonDraft[]>([]);
  const [nextKey, setNextKey] = useState(1);
  const [formError, setFormError] = useState("");
  // Gói đã tạo nhưng có mục lỗi: giữ hộp thoại để báo, khóa nút tạo để không tạo trùng gói.
  const [partialNote, setPartialNote] = useState("");

  function toggle(assetId: string): void {
    if (selected.includes(assetId)) {
      setSelected(selected.filter((item) => item !== assetId));
    } else {
      setSelected([...selected, assetId]);
    }
  }
  function togglePerson(personId: string): void {
    if (selectedPeople.includes(personId)) {
      setSelectedPeople(selectedPeople.filter((item) => item !== personId));
    } else {
      setSelectedPeople([...selectedPeople, personId]);
    }
  }
  function addPerson(): void {
    setPeople([
      ...people,
      { key: nextKey, fullName: "", dateOfBirth: "", citizenId: "", email: "", phone: "" },
    ]);
    setNextKey(nextKey + 1);
  }
  function patchPerson(key: number, patch: Partial<PersonDraft>): void {
    setPeople(people.map((person) => (person.key === key ? { ...person, ...patch } : person)));
  }
  function addDraft(): void {
    setDrafts([...drafts, { key: nextKey, kind: "TEXT", name: "", content: "", file: null }]);
    setNextKey(nextKey + 1);
  }
  function patchDraft(key: number, patch: Partial<AssetDraft>): void {
    setDrafts(drafts.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)));
  }
  function validate(): string {
    const parsed = createPackageSchema.safeParse({ name, description });
    if (!parsed.success) {
      return parsed.error.issues[0].message;
    }
    for (const draft of drafts) {
      if (!draft.name.trim()) {
        return "Nhập tên cho mỗi tài sản mới.";
      }
      if (draft.kind === "TEXT" && !draft.content.trim()) {
        return `Nhập nội dung cho "${draft.name}".`;
      }
      if (draft.kind === "FILE") {
        const fileError = validateAssetFile(draft.file, remainingBytes);
        if (fileError) {
          return `${draft.name}: ${fileError}`;
        }
      }
    }
    for (const person of people) {
      const parsedPerson = createBeneficiarySchema.safeParse({
        fullName: person.fullName.trim(),
        dateOfBirth: person.dateOfBirth,
        email: person.email.trim(),
        phone: person.phone.trim() || null,
        citizenId: person.citizenId.trim(),
      });
      if (!parsedPerson.success) {
        return `Người nhận "${person.fullName || "chưa đặt tên"}": nhập đủ họ tên, ngày sinh, CCCD và email hợp lệ.`;
      }
    }
    return "";
  }

  async function submit(): Promise<void> {
    const problem = validate();
    setFormError(problem);
    if (problem) {
      return;
    }
    let failedCount = 0;
    const saved = await action.execute(
      async () => {
        const created = await ownerVaultService.createPackage(vaultId, { name, description });
        const assetIds = [...selected];
        let failed = 0;
        for (const draft of drafts) {
          try {
            let asset;
            if (draft.kind === "TEXT") {
              asset = await backendAssetService.createText(vaultId, {
                name: draft.name,
                content: draft.content,
              });
            } else {
              asset = await backendAssetService.upload(vaultId, draft.file!, draft.name, "");
            }
            assetIds.push(asset.id);
          } catch {
            failed += 1;
          }
        }
        const personIds = [...selectedPeople];
        for (const person of people) {
          try {
            const saved = await beneficiaryService.create(vaultId, {
              fullName: person.fullName.trim(),
              dateOfBirth: person.dateOfBirth,
              email: person.email.trim(),
              phone: person.phone.trim() || null,
              citizenId: person.citizenId.trim(),
            });
            personIds.push(saved.id);
          } catch {
            failed += 1;
          }
        }
        for (const personId of personIds) {
          try {
            await ownerVaultService.changeMember(
              vaultId,
              created.id,
              "beneficiaries",
              personId,
              true,
            );
          } catch {
            failed += 1;
          }
        }
        for (const assetId of assetIds) {
          try {
            await ownerVaultService.changeMember(vaultId, created.id, "assets", assetId, true);
          } catch {
            failed += 1;
          }
        }
        return failed;
      },
      (failed) => {
        failedCount = failed;
        void client.invalidateQueries({ queryKey: ownerVaultKeys.all });
        void client.invalidateQueries({ queryKey: ["vault-assets", vaultId] });
        void client.invalidateQueries({ queryKey: ["vault-beneficiaries", vaultId] });
        void client.invalidateQueries({ queryKey: ["plan-setup", vaultId] });
      },
    );
    if (saved && failedCount === 0) {
      onClose();
    }
    if (saved && failedCount > 0) {
      setPartialNote(
        `Đã tạo gói nhưng ${failedCount} tài sản hoặc người nhận chưa lưu hoặc chưa gắn được. Mở gói bàn giao để thêm lại.`,
      );
    }
  }

  const locked = action.pending || action.succeeded;
  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tạo gói bàn giao</DialogTitle>
          <DialogDescription>
            Nhập tên gói, thêm tài sản và người nhận ngay tại đây. Có thể tick mục đã có hoặc tạo
            mới.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <fieldset disabled={locked} className="space-y-4">
            <label className="block space-y-2 text-sm">
              Tên gói bàn giao
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Giấy tờ gia đình"
              />
            </label>
            <label className="block space-y-2 text-sm">
              Mô tả (không bắt buộc)
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
            {existingAssets.length > 0 && (
              <fieldset className="space-y-2">
                <legend className="text-sm">Tài sản đã có trong kho</legend>
                <ul className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-heritage-border p-2">
                  {existingAssets.map((asset) => (
                    <li key={asset.id}>
                      <label className="flex min-h-9 items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selected.includes(asset.id)}
                          onChange={() => toggle(asset.id)}
                        />
                        <span className="break-words">{asset.name}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            )}
            <div className="space-y-3">
              <p className="text-sm">Tài sản mới</p>
              {drafts.map((draft) => (
                <div
                  key={draft.key}
                  className="space-y-2 rounded-xl border border-heritage-border p-3"
                >
                  <div className="flex items-center gap-2">
                    <select
                      aria-label="Loại tài sản"
                      value={draft.kind}
                      onChange={(e) =>
                        patchDraft(draft.key, {
                          kind: e.target.value === "FILE" ? "FILE" : "TEXT",
                        })
                      }
                      className={`${FIELD} w-auto`}
                    >
                      <option value="TEXT">Ghi chú bí mật</option>
                      <option value="FILE">Tệp tải lên</option>
                    </select>
                    <Input
                      aria-label="Tên tài sản"
                      placeholder="Tên tài sản"
                      value={draft.name}
                      onChange={(e) => patchDraft(draft.key, { name: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      aria-label="Bỏ tài sản này"
                      onClick={() => setDrafts(drafts.filter((item) => item.key !== draft.key))}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                  {draft.kind === "TEXT" && (
                    <Textarea
                      aria-label="Nội dung bí mật"
                      placeholder="Nội dung bí mật"
                      autoComplete="off"
                      value={draft.content}
                      onChange={(e) => patchDraft(draft.key, { content: e.target.value })}
                    />
                  )}
                  {draft.kind === "FILE" && (
                    <Input
                      type="file"
                      aria-label="Tệp tài sản"
                      className="h-auto py-2"
                      onChange={(e) => patchDraft(draft.key, { file: e.target.files?.[0] ?? null })}
                    />
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addDraft}>
                <Plus className="size-4" aria-hidden="true" />
                Thêm tài sản mới
              </Button>
            </div>
            {existingPeople.length > 0 && (
              <fieldset className="space-y-2">
                <legend className="text-sm">Người nhận đã có</legend>
                <ul className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-heritage-border p-2">
                  {existingPeople.map((person) => (
                    <li key={person.id}>
                      <label className="flex min-h-9 items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedPeople.includes(person.id)}
                          onChange={() => togglePerson(person.id)}
                        />
                        <span className="break-words">{person.name}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            )}
            <div className="space-y-3">
              <p className="text-sm">Người nhận mới</p>
              {people.map((person) => (
                <div
                  key={person.key}
                  className="space-y-2 rounded-xl border border-heritage-border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      aria-label="Họ và tên người nhận"
                      placeholder="Họ và tên"
                      value={person.fullName}
                      onChange={(e) => patchPerson(person.key, { fullName: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      aria-label="Bỏ người nhận này"
                      onClick={() => setPeople(people.filter((item) => item.key !== person.key))}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      type="date"
                      aria-label="Ngày sinh người nhận"
                      value={person.dateOfBirth}
                      onChange={(e) => patchPerson(person.key, { dateOfBirth: e.target.value })}
                    />
                    <Input
                      aria-label="CCCD người nhận"
                      placeholder="Số CCCD"
                      autoComplete="off"
                      value={person.citizenId}
                      onChange={(e) => patchPerson(person.key, { citizenId: e.target.value })}
                    />
                    <Input
                      type="email"
                      aria-label="Email người nhận"
                      placeholder="Email"
                      value={person.email}
                      onChange={(e) => patchPerson(person.key, { email: e.target.value })}
                    />
                    <Input
                      aria-label="Số điện thoại người nhận"
                      placeholder="Số điện thoại (không bắt buộc)"
                      value={person.phone}
                      onChange={(e) => patchPerson(person.key, { phone: e.target.value })}
                    />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addPerson}>
                <Plus className="size-4" aria-hidden="true" />
                Thêm người nhận mới
              </Button>
            </div>
          </fieldset>
          {formError && (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          )}
          {partialNote && (
            <p role="alert" className="text-sm text-destructive">
              {partialNote}
            </p>
          )}
          {action.error && (
            <p role="alert" className="text-sm text-destructive">
              {action.error}
            </p>
          )}
          {action.pending && (
            <p role="status" className="text-sm text-heritage-muted">
              Đang lưu gói và tài sản…
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={action.pending}
              onClick={onClose}
            >
              {action.succeeded ? "Đóng" : "Hủy"}
            </Button>
            <Button type="submit" size="lg" className={GOLD_BUTTON} disabled={locked}>
              Tạo gói bàn giao
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
