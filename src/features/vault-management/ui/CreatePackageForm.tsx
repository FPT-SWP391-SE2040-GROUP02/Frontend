import {
  createPackageSchema,
  type CreatePackageFormInput,
} from "@/entities/package/model/package.schema";
import { PACKAGE_FIELD_LABELS } from "@/entities/package/model/package.types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PACKAGE_FORM_CONTENT as content } from "../model/packageForm.constants";

/**
 * @description Form kiểm tra thông tin gói; chưa gửi dữ liệu tới máy chủ.
 * @returns Biểu mẫu tên và mô tả với validation khi rời ô.
 */
export function CreatePackageForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm<CreatePackageFormInput>({
    mode: "onBlur",
    reValidateMode: "onBlur",
    resolver: zodResolver(createPackageSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  /**
   * @description Điểm nối submit sau khi dữ liệu vượt qua schema.
   * @returns Không tạo gói trong scaffold hiện tại.
   */
  const onSubmit = (): void => {
    // TODO: [P1][VAULT-01] DEVELOPER BLUEPRINT
    // 1. [MỤC TIÊU & NGHIỆP VỤ]: Tạo gói trong kho của Owner đã đăng nhập.
    // 2. [INPUT & OUTPUT]: CreatePackageRequest đã validate -> PackageResponse hoặc lỗi API.
    // 3. [CÁC BƯỚC]: Nhận dữ liệu từ handleSubmit; gọi useCreateOwnerPackage;
    //    chỉ báo thành công/reset form sau response; hook invalidate cache Owner.
    // 4. [HÀM / THƯ VIỆN]: React Hook Form, createPackageSchema,
    //    useCreateOwnerPackage, cơ chế thông báo lỗi chung.
    // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Chưa có kho, phiên hết hạn, thiếu quyền,
    //    lỗi validation/server; chặn double-submit; giữ dữ liệu khi thất bại.
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{content.title}</h2>
        <p className="text-sm text-heritage-muted">{content.preview}</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="package-name" className="block text-sm font-medium">
          {PACKAGE_FIELD_LABELS.NAME}
        </label>

        <Input
          id="package-name"
          {...register("name")}
          placeholder={content.namePlaceholder}
          aria-required="true"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "package-name-error" : undefined}
          className="min-h-11"
        />

        {errors.name && (
          <p id="package-name-error" role="alert" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="package-description" className="block text-sm font-medium">
          {PACKAGE_FIELD_LABELS.DESCRIPTION}
        </label>

        <Textarea
          id="package-description"
          {...register("description")}
          placeholder={content.descriptionPlaceholder}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? "package-description-error" : undefined}
        />

        {errors.description && (
          <p id="package-description-error" role="alert" className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      {isSubmitSuccessful && (
        <p role="status" className="text-sm text-heritage-primary">
          {content.validationPassed}
        </p>
      )}

      <Button type="submit" className="min-h-11">
        {content.submit}
      </Button>
    </form>
  );
}
