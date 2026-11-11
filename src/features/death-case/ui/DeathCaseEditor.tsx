import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, FileText, Upload } from "lucide-react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import type { DeathCase } from "../model/deathCase.schema";
import { useCertificateInfoForm } from "../model/useCertificateInfoForm";
import { CertificateInfoPanel, CertificateInfoSummary } from "./CertificateInfoPanel";
import { executorVaultsKey } from "../model/useExecutorVaults";
import { deathCaseService } from "../api/deathCaseService";
import { buttonStyles, Chip, formatDateTime, InfoRow, Panel } from "@/shared/ui/heritageKit";
import { caseStatusInfo } from "./executorLabels";
import { usePolicyWindows } from "@/shared/settings/usePolicyWindows";

type FileKind = "DEATH_CERTIFICATE" | "DEATH_NOTICE";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

/** Giấy của trang Báo tin: chỉ giấy chứng tử, đúng một tệp. */
const DOCUMENT_ROWS: ReadonlyArray<{
  kind: FileKind;
  title: string;
  hint: string;
  required: boolean;
}> = [
  {
    kind: "DEATH_CERTIFICATE",
    title: "Giấy chứng tử / Trích lục khai tử",
    hint: "Bản do UBND cấp xã cấp hoặc bản trích lục.",
    required: true,
  },
];

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} MB`
    : `${Math.max(1, Math.round(bytes / 1024)).toLocaleString("vi-VN")} KB`;

/** Mã hồ sơ ngắn hiển thị cho người nộp, lấy từ năm tạo và đầu mã hồ sơ. */
function caseCode(record: DeathCase): string {
  return `HS-${record.createdAt.slice(0, 4)}-${record.id.slice(0, 4).toUpperCase()}`;
}

/** Danh sách các phiên bản (bản 1 gửi lần đầu, bản 2 trở đi là bổ sung). */
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

/** Mở tệp mình đã nộp ở tab mới; nội dung chỉ là object URL tạm trong RAM, thu hồi sau 1 phút. */
function ViewFileButton({
  caseId,
  file,
}: {
  caseId: string;
  file: { id: string; fileName: string };
}) {
  const action = usePrivateAction();
  return (
    <>
      <button
        type="button"
        aria-label={`Xem tệp ${file.fileName}`}
        disabled={action.pending}
        className={buttonStyles.outline}
        onClick={() =>
          void action.execute(
            () => deathCaseService.viewFile(caseId, file.id),
            (blob) => {
              const url = URL.createObjectURL(blob);
              window.open(url, "_blank", "noopener");
              setTimeout(() => URL.revokeObjectURL(url), 60_000);
            },
          )
        }
      >
        <Eye className="size-4" aria-hidden="true" />
        Xem
      </button>
      {action.error && (
        <span role="alert" className="block text-xs text-destructive">
          {action.error}
        </span>
      )}
    </>
  );
}

/** Giấy tiếp nhận hồ sơ: hiện sau khi nộp, thay cho biểu mẫu. */
function Receipt({ record }: { record: DeathCase }) {
  const version = record.currentVersion;
  const status = caseStatusInfo[record.status];
  return (
    <Panel title="Giấy tiếp nhận hồ sơ" action={<Chip tone="success">Đã nộp</Chip>}>
      <dl className="divide-y divide-heritage-border">
        <InfoRow label="Mã hồ sơ">{caseCode(record)}</InfoRow>
        <InfoRow label="Trạng thái">{status ? status.label : record.status}</InfoRow>
        <InfoRow label="Ngày nộp">
          {version.submittedAt ? formatDateTime(version.submittedAt) : "—"}
        </InfoRow>
        <InfoRow label="Bản hồ sơ">Bản {version.versionNo}</InfoRow>
      </dl>
      <p className="mt-4 text-sm font-semibold">Thông tin trên giấy</p>
      <CertificateInfoSummary record={record} />
      <p className="mt-4 text-sm font-semibold">Giấy đã nộp</p>
      <ul className="mt-2 space-y-1 text-sm">
        {version.files.map((item) => (
          <li key={item.id}>
            {item.kind === "DEATH_CERTIFICATE"
              ? "Giấy chứng tử / Trích lục khai tử"
              : "Giấy báo tử"}
            {" · "}
            <span className="text-heritage-muted">{item.fileName}</span>{" "}
            <ViewFileButton caseId={record.id} file={item} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** Nội dung hướng dẫn sau khi nộp, tùy trạng thái hồ sơ. */
function reviewText(status: string): string {
  if (status === "SUPPLEMENT_REQUIRED") {
    return "Người xét duyệt yêu cầu bổ sung. Tạo bản bổ sung để thay hoặc thêm giấy tờ rồi nộp lại.";
  }
  if (status === "UNDER_REVIEW") {
    return "Hồ sơ đang được xét. Cần thay hoặc thêm giấy tờ thì tạo bản bổ sung; Người xét duyệt vẫn xét bản đã nộp cho tới khi bạn nộp bản mới.";
  }
  return "Hồ sơ đã đóng nên không sửa hay bổ sung được nữa.";
}

/** Trang Báo tin một màn: hai dòng giấy tờ (mỗi dòng một tệp), cam đoan, nộp hồ sơ, rồi giấy tiếp nhận. */
export function DeathCaseEditor({ record, ownerName }: { record: DeathCase; ownerName: string }) {
  const { deathCaseMaxFileMb } = usePolicyWindows();
  const maxBytes = deathCaseMaxFileMb * 1024 * 1024;
  const version = record.currentVersion;
  const supplement = version.versionNo > 1;
  const client = useQueryClient();
  const action = usePrivateAction();
  const [confirmed, setConfirmed] = useState(false);
  const [askingSubmit, setAskingSubmit] = useState(false);
  const [askingVersion, setAskingVersion] = useState(false);
  const [fileError, setFileError] = useState("");
  const [uploadingKind, setUploadingKind] = useState<FileKind | null>(null);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
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
  const inputs = useRef<Partial<Record<FileKind, HTMLInputElement | null>>>({});

  const publish = (result: DeathCase, message: string | null = null) => {
    setNotice(message);
    client.setQueryData(["death-case", result.id], result);
    void client.invalidateQueries({ queryKey: ["death-case"] });
    void client.invalidateQueries({ queryKey: executorVaultsKey });
  };

  // Ba thông tin trên giấy: lưu vào bản nháp khi rời ô; bản đã gửi thì không sửa được (xem Receipt).
  const info = useCertificateInfoForm(record, (result) => publish(result, "Đã lưu thông tin trên giấy."));
  const fileOf = (kind: FileKind) => version.files.find((item) => item.kind === kind);
  const missingCertificate = record.missingRequirements.includes("FILES");
  const busy = action.pending || uploadingKind !== null;
  // Nộp được khi đủ tệp, đủ 3 thông tin hợp lệ và đã lưu xong (không còn chỗ sửa dở).
  const missingParts: string[] = [];
  if (missingCertificate) missingParts.push("giấy chứng tử / trích lục khai tử");
  missingParts.push(...info.missing);
  const infoUnsaved = info.dirty || info.saving;
  const canSubmit = missingParts.length === 0 && !info.hasLocalErrors && !infoUnsaved;
  let submitHint = "";
  if (missingParts.length > 0) submitHint = `Còn thiếu: ${missingParts.join(", ")}.`;
  else if (info.hasLocalErrors) submitHint = "Sửa ô báo đỏ trước khi nộp.";
  else if (infoUnsaved) submitHint = "Đang lưu hoặc chưa lưu thông tin trên giấy. Bấm “Lưu thông tin” rồi nộp.";

  const upload = async (kind: FileKind, file: File | null | undefined) => {
    setFileError("");
    if (!file) return;
    if (file.size === 0 || file.size > maxBytes || !ALLOWED_TYPES.includes(file.type)) {
      setFileError(
        `Chọn tệp PDF, JPG, PNG hoặc WEBP, không rỗng, tối đa ${deathCaseMaxFileMb} MiB.`,
      );
      return;
    }
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    setUploadingKind(kind);
    setUploadPercent(null);
    const known = new Set(version.files.map((item) => item.id));
    const ok = await action.execute(
      () => deathCaseService.upload(record.id, file, kind, (percent) => setUploadPercent(percent)),
      (result) => {
        const added = result.currentVersion.files.find((item) => !known.has(item.id));
        if (previewUrl && added) {
          setPreviewUrls((current) => ({ ...current, [added.id]: previewUrl }));
        } else if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        publish(result, "Đã tải tệp lên bản nháp.");
      },
    );
    if (!ok && previewUrl) URL.revokeObjectURL(previewUrl);
    setUploadingKind(null);
    setUploadPercent(null);
  };

  const removeFile = (fileId: string) =>
    void action.execute(
      () => deathCaseService.removeFile(record.id, fileId),
      (result) => publish(result, "Đã xóa tệp khỏi bản nháp."),
    );

  /** Nộp hồ sơ; Backend chỉ kiểm có giấy chứng tử, không còn AI đọc giấy. */
  const submit = async () => {
    const ok = await action.execute(
      () => deathCaseService.submit(record.id, record.etag),
      (result) => {
        setConfirmed(false);
        publish(
          result,
          supplement
            ? "Đã nộp bản bổ sung. Người xét duyệt sẽ xét bản mới này."
            : "Đã nộp hồ sơ. Giữ mã hồ sơ để tra cứu.",
        );
      },
    );
    if (ok) setAskingSubmit(false);
  };

  if (!version.isDraft) {
    return (
      <div className="space-y-6">
        <Receipt record={record} />
        <Panel title="Sau khi nộp">
          <p className="mb-4 text-sm leading-6 text-heritage-muted">{reviewText(record.status)}</p>
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
          {notice && !action.error && (
            <p role="status" className="mt-3 text-sm">
              {notice}
            </p>
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
                    Bản bổ sung chép sẵn giấy tờ của bản đã nộp để bạn thay hoặc thêm. Trong lúc bạn
                    soạn, Người xét duyệt chưa duyệt được hồ sơ cho tới khi bạn nộp bản mới. Bản đã
                    nộp giữ nguyên.
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
                            `Đã tạo bản bổ sung số ${result.currentVersion.versionNo}. Thay giấy tờ cần thiết rồi bấm “Nộp bản bổ sung”.`,
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
        </Panel>
        {supplement && <VersionTimeline record={record} />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Panel title={supplement ? "Bản bổ sung" : "Soạn hồ sơ báo tin"}>
        <p className="text-sm">
          Chủ kho: <span className="font-semibold">{ownerName}</span>
        </p>
        <p className="mt-1 text-sm text-heritage-muted">
          Mỗi mục chỉ nộp một tệp (PDF, JPG, PNG, WEBP · tối đa {deathCaseMaxFileMb} MiB).
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-heritage-muted">
              <tr>
                <th className="w-8 py-2">#</th>
                <th className="py-2">Giấy tờ</th>
                <th className="py-2">Tệp</th>
                <th className="py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-heritage-border">
              {DOCUMENT_ROWS.map((row, index) => {
                const file = fileOf(row.kind);
                const rowUploading = uploadingKind === row.kind;
                return (
                  <tr key={row.kind} className="align-top">
                    <td className="py-3">{index + 1}</td>
                    <td className="py-3 pr-3">
                      <p className="font-semibold">{row.title}</p>
                      <p className="text-xs text-heritage-muted">{row.hint}</p>
                      <Chip tone={row.required ? "warning" : "neutral"}>
                        {row.required ? "Bắt buộc" : "Nếu có"}
                      </Chip>
                    </td>
                    <td className="py-3 pr-3">
                      {file ? (
                        <div className="flex min-w-0 items-center gap-3">
                          {previewUrls[file.id] ? (
                            <img
                              src={previewUrls[file.id]}
                              alt={`Xem trước ${file.fileName}`}
                              className="size-11 shrink-0 rounded-xl object-cover"
                            />
                          ) : (
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#ECE8DB]">
                              <FileText className="size-5 text-heritage-muted" aria-hidden="true" />
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{file.fileName}</p>
                            <p className="text-xs text-heritage-muted">
                              {formatSize(file.sizeBytes)} · {formatDateTime(file.uploadedAt)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-heritage-muted">Chưa có tệp</span>
                      )}
                      {rowUploading && (
                        <p role="status" className="mt-2 text-xs text-heritage-muted">
                          {uploadPercent !== null && uploadPercent < 100
                            ? `Đang tải lên… ${uploadPercent}%`
                            : "Đang mã hóa và lưu…"}
                        </p>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <input
                        ref={(element) => {
                          inputs.current[row.kind] = element;
                        }}
                        type="file"
                        hidden
                        aria-label={`Chọn tệp: ${row.title}`}
                        accept={ALLOWED_TYPES.join(",")}
                        onChange={(event) => {
                          const picked = event.target.files?.[0];
                          event.target.value = "";
                          void upload(row.kind, picked);
                        }}
                      />
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          className={file ? buttonStyles.outline : buttonStyles.dark}
                          onClick={() => inputs.current[row.kind]?.click()}
                        >
                          <Upload className="size-4" aria-hidden="true" />
                          {file ? "Thay tệp" : "Tải lên"}
                        </button>
                        {file && <ViewFileButton caseId={record.id} file={file} />}
                        {file && (
                          <button
                            type="button"
                            aria-label={`Xóa tệp ${file.fileName}`}
                            disabled={busy}
                            className={buttonStyles.danger}
                            onClick={() => removeFile(file.id)}
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {fileError && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {fileError}
          </p>
        )}
      </Panel>

      <CertificateInfoPanel form={info} record={record} ownerName={ownerName} disabled={busy} />

      <Panel title="Cam đoan và nộp hồ sơ">
        <label className="flex min-h-11 items-start gap-3 text-sm leading-6">
          <input
            type="checkbox"
            className="mt-1 size-5"
            checked={confirmed}
            disabled={busy}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          Tôi cam đoan giấy tờ là thật, đúng người đã mất và tôi chịu trách nhiệm về hồ sơ này.
        </label>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={buttonStyles.gold}
            disabled={busy || !confirmed || !canSubmit}
            onClick={() => {
              action.reset();
              setAskingSubmit(true);
            }}
          >
            {supplement ? "Nộp bản bổ sung" : "Nộp hồ sơ"}
          </button>
          {submitHint && <span className="text-sm text-heritage-muted">{submitHint}</span>}
        </div>
        {action.error && !askingSubmit && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {action.error}
          </p>
        )}
        {notice && !action.error && (
          <p role="status" className="mt-3 text-sm">
            {notice}
          </p>
        )}
      </Panel>

      {askingSubmit && (
        <Dialog open onOpenChange={(open) => !open && !action.pending && setAskingSubmit(false)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nộp hồ sơ báo tin?</DialogTitle>
              <DialogDescription>
                Không hoàn tác được: kho và tài khoản của {ownerName} bị khóa ngay khi nộp. Hồ sơ
                được giao cho Người xét duyệt xét.
              </DialogDescription>
            </DialogHeader>
            {action.pending && (
              <p role="status" className="text-sm">
                Đang nộp hồ sơ…
              </p>
            )}
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
                onClick={() => setAskingSubmit(false)}
              >
                Xem lại
              </button>
              <button
                type="button"
                className={buttonStyles.gold}
                disabled={action.pending}
                onClick={() => void submit()}
              >
                Xác nhận nộp
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {supplement && <VersionTimeline record={record} />}
    </div>
  );
}
