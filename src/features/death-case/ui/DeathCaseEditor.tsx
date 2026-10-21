import { useRef, useState, type DragEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Lock, Upload } from "lucide-react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { formatStorageSize } from "@/shared/lib/formatStorageSize";
import { Input } from "@/shared/ui/input";
import type { DeathCase } from "../model/deathCase.schema";
import { executorVaultsKey } from "../model/useExecutorVaults";
import { deathCaseService } from "../api/deathCaseService";
import { buttonStyles, Chip, formatDateTime, Panel } from "@/shared/ui/heritageKit";
import { requirementLabels } from "./executorLabels";

const MAX_FILES = 10;
const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const DRAFT_FORM_ID = "death-case-draft-form";

const schema = z.object({
  ownerFullName: z.string().max(200),
  ownerCitizenId: z.string().max(32),
  dateOfDeath: z.string().regex(/^(?:\d{4}-\d{2}-\d{2})?$/),
  certificateNumber: z.string().max(100),
  issuedOn: z.string().regex(/^(?:\d{4}-\d{2}-\d{2})?$/),
  issuedBy: z.string().max(200),
});

const typeLabels: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WEBP",
};

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} MB`
    : `${Math.max(1, Math.round(bytes / 1024)).toLocaleString("vi-VN")} KB`;

/** Danh sách các phiên bản (bản 1 gửi lần đầu, bản 2 trở đi là bổ sung) theo thiết kế "Nộp bản bổ sung". */
function VersionTimeline({ record }: { record: DeathCase }) {
  const current = record.currentVersion;
  const versions = Array.from({ length: current.versionNo }, (_, index) => index + 1);
  return (
    <Panel title="Các phiên bản đã nộp">
      <ol className="space-y-4">
        {versions.map((no) => {
          const isCurrent = no === current.versionNo;
          const submitted = !isCurrent || !current.isDraft;
          return (
            <li key={no} className="flex gap-3 text-sm">
              <span
                aria-hidden="true"
                className={`mt-1.5 size-2.5 shrink-0 rounded-full ${submitted ? "bg-[#2E9E6E]" : "bg-[#BDB8A6]"}`}
              />
              <div>
                <p className="font-semibold">
                  Bản {no} · {no === 1 ? "gửi lần đầu" : "bổ sung"}
                </p>
                <p className="text-heritage-muted">
                  {isCurrent && current.isDraft
                    ? "Chưa nộp"
                    : isCurrent && current.submittedAt
                      ? `${formatDateTime(current.submittedAt)} · ${current.files.length} tệp`
                      : "Đã nộp"}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

/** Một snapshot hồ sơ; full CCCD/file chỉ nằm trong local form, không cache. */
export function DeathCaseEditor({ record }: { record: DeathCase }) {
  const [etag, setEtag] = useState(record.etag);
  const [confirmed, setConfirmed] = useState(false);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const action = usePrivateAction();
  const client = useQueryClient();
  const version = record.currentVersion;
  const supplement = version.versionNo > 1;
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
  const publish = (result: DeathCase) => {
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
    void client.invalidateQueries({ queryKey: executorVaultsKey });
  };

  const missingInfo = record.missingRequirements.filter((item) => item !== "FILES");
  const missingFiles = record.missingRequirements.includes("FILES");
  const uploadBlocked =
    action.pending ||
    !version.isDraft ||
    version.files.length >= MAX_FILES ||
    form.formState.isDirty;

  const upload = async (file: File | null | undefined) => {
    setFileError("");
    if (!file) return;
    if (file.size === 0 || file.size > MAX_BYTES || !ALLOWED_TYPES.includes(file.type)) {
      setFileError(`Chọn tệp đúng định dạng, không rỗng, tối đa ${formatStorageSize(MAX_BYTES)}.`);
      return;
    }
    await action.execute(() => deathCaseService.upload(record.id, file), publish);
  };
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (!uploadBlocked) void upload(event.dataTransfer.files[0]);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title="Thông tin báo tin">
          <form
            id={DRAFT_FORM_ID}
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
                <label key={name} className="block space-y-2 text-sm font-medium">
                  {label}
                  <Input
                    type={type}
                    autoComplete="off"
                    className="h-12 rounded-xl bg-white px-4 text-sm font-normal"
                    {...form.register(name)}
                    aria-invalid={Boolean(form.formState.errors[name])}
                  />
                </label>
              ))}
            </fieldset>
            {Object.entries(form.formState.errors).map(([key, error]) => (
              <p key={key} role="alert" className="text-sm text-destructive">
                {error?.message}
              </p>
            ))}
          </form>
        </Panel>

        <div className="space-y-6">
          <Panel title="Gửi hồ sơ">
            {version.isDraft ? (
              <>
                <p className="mb-4 text-sm leading-6 text-heritage-muted">
                  Kiểm tra kỹ trước khi gửi. Sau khi gửi, Người xét duyệt sẽ xem hồ sơ.
                </p>
                <ul className="divide-y divide-heritage-border border-y border-heritage-border">
                  <li className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div>
                      <p className="font-semibold">Thông tin báo tin</p>
                      <p className="text-xs text-heritage-muted">
                        {missingInfo.length > 0
                          ? `Còn thiếu: ${missingInfo.map((item) => requirementLabels[item] ?? item).join(", ")}`
                          : "Đã nhập đủ"}
                      </p>
                    </div>
                    <Chip tone={missingInfo.length > 0 ? "warning" : "success"}>
                      {missingInfo.length > 0 ? "Thiếu" : "Đủ"}
                    </Chip>
                  </li>
                  <li className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div>
                      <p className="font-semibold">Chứng từ</p>
                      <p className="text-xs text-heritage-muted">
                        {version.files.length} tệp đã tải
                      </p>
                    </div>
                    <Chip tone={missingFiles ? "warning" : "success"}>
                      {missingFiles ? "Thiếu" : "Đủ"}
                    </Chip>
                  </li>
                </ul>
                <label className="mt-4 flex min-h-11 items-start gap-3 text-sm leading-6">
                  <input
                    type="checkbox"
                    className="mt-1 size-5"
                    checked={confirmed}
                    disabled={action.pending}
                    onChange={(event) => setConfirmed(event.target.checked)}
                  />
                  Tôi xác nhận bản đã lưu là đúng và muốn gửi xét duyệt. Lần gửi đầu sẽ khóa cấu
                  hình kế hoạch bàn giao và bắt đầu quy trình thông báo Chủ kho.
                </label>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    form={DRAFT_FORM_ID}
                    disabled={action.pending}
                    className={buttonStyles.outline}
                  >
                    Lưu nháp
                  </button>
                  <button
                    type="button"
                    disabled={
                      action.pending ||
                      !confirmed ||
                      form.formState.isDirty ||
                      record.missingRequirements.length > 0
                    }
                    className={buttonStyles.gold}
                    onClick={() =>
                      void action.execute(
                        () => deathCaseService.submit(record.id, record.etag),
                        publish,
                      )
                    }
                  >
                    {supplement ? "Nộp bản bổ sung" : "Gửi hồ sơ"}
                  </button>
                </div>
                {form.formState.isDirty && (
                  <p className="mt-3 text-sm">Lưu nháp trước khi tải tệp hoặc gửi hồ sơ.</p>
                )}
                <p className="mt-4 flex items-start gap-2 text-xs text-heritage-muted">
                  <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  Tệp được mã hóa khi lưu. Xóa tệp là xóa vĩnh viễn khỏi bản nháp.
                </p>
              </>
            ) : (
              <>
                <p className="mb-4 text-sm leading-6 text-heritage-muted">
                  Hồ sơ đã được gửi và đang ở bước xét duyệt. Bạn chỉ sửa được khi Người xét duyệt
                  yêu cầu bổ sung.
                </p>
                <button
                  type="button"
                  className={buttonStyles.outline}
                  disabled={
                    action.pending ||
                    !["UNDER_REVIEW", "SUPPLEMENT_REQUIRED"].includes(record.status)
                  }
                  onClick={() =>
                    void action.execute(
                      () => deathCaseService.newVersion(record.id, record.etag),
                      publish,
                    )
                  }
                >
                  Tạo bản bổ sung
                </button>
              </>
            )}
            {action.pending && (
              <p role="status" className="mt-3 text-sm">
                Đang xử lý hồ sơ…
              </p>
            )}
            {action.error && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {action.error}
              </p>
            )}
            {action.succeeded && (
              <p role="status" className="mt-3 text-sm">
                Máy chủ đã lưu yêu cầu. Tải lại trước khi sửa tiếp.
              </p>
            )}
          </Panel>
          {supplement && <VersionTimeline record={record} />}
        </div>
      </div>

      <Panel
        title={supplement ? "Bản bổ sung" : "Chứng từ"}
        action={<Chip tone="success">{`${version.files.length}/${MAX_FILES} tệp`}</Chip>}
      >
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!uploadBlocked) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`rounded-2xl border-2 border-dashed px-6 py-10 text-center ${dragging ? "border-[#B68F4C] bg-[#F1E6CC]/40" : "border-[#9DB0A5]"}`}
        >
          <Upload className="mx-auto size-7 text-heritage-muted" aria-hidden="true" />
          <p className="mt-3 font-semibold">
            {supplement ? "Kéo tệp bổ sung vào đây" : "Kéo giấy chứng tử vào đây"}
          </p>
          <p className="mt-1 text-sm text-heritage-muted">hoặc bấm để chọn tệp</p>
          <input
            ref={fileInput}
            type="file"
            hidden
            aria-label="Chọn trang giấy"
            accept={ALLOWED_TYPES.join(",")}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              void upload(file);
            }}
          />
          <button
            type="button"
            disabled={uploadBlocked}
            className={`${buttonStyles.dark} mt-4`}
            onClick={() => fileInput.current?.click()}
          >
            <Upload className="size-4" aria-hidden="true" />
            Chọn tệp
          </button>
          <p className="mt-3 text-xs text-heritage-muted">
            PDF, JPG, PNG, WEBP · Tối đa {formatStorageSize(MAX_BYTES)} mỗi tệp · Không tự gửi hồ sơ
            sau khi tải tệp lên.
          </p>
        </div>
        {fileError && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {fileError}
          </p>
        )}
        <ul className="mt-4 divide-y divide-heritage-border">
          {version.files.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#ECE8DB]">
                  <FileText className="size-5 text-heritage-muted" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {item.position}. {item.fileName}
                  </p>
                  <p className="text-xs text-heritage-muted">
                    {typeLabels[item.contentType] ?? "Tệp"} · {formatSize(item.sizeBytes)} · tải lúc{" "}
                    {formatDateTime(item.uploadedAt)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label={`Xóa tệp ${item.fileName}`}
                disabled={action.pending || !version.isDraft || form.formState.isDirty}
                className={buttonStyles.danger}
                onClick={() => {
                  if (window.confirm("Gỡ trang giấy này khỏi bản nháp?"))
                    void action.execute(
                      () => deathCaseService.removeFile(record.id, item.id),
                      publish,
                    );
                }}
              >
                Xóa
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
