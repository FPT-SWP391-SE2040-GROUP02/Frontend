import { useId, type ReactNode } from "react";
import { useProvinces, useWards } from "@/entities/administrativeUnit";
import { buttonStyles, InfoRow, Panel } from "@/shared/ui/heritageKit";
import { Input } from "@/shared/ui/input";
import type { DeathCase } from "../model/deathCase.schema";
import { buildRegistrationPlace, formatIsoDate, previewSentence } from "../model/certificateInfo";
import { SearchableSelect } from "./SearchableSelect";
import type { useCertificateInfoForm } from "../model/useCertificateInfoForm";

type CertificateInfoForm = ReturnType<typeof useCertificateInfoForm>;

/** Ô nhập có nhãn, gợi ý và dòng lỗi ngay bên dưới (đọc được bằng trình đọc màn hình). */
function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-heritage-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Mục "Thông tin trên giấy": Người thực thi chỉ điền 3 thông tin nhìn trên giấy chứng tử, lưu vào bản nháp khi rời ô hoặc khi chọn.
 * Họ tên và ngày sinh Chủ kho hệ thống đã có từ xác minh danh tính nên không phải nhập.
 */
export function CertificateInfoPanel({
  form,
  record,
  ownerName,
  disabled,
}: {
  form: CertificateInfoForm;
  record: DeathCase;
  ownerName: string;
  disabled: boolean;
}) {
  const baseId = useId();
  const provinces = useProvinces();
  const wards = useWards(form.values.provinceCode);
  const { values, errors } = form;
  const locked = disabled || form.saving;

  const provinceList = provinces.data ?? [];
  const wardList = wards.data ?? [];
  const province = provinceList.find((item) => item.code === values.provinceCode);
  const ward = wardList.find((item) => item.code === values.wardCode);
  // Chưa tải xong danh mục mà giá trị chưa đổi so với bản đã lưu thì dùng câu Backend đã ghép sẵn.
  let placeText = buildRegistrationPlace(province?.name ?? "", ward?.name ?? "");
  const unchangedPlace =
    values.provinceCode === form.server.provinceCode && values.wardCode === form.server.wardCode;
  if (!placeText && unchangedPlace) placeText = record.currentVersion.deathRegistrationPlace;

  let wardPlaceholder = "Chọn tỉnh trước";
  if (values.provinceCode) {
    wardPlaceholder = wards.isPending ? "Đang tải danh sách…" : "Chọn phường / xã";
  }
  let provincePlaceholder = "Chọn tỉnh / thành phố";
  if (provinces.isPending) provincePlaceholder = "Đang tải danh sách…";

  const dateId = `${baseId}-death`;
  const issuedId = `${baseId}-issued`;
  const provinceId = `${baseId}-province`;
  const wardId = `${baseId}-ward`;

  const segments = previewSentence(ownerName, values, placeText);
  let statusText = "";
  if (form.saving) statusText = "Đang lưu…";
  else if (form.dirty && form.missing.length === 0 && !form.hasLocalErrors) {
    statusText = "Có thay đổi chưa lưu.";
  }

  return (
    <Panel title="Thông tin trên giấy">
      <p className="text-sm leading-6 text-heritage-muted">
        Chỉ cần 3 thông tin, nhìn trên giấy rồi điền đúng như giấy ghi. Họ tên và ngày sinh của Chủ
        kho hệ thống đã có, bạn không phải nhập.
      </p>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field id={dateId} label="Ngày mất" error={errors.dateOfDeath}>
          <Input
            id={dateId}
            type="date"
            value={values.dateOfDeath}
            max={form.today}
            disabled={locked}
            aria-invalid={errors.dateOfDeath ? true : undefined}
            aria-describedby={errors.dateOfDeath ? `${dateId}-error` : undefined}
            onChange={(event) => form.setDate("dateOfDeath", event.target.value)}
            onBlur={() => void form.commit()}
          />
        </Field>
        <Field
          id={issuedId}
          label="Ngày đăng ký khai tử"
          hint="Ngày ghi ở cuối giấy, cạnh chữ ký của UBND."
          error={errors.issuedOn}
        >
          <Input
            id={issuedId}
            type="date"
            value={values.issuedOn}
            max={form.today}
            disabled={locked}
            aria-invalid={errors.issuedOn ? true : undefined}
            aria-describedby={errors.issuedOn ? `${issuedId}-error` : `${issuedId}-hint`}
            onChange={(event) => form.setDate("issuedOn", event.target.value)}
            onBlur={() => void form.commit()}
          />
        </Field>
      </div>

      <fieldset className="mt-5 space-y-3">
        <legend className="text-sm font-semibold">Nơi đăng ký khai tử</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id={provinceId} label="Tỉnh / thành phố" error={errors.provinceCode}>
            <SearchableSelect
              id={provinceId}
              value={values.provinceCode}
              options={provinceList}
              placeholder={provincePlaceholder}
              searchLabel="Gõ để lọc tỉnh / thành phố"
              disabled={locked || provinces.isPending}
              invalid={Boolean(errors.provinceCode)}
              describedBy={errors.provinceCode ? `${provinceId}-error` : undefined}
              onChange={(code) => void form.setProvince(code)}
            />
          </Field>
          <Field id={wardId} label="Phường / xã" error={errors.wardCode}>
            <SearchableSelect
              id={wardId}
              value={values.wardCode}
              options={wardList}
              placeholder={wardPlaceholder}
              searchLabel="Gõ để lọc phường / xã"
              disabled={locked || !values.provinceCode || wards.isPending}
              invalid={Boolean(errors.wardCode)}
              describedBy={errors.wardCode ? `${wardId}-error` : undefined}
              onChange={(code) => void form.setWard(code)}
            />
          </Field>
        </div>
        {(provinces.isError || wards.isError) && (
          <p role="alert" className="text-sm text-destructive">
            Không tải được danh sách tỉnh, phường. Tải lại trang rồi thử lại.
          </p>
        )}
      </fieldset>

      <div className="mt-5 rounded-xl border border-heritage-border bg-white px-4 py-3">
        <p className="text-xs text-heritage-muted">
          Câu này sẽ được in vào biên bản của người nhận:
        </p>
        <p data-testid="certificate-preview" className="mt-2 text-sm leading-7">
          {segments.map((segment, index) => {
            if (segment.fixed) return <span key={index}>{segment.text}</span>;
            return (
              <mark
                key={index}
                data-filled={segment.filled ? "true" : "false"}
                className={`rounded px-1 text-black ${segment.filled ? "bg-[#F6E3A3]" : "bg-[#F8E1DE]"}`}
              >
                {segment.text}
              </mark>
            );
          })}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={buttonStyles.outline}
          disabled={locked || !form.dirty || form.hasLocalErrors || form.missing.length > 0}
          onClick={() => void form.save()}
        >
          Lưu thông tin
        </button>
        {statusText && (
          <span role="status" className="text-sm text-heritage-muted">
            {statusText}
          </span>
        )}
      </div>
      {form.saveError && Object.keys(errors).length === 0 && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {form.saveError}
        </p>
      )}
    </Panel>
  );
}

/** Ba thông tin đã nộp, chỉ xem: dùng trong giấy tiếp nhận (bản đã gửi hoặc đã duyệt không sửa được). */
export function CertificateInfoSummary({ record }: { record: DeathCase }) {
  const version = record.currentVersion;
  const death = version.dateOfDeath ? formatIsoDate(version.dateOfDeath) : "—";
  const issued = version.issuedOn ? formatIsoDate(version.issuedOn) : "—";
  const place = version.deathRegistrationPlace || "—";
  return (
    <dl className="divide-y divide-heritage-border">
      <InfoRow label="Ngày mất">{death}</InfoRow>
      <InfoRow label="Ngày đăng ký khai tử">{issued}</InfoRow>
      <InfoRow label="Nơi đăng ký khai tử">{place}</InfoRow>
    </dl>
  );
}
