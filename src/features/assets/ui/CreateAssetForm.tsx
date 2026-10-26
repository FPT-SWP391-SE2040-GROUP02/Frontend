import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles, Panel } from "@/shared/ui/heritageKit";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { backendAssetService } from "../api/backendAssetService";
import { ADD_ASSET_NAME_ID, MAX_ASSET_FILE_BYTES, validateAssetFile } from "../model/addAssetForm";
import { formatStorageSize } from "@/shared/lib/formatStorageSize";

const schema = z.object({
  name: z.string().regex(/\S/, "Nhập tên mục.").max(200),
  description: z.string().max(1000),
  content: z.string().max(100000),
});

type Kind = "TEXT" | "FILE";

const kinds: Array<{ value: Kind; label: string }> = [
  { value: "TEXT", label: "Văn bản" },
  { value: "FILE", label: "Tệp" },
];

/** Nội dung chỉ ở form RAM; không nằm trong MutationCache/QueryCache, tên/ghi chú không chứa bí mật. */
export function CreateAssetForm({
  vaultId,
  remainingBytes,
}: {
  vaultId: string;
  remainingBytes: number;
}) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const [kind, setKind] = useState<Kind>("TEXT");
  const [fileError, setFileError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  // Tiến độ pha 1 (gửi byte lên mạng); pha 2 là "máy chủ mã hóa/lưu" khi pending sau khi upload xong.
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  // Đổi khóa để ô chọn tệp được dựng lại và quên tệp đã chọn.
  const [fileInputKey, setFileInputKey] = useState(0);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { name: "", description: "", content: "" },
  });
  const clear = () => {
    reset();
    setFile(null);
    setFileError("");
    setUploadPercent(null);
    setFileInputKey((value) => value + 1);
  };
  const pickFile = (next: File | null) => {
    setFile(next);
    // Chọn lại tệp (kể cả hủy chọn) phải làm mờ "Đã lưu vào kho" và lỗi cũ của tệp trước.
    action.reset();
    setUploadPercent(null);
    if (next) {
      setFileError(validateAssetFile(next, remainingBytes));
    } else {
      setFileError("");
    }
  };
  const nameField = register("name");
  return (
    <Panel title="Thêm mục mới" labelledBy="add-asset-title" className="self-start">
      <form
        id="add-asset"
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit(async (values) => {
          if (kind === "FILE") {
            const error = validateAssetFile(file, remainingBytes);
            if (error) {
              setFileError(error);
              return;
            }
          }
          setFileError("");
          if (kind === "TEXT" && !values.content.trim()) {
            setError("content", { message: "Nhập nội dung." });
            return;
          }
          setUploadPercent(null);
          const saved = await action.execute(
            () =>
              kind === "TEXT"
                ? backendAssetService.createText(vaultId, values)
                : backendAssetService.upload(
                    vaultId,
                    file!,
                    values.name,
                    values.description,
                    (percent) => setUploadPercent(percent),
                  ),
            () => {
              void client.invalidateQueries({ queryKey: ["vault-assets", vaultId] });
              void client.invalidateQueries({ queryKey: ["owner-vault"] });
            },
          );
          if (saved) clear();
        })}
      >
        <div className="grid grid-cols-2 gap-3" role="group" aria-label="Loại mục">
          {kinds.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={kind === item.value}
              disabled={action.pending}
              onClick={() => {
                setKind(item.value);
                clear();
              }}
              className={`min-h-11 rounded-xl border px-3 text-sm font-semibold transition-colors ${
                kind === item.value
                  ? "border-[#B68F4C] bg-[#F1E6CC] text-[#0A281E]"
                  : "border-[#BDB8A6] bg-white text-[#0A281E] hover:bg-[#F4F1E6]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <fieldset disabled={action.pending} className="space-y-4">
          <label className="block text-sm font-medium">
            Tên mục
            <Input
              {...nameField}
              id={ADD_ASSET_NAME_ID}
              aria-invalid={Boolean(errors.name)}
              placeholder="Ví dụ: Ví điện tử MoMo"
              className="mt-2 h-12 rounded-xl bg-white px-4 text-sm font-normal"
            />
          </label>
          {errors.name && (
            <p role="alert" className="text-sm text-destructive">
              {errors.name.message}
            </p>
          )}
          <label className="block text-sm font-medium">
            Ghi chú cho người nhận
            <Textarea
              {...register("description")}
              aria-invalid={Boolean(errors.description)}
              placeholder="Không nhập mật khẩu hay bí mật vào ô này"
              className="mt-2 min-h-24 rounded-xl bg-white px-4 text-sm font-normal"
            />
          </label>
          {errors.description && (
            <p role="alert" className="text-sm text-destructive">
              {errors.description.message}
            </p>
          )}
          {kind === "TEXT" ? (
            <label className="block text-sm font-medium">
              Nội dung bí mật
              <Textarea
                autoComplete="off"
                {...register("content")}
                aria-invalid={Boolean(errors.content)}
                className="mt-2 min-h-32 rounded-xl bg-white px-4 text-sm font-normal"
              />
            </label>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Tệp tài sản
                <Input
                  key={fileInputKey}
                  type="file"
                  className="mt-2 h-auto rounded-xl bg-white px-3 py-2.5 text-sm font-normal"
                  onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {file && (
                <p className="text-xs text-heritage-muted">
                  Đã chọn: {file.name} · {file.size} bytes
                </p>
              )}
            </div>
          )}
          {kind === "FILE" && (
            <p className="text-xs text-heritage-muted">
              Tệp tối đa {formatStorageSize(MAX_ASSET_FILE_BYTES)}.
            </p>
          )}
          {kind === "FILE" && action.pending && (
            <div className="space-y-1">
              <p role="status" className="text-xs font-medium">
                {uploadPercent !== null && uploadPercent < 100
                  ? `Đang tải tệp lên… ${uploadPercent}%`
                  : "Đã gửi tệp, đang mã hóa và lưu trên máy chủ…"}
              </p>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={uploadPercent ?? 100}
                className="h-2 overflow-hidden rounded-full bg-heritage-canvas"
              >
                <div
                  className="h-full rounded-full bg-[#1F7A55]"
                  style={{
                    width:
                      uploadPercent === null || uploadPercent >= 100
                        ? "100%"
                        : `${uploadPercent}%`,
                  }}
                />
              </div>
            </div>
          )}
          {(errors.content || fileError) && (
            <p role="alert" className="text-sm text-destructive">
              {errors.content?.message ?? fileError}
            </p>
          )}
          <p className="flex items-start gap-2 text-xs leading-5 text-heritage-muted">
            <Lock className="mt-0.5 size-3.5 shrink-0 text-[#1F7A55]" aria-hidden="true" />
            Nội dung được mã hóa AES-256-GCM trên máy chủ.
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className={buttonStyles.gold}>
              {action.pending ? "Đang lưu…" : "Lưu vào kho"}
            </button>
            <button type="button" className={buttonStyles.outline} onClick={clear}>
              Hủy
            </button>
          </div>
        </fieldset>
        {action.error && (
          <p role="alert" className="text-sm text-destructive">
            {action.error}
          </p>
        )}
        {action.succeeded && (
          <p role="status" className="text-sm text-[#1F7A55]">
            Đã lưu vào kho.
          </p>
        )}
      </form>
    </Panel>
  );
}
