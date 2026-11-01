import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ownerVaultService } from "../api/ownerVaultService";
import { ownerVaultKeys } from "../model/useOwnerVault";

const schema = z.object({
  name: z.string().max(200, "Tên kho tối đa 200 ký tự."),
  // Ô mô tả đang ẩn khỏi giao diện; vẫn gửi chuỗi rỗng để giữ nguyên DTO.
  description: z.string(),
});
/**
 * Tạo chủ động; POST có thể trả cùng kho đã được tạo ở tab khác.
 * showIntro=false ẩn đoạn giới thiệu khi trang bao ngoài đã giải thích (màn chưa có kho).
 */
export function CreateVaultForm({ showIntro = true }: { showIntro?: boolean }) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { name: "", description: "" },
  });
  return (
    <form
      noValidate
      onSubmit={handleSubmit(async (values) => {
        await action.execute(
          () => ownerVaultService.createMine(values),
          (vault) => {
            client.setQueryData(ownerVaultKeys.mine, vault);
            void client.invalidateQueries({ queryKey: ownerVaultKeys.all });
          },
        );
      })}
      className="space-y-4 rounded-xl border border-heritage-border bg-heritage-surface p-6 text-left"
    >
      <h2 className="text-lg font-semibold">Đặt tên kho</h2>
      {showIntro && (
        <p className="text-sm leading-6 text-heritage-muted">
          Bắt đầu với một kho cá nhân để sắp xếp nội dung. Để trống tên nếu muốn dùng tên mặc định
          là Kho của tôi.
        </p>
      )}
      <fieldset disabled={action.pending} className="space-y-4">
        <label className="block space-y-2 text-sm">
          Tên kho
          <Input
            {...register("name")}
            placeholder="Để trống sẽ dùng tên mặc định là Kho của tôi"
            aria-invalid={Boolean(errors.name)}
          />
        </label>
        {errors.name && (
          <p role="alert" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
        <Button type="submit" className="min-h-11">
          {action.pending ? "Đang tạo kho…" : "Xác nhận"}
        </Button>
      </fieldset>
      {action.error && (
        <div role="alert" className="space-y-2 text-sm text-destructive">
          <p>{action.error}</p>
          <Link
            className="inline-flex min-h-11 items-center underline"
            to={ROUTES.AUTH.VERIFY_EMAIL}
          >
            Xác minh email / gửi lại liên kết
          </Link>
        </div>
      )}
    </form>
  );
}
