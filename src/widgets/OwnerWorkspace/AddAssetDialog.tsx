import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, FileText, FileUp, Lock, Plus, Trash2, UserCheck } from "lucide-react";
import { createPackageSchema } from "@/entities/package/model/package.schema";
import { confirmVaultPin } from "@/shared/api/vaultPin";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { formatStorageSize } from "@/shared/lib/formatStorageSize";
import { Button } from "@/shared/ui/button";
import { ChoiceGroup } from "@/shared/ui/ChoiceGroup";
import { InfoRow, Notice } from "@/shared/ui/heritageKit";
import { Stepper, type StepperStep } from "@/shared/ui/Stepper";
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
import { createBeneficiarySchema } from "@/features/beneficiaries/model/beneficiary.schema";
import { beneficiaryService } from "@/features/beneficiaries/api/beneficiaryService";
import { planSetupService } from "@/features/plan-setup/api/planSetupService";
import { vaultPinService } from "@/features/vault-pin/api/vaultPinService";
import { ownerVaultService } from "@/features/vault-management/api/ownerVaultService";
import { ownerVaultKeys } from "@/features/vault-management/model/useOwnerVault";
import { ExecutorNoteSection } from "@/features/vault-management/ui/ExecutorNoteForm";

type AssetKind = "TEXT" | "FILE";
type Role = "BENEFICIARY" | "EXECUTOR";

interface PersonDraft {
  key: number;
  fullName: string;
  email: string;
  /** Mỗi người chỉ một vai: người nhận (cần họ tên, ngày sinh, CCCD) hoặc người thực hiện (chỉ cần email). */
  role: Role;
  dateOfBirth: string;
  citizenId: string;
  phone: string;
}

const NEW_PACKAGE = "__new__";
const NO_PACKAGE = "";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CHECK_DELAY_MS = 500;
const FIELD =
  "w-full rounded-xl border border-heritage-border bg-heritage-surface px-4 py-2 text-sm font-normal";
/** Bốn bước theo thứ tự người dùng làm: chọn loại, nhập chi tiết, gói và người liên quan, xem lại rồi lưu. */
const STEP_LABELS = ["Loại tài sản", "Chi tiết", "Gói và người", "Xem lại"] as const;
const LAST_STEP = STEP_LABELS.length - 1;
const KIND_LABELS: Record<AssetKind, string> = { TEXT: "Ghi chú bí mật", FILE: "Tệp tải lên" };
const ROLE_LABELS: Record<Role, string> = {
  BENEFICIARY: "Người nhận",
  EXECUTOR: "Người thực hiện (Executor)",
};

/** Nút chọn vai trò dạng chip; mỗi người chỉ chọn một vai. */
function RoleChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  let style =
    "border-heritage-border bg-heritage-surface text-heritage-text hover:bg-heritage-neutral-bg";
  if (active) {
    style = "border-heritage-sidebar bg-heritage-sidebar text-white";
  }
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors ${style}`}
    >
      <span
        className={`inline-flex size-4 items-center justify-center rounded-full border ${
          active ? "border-white bg-white text-heritage-on-gold" : "border-heritage-border"
        }`}
      >
        {active && <Check className="size-3" aria-hidden="true" />}
      </span>
      {label}
    </button>
  );
}

/** Báo cho Owner biết email định mời làm Executor đã có tài khoản chưa (hỏi sau khi ngừng gõ). */
function ExecutorAccountHint({ vaultId, email }: { vaultId: string; email: string }) {
  const [settled, setSettled] = useState("");
  const normalized = email.trim().toLowerCase();
  useEffect(() => {
    const timer = setTimeout(() => setSettled(normalized), CHECK_DELAY_MS);
    return () => clearTimeout(timer);
  }, [normalized]);
  const valid = EMAIL_PATTERN.test(settled);
  const query = useQuery({
    queryKey: ["executor-account", vaultId, settled],
    queryFn: ({ signal }) => planSetupService.checkExecutorAccount(vaultId, settled, signal),
    enabled: valid,
    retry: false,
    staleTime: 60_000,
  });
  if (!valid || settled !== normalized || !query.data) {
    return null;
  }
  if (query.data.accountExists) {
    return (
      <p
        role="status"
        className="flex items-center gap-2 text-sm font-medium text-heritage-success"
      >
        <UserCheck className="size-4" aria-hidden="true" />
        Người này đã có tài khoản trên LegacyVault. Lời mời sẽ gắn vào tài khoản đó.
      </p>
    );
  }
  return (
    <p role="status" className="text-sm text-heritage-muted">
      Email này chưa có tài khoản. Lời mời sẽ được gửi qua email.
    </p>
  );
}

/**
 * Thêm tài sản trong một hộp thoại: tài sản, gói bàn giao, người nhận / người thực hiện (chọn vai trò dạng nút),
 * rồi xác nhận mã PIN. Lưu theo thứ tự: tài sản, gói, gắn tài sản, người nhận, lời mời Executor.
 * Tài sản lỗi thì dừng; các bước sau lỗi thì báo số lượng, không làm mất tài sản đã lưu.
 */
export function AddAssetDialog({
  vaultId,
  remainingBytes,
  packages,
  onClose,
}: {
  vaultId: string;
  remainingBytes: number;
  packages: Array<{ id: string; name: string }>;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const [kind, setKind] = useState<AssetKind>("TEXT");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [packageChoice, setPackageChoice] = useState(NO_PACKAGE);
  const [newPackageName, setNewPackageName] = useState("");
  const [people, setPeople] = useState<PersonDraft[]>([]);
  const [nextKey, setNextKey] = useState(1);
  const [formError, setFormError] = useState("");
  const [partialNote, setPartialNote] = useState("");
  const [step, setStep] = useState(0);

  function addPerson(): void {
    setPeople([
      ...people,
      {
        key: nextKey,
        fullName: "",
        email: "",
        role: "BENEFICIARY",
        dateOfBirth: "",
        citizenId: "",
        phone: "",
      },
    ]);
    setNextKey(nextKey + 1);
  }
  function patchPerson(key: number, patch: Partial<PersonDraft>): void {
    setPeople(people.map((person) => (person.key === key ? { ...person, ...patch } : person)));
  }
  function setRole(person: PersonDraft, role: Role): void {
    patchPerson(person.key, { role });
  }

  /** Bước 2: tên và nội dung hoặc tệp của tài sản. */
  function validateAsset(): string {
    if (!name.trim()) {
      return "Nhập tên tài sản.";
    }
    if (kind === "TEXT" && !content.trim()) {
      return "Nhập nội dung bí mật.";
    }
    if (kind === "FILE") {
      const fileError = validateAssetFile(file, remainingBytes);
      if (fileError) {
        return fileError;
      }
    }
    return "";
  }

  /** Bước 3: gói bàn giao và những người liên quan. */
  function validateLinks(): string {
    if (packageChoice === NEW_PACKAGE) {
      const parsed = createPackageSchema.safeParse({ name: newPackageName, description: "" });
      if (!parsed.success) {
        return parsed.error.issues[0].message;
      }
    }
    let executorCount = 0;
    let needsPackage = false;
    for (const person of people) {
      let label = person.email.trim() || "chưa nhập email";
      if (person.role === "BENEFICIARY") {
        label = person.fullName.trim() || label;
      }
      if (!EMAIL_PATTERN.test(person.email.trim())) {
        return `Nhập email hợp lệ cho "${label}".`;
      }
      if (person.role === "EXECUTOR") {
        executorCount += 1;
      }
      if (person.role === "BENEFICIARY") {
        needsPackage = true;
        const parsed = createBeneficiarySchema.safeParse({
          fullName: person.fullName.trim(),
          dateOfBirth: person.dateOfBirth,
          email: person.email.trim(),
          phone: person.phone.trim() || null,
          citizenId: person.citizenId.trim(),
        });
        if (!parsed.success) {
          return `Người nhận "${label}": nhập đủ họ tên, ngày sinh, CCCD và email hợp lệ.`;
        }
      }
    }
    if (executorCount > 1) {
      return "Mỗi kho chỉ có một người thực hiện. Bỏ vai trò Executor của người còn lại.";
    }
    if (needsPackage && packageChoice === NO_PACKAGE) {
      return "Chọn hoặc tạo một gói bàn giao để gắn người nhận.";
    }
    return "";
  }

  /** Sang bước kế khi bước hiện tại hợp lệ; chưa hợp lệ thì ở lại và báo lỗi. */
  function goNext(): void {
    let problem = "";
    if (step === 1) {
      problem = validateAsset();
    }
    if (step === 2) {
      problem = validateLinks();
    }
    setFormError(problem);
    if (!problem) {
      setStep(Math.min(step + 1, LAST_STEP));
    }
  }

  async function submit(): Promise<void> {
    setPartialNote("");
    const assetProblem = validateAsset();
    const problem = assetProblem || validateLinks();
    setFormError(problem);
    if (problem) {
      setStep(assetProblem ? 1 : 2);
      return;
    }
    // Bước PIN: hỏi một lần trước khi lưu; các yêu cầu sau dùng cơ chế PIN chung của ứng dụng.
    const confirmation = await confirmVaultPin(vaultId, (pin) =>
      vaultPinService.verify(vaultId, pin),
    );
    if (!confirmation.confirmed) {
      return;
    }
    const failures: string[] = [];
    const saved = await action.execute(
      async () => {
        let asset;
        if (kind === "TEXT") {
          asset = await backendAssetService.createText(vaultId, {
            name: name.trim(),
            description,
            content,
          });
        } else {
          asset = await backendAssetService.upload(vaultId, file!, name.trim(), description);
        }
        let packageId = packageChoice;
        if (packageChoice === NEW_PACKAGE) {
          try {
            const created = await ownerVaultService.createPackage(vaultId, {
              name: newPackageName,
              description: "",
            });
            packageId = created.id;
          } catch {
            packageId = NO_PACKAGE;
            failures.push("gói bàn giao mới");
          }
        }
        if (packageId !== NO_PACKAGE) {
          try {
            await ownerVaultService.changeMember(vaultId, packageId, "assets", asset.id, true);
          } catch {
            failures.push("việc thêm tài sản vào gói");
          }
        }
        for (const person of people) {
          const label = person.fullName.trim() || person.email.trim();
          if (person.role === "BENEFICIARY") {
            try {
              const created = await beneficiaryService.create(vaultId, {
                fullName: person.fullName.trim(),
                dateOfBirth: person.dateOfBirth,
                email: person.email.trim(),
                phone: person.phone.trim() || null,
                citizenId: person.citizenId.trim(),
              });
              if (packageId !== NO_PACKAGE) {
                await ownerVaultService.changeMember(
                  vaultId,
                  packageId,
                  "beneficiaries",
                  created.id,
                  true,
                );
              }
            } catch {
              failures.push(`người nhận ${label}`);
            }
          }
          if (person.role === "EXECUTOR") {
            try {
              await planSetupService.invite(vaultId, {
                email: person.email.trim(),
                beneficiaryId: null,
              });
            } catch {
              failures.push(`lời mời Executor ${label}`);
            }
          }
        }
        return failures.length;
      },
      () => {
        void client.invalidateQueries({ queryKey: ownerVaultKeys.all });
        void client.invalidateQueries({ queryKey: ["vault-assets", vaultId] });
        void client.invalidateQueries({ queryKey: ["vault-beneficiaries", vaultId] });
        void client.invalidateQueries({ queryKey: ["plan-setup", vaultId] });
      },
    );
    if (saved && failures.length === 0) {
      onClose();
    }
    if (saved && failures.length > 0) {
      setPartialNote(
        `Đã lưu tài sản nhưng chưa hoàn tất: ${failures.join(", ")}. Mở gói bàn giao hoặc trang người nhận để làm lại.`,
      );
    }
  }

  const locked = action.pending || action.succeeded;
  const isLast = step === LAST_STEP;
  const steps: StepperStep[] = STEP_LABELS.map((label, index) => {
    let state: StepperStep["state"] = "todo";
    if (index < step) {
      state = "done";
    }
    if (index === step) {
      state = "current";
    }
    return { id: label, label, state };
  });
  let packageSummary = "Chưa thêm vào gói nào";
  if (packageChoice === NEW_PACKAGE) {
    packageSummary = `Gói mới: ${newPackageName.trim() || "chưa đặt tên"}`;
  } else if (packageChoice !== NO_PACKAGE) {
    packageSummary = packages.find((item) => item.id === packageChoice)?.name ?? "Gói đã chọn";
  }
  let contentSummary = "Chưa chọn tệp";
  if (kind === "TEXT") {
    contentSummary = `Đã nhập ${content.trim().length} ký tự, sẽ được mã hóa`;
  } else if (file) {
    contentSummary = `${file.name} (${formatStorageSize(file.size)})`;
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thêm tài sản</DialogTitle>
          <DialogDescription>
            Làm lần lượt bốn bước: chọn loại, nhập chi tiết, chọn gói và người liên quan, rồi xem
            lại. Bạn sẽ nhập mã PIN kho ở bước cuối để lưu.
          </DialogDescription>
        </DialogHeader>
        <Stepper steps={steps} ariaLabel="Các bước thêm tài sản" />
        <form
          noValidate
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (isLast) {
              void submit();
            } else {
              goNext();
            }
          }}
        >
          <fieldset disabled={locked} className="space-y-6">
            <section aria-label="Chọn loại tài sản" hidden={step !== 0} className="space-y-3">
              <h3 className="text-sm font-semibold">Bạn muốn lưu gì?</h3>
              <ChoiceGroup<AssetKind>
                ariaLabel="Loại tài sản"
                columns={2}
                value={kind}
                onChange={setKind}
                options={[
                  {
                    value: "TEXT",
                    label: KIND_LABELS.TEXT,
                    description: "Mật khẩu, cụm từ khôi phục hoặc lời nhắn bạn gõ vào.",
                    icon: FileText,
                  },
                  {
                    value: "FILE",
                    label: KIND_LABELS.FILE,
                    description: "Giấy tờ, ảnh hoặc tài liệu từ máy của bạn.",
                    icon: FileUp,
                  },
                ]}
              />
            </section>

            <section aria-label="Tài sản" hidden={step !== 1} className="space-y-3">
              <h3 className="text-sm font-semibold">Thông tin tài sản</h3>
              <label className="block space-y-2 text-sm">
                Tên tài sản *
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Ví điện tử MoMo"
                />
              </label>
              <label className="block space-y-2 text-sm">
                Ghi chú cho người nhận
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Không nhập mật khẩu hay bí mật vào ô này"
                  className="min-h-16"
                />
              </label>
              {kind === "TEXT" && (
                <label className="block space-y-2 text-sm">
                  Nội dung bí mật *
                  <Textarea
                    autoComplete="off"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-24"
                  />
                </label>
              )}
              {kind === "FILE" && (
                <label className="block space-y-2 text-sm">
                  Tệp tài sản *
                  <Input
                    type="file"
                    className="h-auto py-2"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </section>

            <div hidden={step !== 2} className="space-y-6">
              <section aria-label="Gói bàn giao" className="space-y-3">
                <h3 className="text-sm font-semibold">Gói bàn giao</h3>
                <select
                  aria-label="Gói bàn giao"
                  value={packageChoice}
                  onChange={(e) => setPackageChoice(e.target.value)}
                  className={FIELD}
                >
                  <option value={NO_PACKAGE}>Chưa thêm vào gói nào</option>
                  {packages.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                  <option value={NEW_PACKAGE}>+ Tạo gói bàn giao mới</option>
                </select>
                {packageChoice === NEW_PACKAGE && (
                  <Input
                    aria-label="Tên gói bàn giao mới"
                    placeholder="Tên gói mới, ví dụ: Giấy tờ gia đình"
                    value={newPackageName}
                    onChange={(e) => setNewPackageName(e.target.value)}
                  />
                )}
              </section>

              <section aria-label="Người nhận và người thực hiện" className="space-y-3">
                <h3 className="text-sm font-semibold">Người nhận và người thực hiện</h3>
                {people.map((person) => {
                  const isBeneficiary = person.role === "BENEFICIARY";
                  const isExecutor = person.role === "EXECUTOR";
                  return (
                    <div
                      key={person.key}
                      className="space-y-3 rounded-2xl border border-heritage-border p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div
                          className="flex flex-wrap gap-2"
                          role="group"
                          aria-label="Vai trò (chọn một)"
                        >
                          {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
                            <RoleChip
                              key={role}
                              label={ROLE_LABELS[role]}
                              active={person.role === role}
                              onClick={() => setRole(person, role)}
                            />
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          aria-label="Bỏ người này"
                          onClick={() =>
                            setPeople(people.filter((item) => item.key !== person.key))
                          }
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                      {isBeneficiary && (
                        <Input
                          aria-label="Họ và tên"
                          placeholder="Họ và tên *"
                          value={person.fullName}
                          onChange={(e) => patchPerson(person.key, { fullName: e.target.value })}
                        />
                      )}
                      <Input
                        type="email"
                        aria-label="Email"
                        placeholder="Email *"
                        value={person.email}
                        onChange={(e) => patchPerson(person.key, { email: e.target.value })}
                      />
                      {isExecutor && <ExecutorAccountHint vaultId={vaultId} email={person.email} />}
                      {isBeneficiary && (
                        <div className="grid gap-2 sm:grid-cols-3">
                          <Input
                            type="date"
                            aria-label="Ngày sinh"
                            value={person.dateOfBirth}
                            onChange={(e) =>
                              patchPerson(person.key, { dateOfBirth: e.target.value })
                            }
                          />
                          <Input
                            aria-label="Số CCCD"
                            placeholder="Số CCCD *"
                            autoComplete="off"
                            value={person.citizenId}
                            onChange={(e) => patchPerson(person.key, { citizenId: e.target.value })}
                          />
                          <Input
                            aria-label="Số điện thoại"
                            placeholder="Số điện thoại"
                            value={person.phone}
                            onChange={(e) => patchPerson(person.key, { phone: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
                <Button type="button" variant="outline" onClick={addPerson}>
                  <Plus className="size-4" aria-hidden="true" />
                  Thêm người
                </Button>
              </section>

              <ExecutorNoteSection />
            </div>

            <section aria-label="Xem lại" hidden={step !== 3} className="space-y-4">
              <h3 className="text-sm font-semibold">Kiểm tra lại trước khi lưu</h3>
              <dl className="rounded-2xl border border-heritage-border px-4 py-2">
                <InfoRow label="Loại">{KIND_LABELS[kind]}</InfoRow>
                <InfoRow label="Tên">{name.trim() || "Chưa nhập"}</InfoRow>
                <InfoRow label="Ghi chú">{description.trim() || "Không có"}</InfoRow>
                <InfoRow label={kind === "TEXT" ? "Nội dung" : "Tệp"}>{contentSummary}</InfoRow>
                <InfoRow label="Gói bàn giao">{packageSummary}</InfoRow>
                <InfoRow label="Người liên quan">
                  {people.length === 0 && "Không thêm ai"}
                  {people.length > 0 && (
                    <ul className="space-y-1">
                      {people.map((person) => (
                        <li key={person.key}>
                          {person.fullName.trim() || person.email.trim() || "Chưa đặt tên"} ·{" "}
                          {ROLE_LABELS[person.role]}
                        </li>
                      ))}
                    </ul>
                  )}
                </InfoRow>
              </dl>
              <p className="flex items-start gap-2 text-xs leading-5 text-heritage-muted">
                <Lock
                  className="mt-0.5 size-3.5 shrink-0 text-heritage-success"
                  aria-hidden="true"
                />
                Nội dung được mã hóa AES-256-GCM trên máy chủ. Bấm lưu sẽ yêu cầu mã PIN của kho.
              </p>
            </section>
          </fieldset>
          {formError && (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          )}
          {partialNote && (
            <Notice tone="warning" role="alert">
              {partialNote}
            </Notice>
          )}
          {action.error && (
            <p role="alert" className="text-sm text-destructive">
              {action.error}
            </p>
          )}
          {action.pending && (
            <p role="status" className="text-sm text-heritage-muted">
              Đang lưu…
            </p>
          )}
          <DialogFooter>
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={locked}
                onClick={() => {
                  setFormError("");
                  setStep(step - 1);
                }}
              >
                Quay lại
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={action.pending}
              onClick={onClose}
            >
              {action.succeeded ? "Đóng" : "Hủy"}
            </Button>
            {!isLast && (
              <Button type="submit" size="lg" variant="dark">
                Tiếp tục
              </Button>
            )}
            {isLast && (
              <Button type="submit" size="lg" variant="dark" disabled={locked}>
                Xác nhận PIN và lưu
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
