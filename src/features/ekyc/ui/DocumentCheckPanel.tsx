import { useState } from "react";
import { IdCard, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { CAMERA_CHECK_CONTENT } from "../model/camera.content";

const content = CAMERA_CHECK_CONTENT.documents;

/** Khung giấy tờ mẫu; chỉ hiển thị tên file cục bộ, không đọc hoặc gửi dữ liệu định danh. */
export function DocumentCheckPanel() {
  const [side, setSide] = useState(0);
  const [names, setNames] = useState<readonly string[]>(["", ""]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(false);
  const [over, setOver] = useState(false);
  /** Kiểm tra file của bản xem trước, chỉ giữ tên file và không xử lý ảnh. */
  function selectFile(file: File | undefined): void {
    if (!file) return;
    const valid = content.accept.split(",").includes(file.type) && file.size <= content.maxBytes;
    setNames((previous) =>
      previous.map((name, index) => (index === side ? (valid ? file.name : "") : name)),
    );
    setError(valid ? "" : content.invalid);
    setNotice(false);
  }
  // TODO: [BẢN THIẾT KẾ THỰC THI - DEVELOPER BLUEPRINT]
  // 1. [MỤC TIÊU]: Đọc giấy tờ theo phiên eKYC, cho người dùng đối chiếu dữ liệu trước khi tiếp tục.
  // 2. [INPUT & OUTPUT]: Ảnh hai mặt và phiên hợp lệ -> DTO OCR cùng trạng thái xác minh từ backend.
  // 3. [CÁC BƯỚC]: Chốt DTO; tạo service và Query hooks; tải ảnh khi người dùng xác nhận;
  //    hiển thị loading/error/empty/success; đối chiếu kết quả rồi chuyển bước so khớp.
  // 4. [HÀM / THƯ VIỆN]: createBaseService, TanStack Query, React Hook Form, Zod.
  // 5. [ĐIỀU KIỆN BIÊN]: Ảnh mờ/sai mặt, OCR thiếu, timeout, phiên hết hạn; không lưu ảnh
  //    hoặc thông tin định danh vào storage/log; hủy dữ liệu khi rời phiên.
  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <section
        aria-labelledby="documents-title"
        className="rounded-2xl border border-heritage-border bg-heritage-surface p-5 sm:p-6"
      >
        <h2 id="documents-title" className="text-xl font-semibold">
          {content.papers}
        </h2>
        <div aria-label={content.papers} className="my-5 flex gap-2">
          {content.sides.map((label, index) => (
            <Button
              key={label}
              size="lg"
              variant={side === index ? "default" : "outline"}
              aria-pressed={side === index}
              onClick={() => {
                setSide(index);
                setError("");
                setNotice(false);
              }}
            >
              {label}
            </Button>
          ))}
        </div>
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setOver(true);
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setOver(false);
            selectFile(event.dataTransfer.files[0]);
          }}
          className={`flex min-h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed bg-heritage-canvas p-6 text-center ${over ? "border-heritage-gold" : "border-heritage-border"}`}
        >
          <IdCard aria-hidden="true" className="mb-4 size-16 text-heritage-gold" />
          <p className="font-semibold">
            {content.choose} · {content.sides[side]}
          </p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-heritage-muted">{content.hint}</p>
          <p className="mt-2 text-xs text-heritage-muted">{content.drop}</p>
          <label className="relative mt-5 flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-heritage-primary px-5 text-sm text-white focus-within:ring-2 focus-within:ring-heritage-gold focus-within:ring-offset-2">
            <Upload aria-hidden="true" className="size-4" />
            {content.choose}
            <input
              key={side}
              type="file"
              accept={content.accept}
              aria-label={`${content.choose} ${content.sides[side]}`}
              aria-invalid={Boolean(error)}
              aria-describedby={`document-file-hint document-file-status${error ? " document-file-error" : ""}`}
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(event) => {
                selectFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
          <p id="document-file-hint" className="mt-3 text-xs text-heritage-muted">
            {content.formats}
          </p>
        </div>
        <p
          id="document-file-status"
          aria-live="polite"
          className="mt-4 break-all text-sm text-heritage-muted"
        >
          {names[side] ? `${content.selected}: ${names[side]}` : content.empty}
        </p>
        {error && (
          <p id="document-file-error" role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <Button
          size="lg"
          className="mt-5 w-full"
          disabled={!names[side]}
          onClick={() => setNotice(true)}
        >
          {content.read}
        </Button>
        {notice && (
          <p role="status" className="mt-4 text-sm leading-6 text-heritage-muted">
            {content.notice}
          </p>
        )}
      </section>
      <section
        aria-labelledby="identity-title"
        className="rounded-2xl border border-heritage-border bg-heritage-surface p-5 sm:p-6"
      >
        <h2 id="identity-title" className="text-xl font-semibold">
          {content.identity}
        </h2>
        <p className="mt-3 text-sm leading-6 text-heritage-muted">{content.identityHint}</p>
        <dl className="mt-6 space-y-5">
          {content.fields.map((field) => (
            <div key={field}>
              <dt className="text-sm font-medium">{field}</dt>
              <dd className="mt-2 rounded-xl border border-heritage-border bg-heritage-canvas px-4 py-3 text-sm text-heritage-muted">
                {content.waiting}
              </dd>
            </div>
          ))}
        </dl>
        <Button size="lg" disabled className="mt-6 w-full">
          {content.continue}
        </Button>
        <Link
          to="?step=face"
          className="mt-4 flex min-h-11 items-center justify-center text-center text-sm font-medium underline underline-offset-4"
        >
          {content.cameraPreview}
        </Link>
      </section>
    </div>
  );
}
