import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { backendAssetService } from "../api/backendAssetService";

const schema = z.object({
  name: z.string().regex(/\S/, "Nhập tên tài sản.").max(200),
  description: z.string().max(1000),
  content: z.string().max(100000),
});
/** Nội dung chỉ ở form RAM; không nằm trong MutationCache/QueryCache, tên/mô tả không chứa bí mật. */
export function CreateAssetForm({
  vaultId,
  remainingBytes,
}: {
  vaultId: string;
  remainingBytes: number;
}) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const [kind, setKind] = useState("TEXT");
  const [fileError, setFileError] = useState("");
  const [file, setFile] = useState<File | null>(null);
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
  return (
    <details className="rounded-xl border border-heritage-border bg-heritage-surface p-6">
      <summary className="min-h-11 cursor-pointer font-semibold">Thêm tài sản</summary>
      <form
        noValidate
        className="mt-4 space-y-4"
        onSubmit={handleSubmit(async (values, event) => {
          setFileError("");
          if (kind === "TEXT" && !values.content.trim()) {
            setError("content", { message: "Nhập nội dung tài sản." });
            return;
          }
          if (
            kind === "FILE" &&
            (!file || file.size === 0 || file.size > Math.min(500 * 1024 * 1024, remainingBytes))
          ) {
            setFileError("Chọn tệp không rỗng, tối đa 500 MiB và không vượt dung lượng còn lại.");
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
          if (saved) {
            reset();
            setFile(null);
            if (event?.target instanceof HTMLFormElement) event.target.reset();
          }
        })}
      >
        <p className="text-sm leading-6 text-heritage-muted">
          Tên và mô tả là metadata, không nhập mật khẩu hoặc bí mật vào hai ô này. Nội dung được máy
          chủ lưu theo cơ chế mã hóa của hệ thống.
        </p>
        <fieldset disabled={action.pending} className="space-y-4">
          <label className="block space-y-2 text-sm">
            Loại tài sản
            <select
              className="block min-h-11 w-full rounded-lg border border-heritage-border bg-heritage-surface px-3"
              value={kind}
              onChange={(e) => {
                setKind(e.target.value);
                reset();
                setFile(null);
                setFileError("");
              }}
            >
              <option value="TEXT">Nội dung văn bản</option>
              <option value="FILE">Tệp</option>
            </select>
          </label>
          <label className="block space-y-2 text-sm">
            Tên tài sản
            <Input {...register("name")} aria-invalid={Boolean(errors.name)} />
          </label>
          {errors.name && (
            <p role="alert" className="text-sm text-destructive">
              {errors.name.message}
            </p>
          )}
          <label className="block space-y-2 text-sm">
            Mô tả
            <Textarea {...register("description")} aria-invalid={Boolean(errors.description)} />
          </label>
          {errors.description && (
            <p role="alert" className="text-sm text-destructive">
              {errors.description.message}
            </p>
          )}
          {kind === "TEXT" ? (
            <label className="block space-y-2 text-sm">
              Nội dung bí mật
              <Textarea
                autoComplete="off"
                {...register("content")}
                aria-invalid={Boolean(errors.content)}
                className="min-h-36"
              />
            </label>
          ) : (
            <label className="block space-y-2 text-sm">
              Tệp tài sản
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
          )}
          {(errors.content || fileError) && (
            <p role="alert" className="text-sm text-destructive">
              {errors.content?.message ?? fileError}
            </p>
          )}
          <Button type="submit" className="min-h-11">
            {action.pending ? "Đang lưu…" : "Lưu tài sản"}
          </Button>
        </fieldset>
        {action.error && (
          <p role="alert" className="text-sm text-destructive">
            {action.error}
          </p>
        )}
        {action.succeeded && (
          <p role="status" className="text-sm text-heritage-primary">
            Đã lưu tài sản.
          </p>
        )}
      </form>
    </details>
  );
}
