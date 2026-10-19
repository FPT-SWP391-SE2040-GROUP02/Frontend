import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import type { deathCaseSchema } from "../model/deathCase.schema";
import { deathCaseService } from "../api/deathCaseService";
import { useDeathCaseAction } from "../model/useDeathCaseAction";
type Case = z.infer<typeof deathCaseSchema>;
const schema = z.object({
  ownerFullName: z.string().max(200),
  ownerCitizenId: z.string().max(32),
  dateOfDeath: z.string().regex(/^(?:\d{4}-\d{2}-\d{2})?$/),
  certificateNumber: z.string().max(100),
  issuedOn: z.string().regex(/^(?:\d{4}-\d{2}-\d{2})?$/),
  issuedBy: z.string().max(200),
});
/** Một snapshot hồ sơ; full CCCD/file chỉ nằm trong local form, không cache. */
export function DeathCaseEditor({ record }: { record: Case }) {
  const [etag, setEtag] = useState(record.etag);
  const [confirmed, setConfirmed] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const action = useDeathCaseAction();
  const client = useQueryClient();
  const version = record.currentVersion;
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      ownerFullName: version.ownerFullName ?? "",
      ownerCitizenId: "",
      dateOfDeath: version.dateOfDeath ?? "",
      certificateNumber: version.certificateNumber ?? "",
      issuedOn: version.issuedOn ?? "",
      issuedBy: version.issuedBy ?? "",
    },
  });
  const publish = (result: Case) => {
    setEtag(result.etag);
    setConfirmed(false);
    form.reset({
      ownerFullName: result.currentVersion.ownerFullName ?? "",
      ownerCitizenId: "",
      dateOfDeath: result.currentVersion.dateOfDeath ?? "",
      certificateNumber: result.currentVersion.certificateNumber ?? "",
      issuedOn: result.currentVersion.issuedOn ?? "",
      issuedBy: result.currentVersion.issuedBy ?? "",
    });
    client.setQueryData(["death-case", result.id], result);
    void client.invalidateQueries({ queryKey: ["death-case"] });
    void client.invalidateQueries({ queryKey: ["executor-vaults"] });
  };
  return (
    <section className="space-y-6 rounded-xl border border-heritage-border bg-heritage-surface p-6">
      <h2 className="text-lg font-semibold">Hồ sơ chứng tử · phiên bản {version.versionNo}</h2>
      <p className="text-sm">
        Trạng thái: {record.status} · {version.isDraft ? "Bản nháp" : "Bản đã gửi"}
      </p>
      {record.missingRequirements.length > 0 && (
        <p className="text-sm text-amber-800">
          Chưa đủ thông tin để gửi: {record.missingRequirements.join(", ")}
        </p>
      )}
      {record.ownerNotice && (
        <p className="text-sm">
          Thông báo cho Chủ kho: {record.ownerNotice.status}
          {record.objectionEndsAt && (
            <> · Hạn phản đối: {new Date(record.objectionEndsAt).toLocaleString("vi-VN")}</>
          )}
        </p>
      )}
      <form
        noValidate
        className="space-y-4"
        onSubmit={form.handleSubmit((values) =>
          action.execute(
            () =>
              deathCaseService.update(record.id, {
                ...values,
                etag,
                ownerCitizenId: values.ownerCitizenId || undefined,
                dateOfDeath: values.dateOfDeath || undefined,
                issuedOn: values.issuedOn || undefined,
              }),
            publish,
          ),
        )}
      >
        <fieldset
          disabled={action.pending || !version.isDraft}
          className="grid gap-4 sm:grid-cols-2"
        >
          {(
            [
              ["ownerFullName", "Họ tên Chủ kho", "text"],
              [
                "ownerCitizenId",
                `CCCD (bỏ trống giữ số đã lưu${version.ownerCitizenIdLast4 ? `: ****${version.ownerCitizenIdLast4}` : ""})`,
                "text",
              ],
              ["dateOfDeath", "Ngày mất", "date"],
              ["certificateNumber", "Số giấy chứng tử", "text"],
              ["issuedOn", "Ngày cấp", "date"],
              ["issuedBy", "Nơi cấp", "text"],
            ] as const
          ).map(([name, label, type]) => (
            <label key={name} className="block space-y-2 text-sm">
              {label}
              <Input
                type={type}
                autoComplete="off"
                {...form.register(name)}
                aria-invalid={Boolean(form.formState.errors[name])}
              />
            </label>
          ))}
          <Button type="submit" className="min-h-11 sm:col-span-2">
            Lưu bản nháp
          </Button>
        </fieldset>
        {Object.entries(form.formState.errors).map(([key, error]) => (
          <p key={key} role="alert" className="text-sm text-destructive">
            {error?.message}
          </p>
        ))}
      </form>
      <section className="space-y-3 border-t border-heritage-border pt-4">
        <h3 className="font-semibold">Trang giấy chứng tử ({version.files.length}/10)</h3>
        <p className="text-xs text-heritage-muted">
          PDF/JPEG/PNG/WEBP, tối đa 20 MiB mỗi tệp. Không tự gửi hồ sơ sau khi tải tệp lên.
        </p>
        <ul className="space-y-2">
          {version.files.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm">
                {item.position}. {item.fileName}
              </span>
              <Button
                variant="outline"
                disabled={action.pending || !version.isDraft || form.formState.isDirty}
                onClick={() => {
                  if (window.confirm("Gỡ trang giấy này khỏi bản nháp?"))
                    void action.execute(
                      () => deathCaseService.removeFile(record.id, item.id),
                      publish,
                    );
                }}
              >
                Gỡ trang
              </Button>
            </li>
          ))}
        </ul>
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setFileError("");
            if (
              !file ||
              file.size === 0 ||
              file.size > 20 * 1024 * 1024 ||
              !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)
            ) {
              setFileError("Chọn tệp đúng định dạng, không rỗng, tối đa 20 MiB.");
              return;
            }
            const target = event.currentTarget;
            if (await action.execute(() => deathCaseService.upload(record.id, file), publish)) {
              setFile(null);
              target.reset();
            }
          }}
        >
          <fieldset
            disabled={
              action.pending ||
              !version.isDraft ||
              version.files.length >= 10 ||
              form.formState.isDirty
            }
            className="space-y-3"
          >
            <label className="block space-y-2 text-sm">
              Chọn trang giấy
              <Input
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <Button type="submit" variant="outline">
              Tải trang giấy lên
            </Button>
          </fieldset>
        </form>
        {fileError && (
          <p role="alert" className="text-sm text-destructive">
            {fileError}
          </p>
        )}
      </section>
      {version.isDraft ? (
        <div className="space-y-3 rounded-lg bg-amber-50 p-4">
          <label className="flex min-h-11 items-start gap-3 text-sm leading-6">
            <input
              type="checkbox"
              className="mt-1 size-5"
              checked={confirmed}
              disabled={action.pending}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            Tôi xác nhận bản đã lưu là đúng và muốn gửi xét duyệt. Lần gửi đầu sẽ khóa cấu hình kế
            hoạch bàn giao và bắt đầu quy trình thông báo Chủ kho.
          </label>
          <Button
            disabled={
              action.pending ||
              !confirmed ||
              form.formState.isDirty ||
              record.missingRequirements.length > 0
            }
            onClick={() =>
              void action.execute(() => deathCaseService.submit(record.id, record.etag), publish)
            }
          >
            Xác nhận gửi hồ sơ
          </Button>
          {form.formState.isDirty && (
            <p className="text-sm">Lưu bản nháp và tải lại trước khi xác nhận gửi.</p>
          )}
        </div>
      ) : (
        <Button
          variant="outline"
          disabled={
            action.pending || !["UNDER_REVIEW", "SUPPLEMENT_REQUIRED"].includes(record.status)
          }
          onClick={() =>
            void action.execute(() => deathCaseService.newVersion(record.id, record.etag), publish)
          }
        >
          Tạo phiên bản bổ sung
        </Button>
      )}
      {action.pending && <p role="status">Đang xử lý hồ sơ…</p>}
      {action.error && (
        <p role="alert" className="text-sm text-destructive">
          {action.error}
        </p>
      )}
      {action.succeeded && <p role="status">Máy chủ đã lưu yêu cầu. Tải lại trước khi sửa tiếp.</p>}
    </section>
  );
}
