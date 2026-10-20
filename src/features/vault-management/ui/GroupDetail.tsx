import { useState, type FormEvent, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import type { PackageResponse } from "@/entities/package/model/package.types";
import { createPackageSchema } from "@/entities/package/model/package.schema";
import { ROUTES } from "@/shared/config/routes.config";
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
import { ownerVaultService } from "../api/ownerVaultService";
import { ownerVaultKeys } from "../model/useOwnerVault";

interface Option {
  id: string;
  label: string;
  /** Dòng phụ dưới tên (ví dụ loại mục: Tệp, Văn bản). */
  detail?: string;
}

type Relation = "assets" | "beneficiaries";

const CARD = "rounded-2xl border border-heritage-border bg-heritage-surface p-6";
const DANGER_BUTTON = "border-red-300 text-red-700 hover:bg-red-50";
const GOLD_BUTTON = "bg-[#E0C486] font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B]";
const missingLabels: Record<string, string> = {
  NO_ASSET: "chưa có mục nào",
  NO_DESIGNATION: "chưa có người nhận",
};

interface MemberCardProps {
  title: string;
  relation: Relation;
  assigned: Option[];
  available: Option[];
  removeLabel: string;
  addLabel: string;
  selectLabel: string;
  emptyText: string;
  disabled: boolean;
  note: ReactNode;
  onRemove: (relation: Relation, id: string) => void;
  onAdd: (relation: Relation, id: string) => void;
}

/** Một khối "Mục trong nhóm" hoặc "Người nhận của nhóm": danh sách đã gắn, nút gỡ, và chọn thêm. */
function MemberCard(props: MemberCardProps) {
  const { relation, assigned, available, disabled } = props;
  const rows: ReactNode[] = [];
  for (const item of assigned) {
    rows.push(
      <li
        key={item.id}
        className="flex items-center justify-between gap-3 border-b border-heritage-border py-4 last:border-b-0"
      >
        <div className="min-w-0">
          <p className="break-words font-semibold">{item.label}</p>
          {item.detail && <p className="text-xs text-heritage-muted">{item.detail}</p>}
        </div>
        <Button
          variant="outline"
          size="lg"
          className={`shrink-0 ${DANGER_BUTTON}`}
          disabled={disabled}
          onClick={() => props.onRemove(relation, item.id)}
        >
          {props.removeLabel}
        </Button>
      </li>,
    );
  }
  const options: ReactNode[] = [];
  for (const item of available) {
    options.push(
      <option key={item.id} value={item.id}>
        {item.label}
      </option>,
    );
  }
  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const id = new FormData(event.currentTarget).get("memberId");
    if (typeof id === "string" && id !== "") {
      props.onAdd(relation, id);
      event.currentTarget.reset();
    }
  }
  return (
    <section aria-label={props.title} className={CARD}>
      <h2 className="text-xl font-medium text-heritage-primary">{props.title}</h2>
      {rows.length === 0 && <p className="mt-4 text-sm text-heritage-muted">{props.emptyText}</p>}
      <ul className="mt-2">{rows}</ul>
      {available.length > 0 && (
        <form className="mt-4 flex flex-wrap gap-3" onSubmit={submit}>
          <select
            name="memberId"
            aria-label={props.selectLabel}
            required
            disabled={disabled}
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-heritage-border bg-heritage-surface px-3 text-sm"
          >
            <option value="">{props.selectLabel}</option>
            {options}
          </select>
          <Button type="submit" variant="outline" size="lg" disabled={disabled}>
            {props.addLabel}
          </Button>
        </form>
      )}
      <div className="mt-4 text-xs text-heritage-muted">{props.note}</div>
    </section>
  );
}

/**
 * Chi tiết một Nhóm (container) theo thiết kế: mục trong nhóm, người nhận của nhóm, đổi tên và xóa.
 * Chỉnh sửa một snapshot etag; 409 phải tải lại, không ghi đè bằng etag mới. Xóa là lưu trữ, không xóa dữ liệu.
 */
export function GroupDetail({
  container,
  assets,
  beneficiaries,
}: {
  container: PackageResponse;
  assets: Option[];
  beneficiaries: Option[];
}) {
  const [etag, setEtag] = useState(container.etag);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const action = usePrivateAction();
  const client = useQueryClient();
  const navigate = useNavigate();
  const archived = container.status === "ARCHIVED";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<{ name: string }>({
    resolver: zodResolver(createPackageSchema.pick({ name: true })),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { name: container.name },
  });

  function publish(result: PackageResponse): void {
    setEtag(result.etag);
    reset({ name: result.name });
    setConfirm(false);
    client.setQueryData(ownerVaultKeys.package(result.vaultId, result.id), result);
    void client.invalidateQueries({ queryKey: ownerVaultKeys.all });
    void client.invalidateQueries({ queryKey: ["vault-beneficiaries", result.vaultId] });
    void client.invalidateQueries({ queryKey: ["plan-setup", result.vaultId] });
  }

  function removeMember(relation: Relation, id: string): void {
    void action.execute(
      () =>
        ownerVaultService.changeMember(
          container.vaultId,
          container.id,
          relation,
          id,
          false,
          confirm,
        ),
      publish,
    );
  }

  function addMember(relation: Relation, id: string): void {
    void action.execute(
      () => ownerVaultService.changeMember(container.vaultId, container.id, relation, id, true),
      publish,
    );
  }

  function archive(): void {
    void action.execute(
      () => ownerVaultService.archivePackage(container.vaultId, container.id, confirm),
      (result) => {
        publish(result);
        setDeleting(false);
        navigate(`${ROUTES.DASHBOARD.ASSETS}?tab=groups`);
      },
    );
  }

  // Tên hiển thị của từng id; id nằm ngoài trang lựa chọn hiện tại vẫn gỡ được.
  function pick(options: Option[], ids: string[]): { assigned: Option[]; available: Option[] } {
    const assigned: Option[] = [];
    for (const id of ids) {
      let found: Option = { id, label: "Mục đã gắn (không nằm trong trang lựa chọn hiện tại)" };
      for (const option of options) {
        if (option.id === id) {
          found = option;
        }
      }
      assigned.push(found);
    }
    const available: Option[] = [];
    for (const option of options) {
      if (!ids.includes(option.id)) {
        available.push(option);
      }
    }
    return { assigned, available };
  }
  const assetOptions = pick(assets, container.assetIds);
  const personOptions = pick(beneficiaries, container.beneficiaryIds);

  let statusLabel = "Chưa sẵn sàng";
  let statusStyle = "bg-amber-100 text-amber-800";
  if (container.status === "READY") {
    statusLabel = "Sẵn sàng";
    statusStyle = "bg-green-100 text-green-800";
  } else if (archived) {
    statusLabel = "Đã lưu trữ";
    statusStyle = "bg-heritage-primary/10 text-heritage-muted";
  }
  const names: string[] = [];
  for (const person of personOptions.assigned) {
    names.push(person.label);
  }
  let peopleLine = "chưa có";
  if (names.length > 0) {
    peopleLine = names.join(", ");
  }
  const missing: string[] = [];
  for (const code of container.missingRequirements) {
    if (Object.hasOwn(missingLabels, code)) {
      missing.push(missingLabels[code]);
    }
  }
  // Thông báo "cần gói trả phí" kèm đường nâng cấp thay vì chỉ báo lỗi chung.
  const needsUpgrade = action.error.includes("gói dịch vụ trả phí");
  const blocked = action.pending || archived;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="break-words text-2xl font-medium text-heritage-primary">
            {container.name}
          </h2>
          <p className="mt-1 text-sm text-heritage-muted">
            {container.assetIds.length} mục · Người nhận: {peopleLine}
          </p>
          {missing.length > 0 && !archived && (
            <p className="mt-1 text-sm text-heritage-muted">
              Cần hoàn thiện: {missing.join(", ")}.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle}`}>
            {statusLabel}
          </span>
          <Link
            to={`${ROUTES.DASHBOARD.ASSETS}?tab=groups`}
            className="inline-flex min-h-11 items-center rounded-[20px] border border-heritage-border px-5 text-sm font-semibold hover:bg-heritage-primary/5 focus-visible:outline-2 focus-visible:outline-heritage-gold"
          >
            Quay lại nhóm
          </Link>
        </div>
      </div>
      {archived && (
        <p role="status" className="rounded-xl bg-[#F1E7D0] px-4 py-3 text-sm text-[#7A5B24]">
          Nhóm này đã được lưu trữ nên không chỉnh sửa được.
        </p>
      )}
      {container.status === "READY" && !archived && (
        <label className="flex min-h-11 items-start gap-3 rounded-xl bg-[#F1E7D0] p-4 text-sm leading-6 text-[#7A5B24]">
          <input
            type="checkbox"
            className="mt-1 size-5"
            checked={confirm}
            onChange={(event) => setConfirm(event.target.checked)}
          />
          Tôi đồng ý đưa kế hoạch về Nháp nếu thao tác gỡ hoặc xóa làm mất nhóm Sẵn sàng cuối cùng.
          Bỏ chọn nếu chưa đồng ý.
        </label>
      )}
      {isDirty && (
        <p className="text-sm text-heritage-muted">
          Lưu tên nhóm trước khi thay đổi mục, người nhận hoặc xóa nhóm.
        </p>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <MemberCard
          title="Mục trong nhóm"
          relation="assets"
          assigned={assetOptions.assigned}
          available={assetOptions.available}
          removeLabel="Gỡ khỏi nhóm"
          addLabel="Thêm mục vào nhóm"
          selectLabel="Chọn mục"
          emptyText="Nhóm chưa có mục nào."
          disabled={blocked || isDirty}
          note={null}
          onRemove={removeMember}
          onAdd={addMember}
        />
        <MemberCard
          title="Người nhận của nhóm"
          relation="beneficiaries"
          assigned={personOptions.assigned}
          available={personOptions.available}
          removeLabel="Gỡ"
          addLabel="Gán người nhận"
          selectLabel="Chọn người nhận"
          emptyText="Nhóm chưa có người nhận."
          disabled={blocked || isDirty}
          note={
            <>
              <p>Người nhận được gắn theo nhóm, không gắn từng mục.</p>
              {personOptions.available.length === 0 && (
                <p className="mt-2">
                  Chưa còn hồ sơ nào để gán.{" "}
                  <Link className="underline" to={ROUTES.DASHBOARD.BENEFICIARIES}>
                    Thêm người nhận
                  </Link>
                </p>
              )}
            </>
          }
          onRemove={removeMember}
          onAdd={addMember}
        />
      </div>
      <section aria-label="Đổi tên và xóa nhóm" className={CARD}>
        <h2 className="text-xl font-medium text-heritage-primary">Đổi tên và xóa nhóm</h2>
        <form
          noValidate
          className="mt-4 space-y-4"
          onSubmit={handleSubmit((values) =>
            action.execute(
              () =>
                ownerVaultService.updatePackage(container.vaultId, container.id, {
                  name: values.name,
                  etag,
                }),
              publish,
            ),
          )}
        >
          <label className="block space-y-2 text-sm font-semibold">
            Tên nhóm
            <Input
              disabled={blocked}
              {...register("name")}
              aria-invalid={Boolean(errors.name)}
              className="font-normal"
            />
          </label>
          {errors.name && (
            <p role="alert" className="text-sm text-destructive">
              {errors.name.message}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" size="lg" className={GOLD_BUTTON} disabled={blocked}>
              Lưu
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className={DANGER_BUTTON}
              disabled={blocked || isDirty}
              onClick={() => setDeleting(true)}
            >
              Xóa nhóm
            </Button>
          </div>
        </form>
      </section>
      {action.pending && <p role="status">Đang lưu thay đổi…</p>}
      {action.error && (
        <div role="alert" className="space-y-2 text-sm text-destructive">
          <p>{action.error}</p>
          {needsUpgrade && (
            <Link className="underline" to={ROUTES.BILLING.PLANS}>
              Xem gói dịch vụ
            </Link>
          )}
        </div>
      )}
      {action.succeeded && <p role="status">Đã lưu thay đổi.</p>}
      {deleting && (
        <Dialog open onOpenChange={(open) => !open && !action.pending && setDeleting(false)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Xóa nhóm “{container.name}”?</DialogTitle>
              <DialogDescription>
                Các mục trong nhóm vẫn ở lại kho nhưng sẽ không còn người nhận. Nếu kế hoạch đang
                hoạt động, kế hoạch có thể về Nháp.
              </DialogDescription>
            </DialogHeader>
            <label className="flex items-start gap-3 rounded-lg bg-[#F1E7D0] p-3 text-sm text-[#7A5B24]">
              <input
                type="checkbox"
                className="mt-1 size-5"
                checked={confirm}
                onChange={(event) => setConfirm(event.target.checked)}
              />
              Xóa nhóm cuối cùng có người nhận có thể đưa kế hoạch về Nháp. Tôi đồng ý nếu điều đó
              xảy ra.
            </label>
            {action.error && (
              <p role="alert" className="text-sm text-destructive">
                {action.error}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={action.pending}
                onClick={() => setDeleting(false)}
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="lg"
                disabled={action.pending}
                onClick={archive}
              >
                Xóa nhóm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
