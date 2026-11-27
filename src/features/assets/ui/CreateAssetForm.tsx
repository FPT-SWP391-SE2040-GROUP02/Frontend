import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { useSuccessHold } from "@/shared/lib/useSuccessHold";
import { ActionButton } from "@/shared/ui/ActionButton";
import { buttonStyles, Panel } from "@/shared/ui/heritageKit";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { backendAssetService } from "../api/backendAssetService";
import { ADD_ASSET_NAME_ID, MAX_ASSET_FILE_BYTES, validateAssetFile } from "../model/addAssetForm";
import { AssetFileDrop } from "./AssetFileDrop";

const schema = z.object({
  name: z.string().regex(/\S/, "Nhập tên mục.").max(200),
  description: z.string().max(1000),
  content: z.string().max(100000),
});

type Kind = "TEXT" | "FILE";

/** Vòng tải chạy ít nhất 1,4 giây, xong thì giữ dấu tích 1,7 giây như mẫu gốc. */
const FILE_HOLD = { minRunMs: 1400, holdMs: 1700 };

const kinds: Array<{ value: Kind; label: string }> = [
  { value: "TEXT", label: "Ghi chú bí mật" },
  { value: "FILE", label: "Tệp tải lên" },
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
  // Server báo xong thì giữ dấu tích một nhịp rồi mới xóa form. Tải tệp giữ lâu hơn để thấy đủ vòng tải (tệp nhỏ
  // gửi xong gần như tức thì).
  const noteSuccess = useSuccessHold();
  const fileSuccess = useSuccessHold(FILE_HOLD);
  let success = noteSuccess;
  if (kind === "FILE") success = fileSuccess;
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
    clearErrors,
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
    <Panel
      title="Thêm mục mới"
      labelledBy="add-asset-title"
      className="self-start min-w-0 w-full max-w-full"
    >
      <form
        id="add-asset"
        noValidate
        className="min-w-0 w-full space-y-4"
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
          const send = async () => {
            if (kind === "TEXT") {
              return backendAssetService.createText(vaultId, values);
            }
            return backendAssetService.upload(
              vaultId,
              file!,
              values.name,
              values.description,
              (percent) => setUploadPercent(percent),
            );
          };
          const saved = await action.execute(
            () => success.hold(send),
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
                  ? "border-heritage-gold bg-heritage-warning-bg text-heritage-primary"
                  : "border-heritage-border-strong bg-white text-heritage-primary hover:bg-heritage-sunken"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <fieldset disabled={action.pending} className="min-w-0 w-full space-y-4">
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
          {/* Giữ chỗ cho dòng lỗi: nếu dòng lỗi hiện/mất làm nút Lưu dịch chỗ giữa lúc nhấn chuột thì lần bấm bị trượt. */}
          <p role={errors.name ? "alert" : undefined} className="min-h-5 text-sm text-destructive">
            {errors.name?.message}
          </p>
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
                {...register("content", { onChange: () => clearErrors("content") })}
                aria-invalid={Boolean(errors.content)}
                className="mt-2 min-h-32 rounded-xl bg-white px-4 text-sm font-normal"
              />
            </label>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium" aria-hidden="true">
                Tệp tài sản
              </p>
              <AssetFileDrop
                file={file}
                inputKey={fileInputKey}
                invalid={Boolean(fileError)}
                uploading={action.pending}
                percent={uploadPercent}
                done={success.done}
                failed={Boolean(action.error)}
                maxBytes={MAX_ASSET_FILE_BYTES}
                onPick={pickFile}
                onRemove={() => {
                  pickFile(null);
                  setFileInputKey((value) => value + 1);
                }}
              />
            </div>
          )}
          <p
            role={errors.content || fileError ? "alert" : undefined}
            className="min-h-5 text-sm text-destructive"
          >
            {errors.content?.message ?? fileError}
          </p>
          <p className="flex items-start gap-2 text-sm leading-5 text-heritage-muted">
            <Lock className="mt-0.5 size-3.5 shrink-0 text-heritage-success" aria-hidden="true" />
            Nội dung được mã hóa AES-256-GCM trên máy chủ.
          </p>
          <div className="flex flex-wrap gap-3">
            <ActionButton
              type="submit"
              className={buttonStyles.dark}
              pending={action.pending}
              done={success.done}
              pendingLabel="Đang lưu…"
              doneLabel="Đã lưu"
            >
              Lưu tài sản
            </ActionButton>
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
          <p role="status" className="text-sm text-heritage-success">
            Đã lưu tài sản.
          </p>
        )}
      </form>
    </Panel>
  );
}
