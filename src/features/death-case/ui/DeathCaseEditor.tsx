import { useEffect, useRef, useState, type DragEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Lock, Upload } from "lucide-react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { formatStorageSize } from "@/shared/lib/formatStorageSize";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import type { DeathCase } from "../model/deathCase.schema";
import { type CertificateFileCheck, readCertificateRejection } from "../model/certificateCheck";
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

/** Kết quả AI cho một trang sau lần gửi bị chặn; không có kết quả thì không hiện gì. */
function CertificateCheckNote({ check }: { check: CertificateFileCheck | undefined }) {
  if (!check) return null;
  if (check.status === "NOT_RECOGNIZED")
    return (
      <p className="mt-1 text-xs text-destructive">
        Không phải giấy chứng tử{check.documentType ? ` (AI nhận ra: ${check.documentType})` : ""}
      </p>
    );
  if (check.status === "UNAVAILABLE")
    return <p className="mt-1 text-xs text-heritage-muted">Chưa kiểm tra được trang này</p>;
  return <p className="mt-1 text-xs text-[#2E9E6E]">Là giấy chứng tử</p>;
}

/**
 * DEATH-04, D5: câu giải thích khi bản hiện tại đã gửi. Đang xét hoặc cần bổ sung thì Executor tạo được bản mới
 * (chép từ bản đã gửi); Verifier vẫn xét bản đã gửi cho tới khi bản mới được nộp.
 */
function reviewText(status: string): string {
  if (status === "SUPPLEMENT_REQUIRED") {
    return "Người xét duyệt yêu cầu bổ sung. Tạo bản bổ sung để sửa hoặc thêm giấy tờ rồi nộp lại.";
  }
  if (status === "UNDER_REVIEW") {
    return "Hồ sơ đang được xét. Cần sửa hoặc thêm giấy tờ thì tạo bản bổ sung; Người xét duyệt vẫn xét bản đã gửi cho tới khi bạn nộp bản mới. Đổi họ tên, CCCD hoặc ngày mất của Chủ kho thì Chủ kho được báo lại và 72 giờ phản đối tính lại từ đầu.";
  }
  return "Hồ sơ đã đóng nên không sửa hay bổ sung được nữa.";
}

/** Một snapshot hồ sơ; full CCCD/file chỉ nằm trong local form, không cache. */
export function DeathCaseEditor({ record }: { record: DeathCase }) {
  const [etag, setEtag] = useState(record.etag);
  const [confirmed, setConfirmed] = useState(false);
  /** Đang hỏi lại trước khi tạo bản bổ sung (chặn bấm nhầm: bản nháp mới chặn Verifier duyệt tới khi nộp). */
  const [askingVersion, setAskingVersion] = useState(false);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [certificateChecks, setCertificateChecks] = useState<CertificateFileCheck[] | null>(null);
  // Tiến độ + xem trước ảnh vừa tải trong phiên này (blob URL; thu hồi khi xóa tệp/unmount).
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const previewUrlsRef = useRef(previewUrls);
  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);
  useEffect(
    () => () => {
      Object.values(previewUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );
  const fileInput = useRef<HTMLInputElement>(null);
  const action = usePrivateAction();
  /** Câu báo kết quả của thao tác vừa xong (lưu, tải tệp, gửi, tạo bản bổ sung); null khi chưa có. */
  const [notice, setNotice] = useState<string | null>(null);
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
  const publish = (result: DeathCase, message: string | null = null) => {
    setNotice(message);
    setEtag(result.etag);
    setCertificateChecks(null);
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
    // Ảnh tạo blob URL để xem trước; PDF giữ icon tĩnh. Thu hồi nếu upload lỗi.
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    setUploading(true);
    setUploadPercent(null);
    const ok = await action.execute(
      () => deathCaseService.upload(record.id, file, (percent) => setUploadPercent(percent)),
      (result) => {
        if (previewUrl) {
          const known = new Set(record.currentVersion.files.map((item) => item.id));
          const added = result.currentVersion.files.find((item) => !known.has(item.id));
          if (added) {
            setPreviewUrls((current) => ({ ...current, [added.id]: previewUrl }));
          } else {
            URL.revokeObjectURL(previewUrl);
          }
        }
        setUploading(false);
        setUploadPercent(null);
        publish(result, "Đã tải trang giấy lên bản nháp.");
      },
    );
    if (!ok && previewUrl) URL.revokeObjectURL(previewUrl);
    if (!ok) {
      setUploading(false);
      setUploadPercent(null);
    }
  };
  /** Gửi hồ sơ: BE cho AI xem các trang; bị chặn thì giữ kết quả từng trang để hiện cạnh tệp. */
  const submit = async () => {
    setCertificateChecks(null);
    setSubmitting(true);
    await action.execute(
      async () => {
        try {
          return await deathCaseService.submit(record.id, record.etag);
        } catch (failure) {
          setCertificateChecks(readCertificateRejection(failure));
          throw failure;
        }
      },
      (result) => {
        if (supplement) {
          publish(result, "Đã nộp bản bổ sung. Người xét duyệt sẽ xét bản mới này.");
        } else {
          publish(
            result,
            "Đã gửi hồ sơ. Chủ kho sẽ được báo qua email và có 72 giờ để phản đối trước khi xét duyệt.",
          );
        }
      },
    );
    setSubmitting(false);
  };
  const checkOf = (fileId: string) => certificateChecks?.find((check) => check.fileId === fileId);
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
                (result) => publish(result, "Đã lưu nháp."),
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
                    onClick={() => void submit()}
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
                  {reviewText(record.status)}
                </p>
                {["UNDER_REVIEW", "SUPPLEMENT_REQUIRED"].includes(record.status) && (
                  <button
                    type="button"
                    className={buttonStyles.outline}
                    disabled={action.pending}
                    onClick={() => {
                      action.reset();
                      setAskingVersion(true);
                    }}
                  >
                    Tạo bản bổ sung
                  </button>
                )}
                {askingVersion && (
                  <Dialog
                    open
                    onOpenChange={(open) => !open && !action.pending && setAskingVersion(false)}
                  >
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Tạo bản bổ sung?</DialogTitle>
                        <DialogDescription>
                          Bản bổ sung chép sẵn thông tin và giấy tờ của bản đã gửi để bạn sửa hoặc
                          thêm. Trong lúc bạn soạn, Người xét duyệt chưa duyệt được hồ sơ cho tới
                          khi bạn nộp bản mới. Bản đã gửi giữ nguyên, không bị sửa.
                        </DialogDescription>
                      </DialogHeader>
                      {action.error && (
                        <p role="alert" className="text-sm text-destructive">
                          {action.error}
                        </p>
                      )}
                      <DialogFooter>
                        <button
                          type="button"
                          className={buttonStyles.outline}
                          disabled={action.pending}
                          onClick={() => setAskingVersion(false)}
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          className={buttonStyles.gold}
                          disabled={action.pending}
                          onClick={() =>
                            void action.execute(
                              () => deathCaseService.newVersion(record.id, record.etag),
                              (result) => {
                                setAskingVersion(false);
                                publish(
                                  result,
                                  `Đã tạo bản bổ sung số ${result.currentVersion.versionNo}. Sửa thông tin hoặc giấy tờ cần thiết rồi bấm “Nộp bản bổ sung”.`,
                                );
                              },
                            )
                          }
                        >
                          Tạo bản bổ sung
                        </button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </>
            )}
            {action.pending && (
              <p role="status" className="mt-3 text-sm">
                {submitting ? "Đang kiểm tra giấy chứng tử…" : "Đang xử lý hồ sơ…"}
              </p>
            )}
            {action.error && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {action.error}
              </p>
            )}
            {certificateChecks && (
              <p className="mt-2 text-xs text-heritage-muted">
                Kết quả nhận diện từng trang được ghi ở danh sách chứng từ bên dưới.
              </p>
            )}
            {notice && !action.pending && !action.error && (
              <p role="status" className="mt-3 text-sm">
                {notice}
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
        {uploading && (
          <div className="mt-3">
            <p role="status" className="text-xs font-medium text-heritage-muted">
              {uploadPercent !== null && uploadPercent < 100
                ? `Đang tải tệp lên… ${uploadPercent}%`
                : "Đã gửi tệp, đang mã hóa và lưu trên máy chủ…"}
            </p>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={uploadPercent ?? 100}
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-heritage-canvas"
            >
              <div
                className="h-full rounded-full bg-[#1F7A55]"
                style={{
                  width:
                    uploadPercent === null || uploadPercent >= 100 ? "100%" : `${uploadPercent}%`,
                }}
              />
            </div>
          </div>
        )}
        <ul className="mt-4 divide-y divide-heritage-border">
          {version.files.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                {previewUrls[item.id] ? (
                  <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#ECE8DB]">
                    <img
                      src={previewUrls[item.id]}
                      alt={`Xem trước ${item.fileName}`}
                      className="size-full object-cover"
                    />
                  </span>
                ) : (
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#ECE8DB]">
                    <FileText className="size-5 text-heritage-muted" aria-hidden="true" />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {item.position}. {item.fileName}
                  </p>
                  <p className="text-xs text-heritage-muted">
                    {typeLabels[item.contentType] ?? "Tệp"} · {formatSize(item.sizeBytes)} · tải lúc{" "}
                    {formatDateTime(item.uploadedAt)}
                  </p>
                  <CertificateCheckNote check={checkOf(item.id)} />
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
                      (result) => {
                        setPreviewUrls((current) => {
                          const url = current[item.id];
                          if (url) URL.revokeObjectURL(url);
                          const next = { ...current };
                          delete next[item.id];
                          return next;
                        });
                        publish(result, "Đã gỡ trang giấy khỏi bản nháp.");
                      },
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
