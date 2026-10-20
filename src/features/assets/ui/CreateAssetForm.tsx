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
import { ADD_ASSET_NAME_ID } from "../model/addAssetForm";
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
    setFileInputKey((value) => value + 1);
  };
  const nameField = register("name");
  return (
    <Panel title="Thêm mục mới" labelledBy="add-asset-title" className="self-start">
      <form
        id="add-asset"
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit(async (values) => {
          setFileError("");
          if (kind === "TEXT" && !values.content.trim()) {
            setError("content", { message: "Nhập nội dung." });
            return;
          }
          if (
            kind === "FILE" &&
            (!file || file.size === 0 || file.size > Math.min(500 * 1024 * 1024, remainingBytes))
          ) {
            setFileError(
              `Chọn tệp không rỗng, tối đa ${formatStorageSize(500 * 1024 * 1024)} và không vượt dung lượng còn lại.`,
            );
            return;
          }
          const saved = await action.execute(
            () =>
              kind === "TEXT"
                ? backendAssetService.createText(vaultId, values)
                : backendAssetService.upload(vaultId, file!, values.name, values.description),
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
            <label className="block text-sm font-medium">
              Tệp tài sản
              <Input
                key={fileInputKey}
                type="file"
                className="mt-2 h-auto rounded-xl bg-white px-3 py-2.5 text-sm font-normal"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
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
