import { FileText, Lock, UploadCloud } from "lucide-react";

/**
 * @description Thuộc tính cấu hình cho LegalDropzone component.
 */
export interface LegalDropzoneProps {
  /** Tiêu đề khung kéo thả */
  title?: string;
  /** Chú thích định dạng và kích thước */
  subtitle?: string;
  /** Tem băm niêm phong */
  sealLabel?: string;
  /** Callback khi người dùng chọn file */
  onFileSelect?: (file: File) => void;
  /** Class CSS tùy chỉnh */
  className?: string;
}

/**
 * @description Khung kéo thả scan Giấy chứng tử số & tài liệu pháp lý chuẩn Master UI Kit với tem băm SHA-256 tự động.
 *
 * @param {LegalDropzoneProps} props Thuộc tính component
 * @returns {React.JSX.Element} Khung dropzone tài liệu pháp lý
 *
 * @example
 * ```tsx
 * <LegalDropzone onFileSelect={file => console.log(file)} />
 * ```
 */
export function LegalDropzone({
  title = "Kéo thả bản scan Giấy chứng tử số",
  subtitle = "Hỗ trợ PDF, JPG, PNG (Tối đa 5MB)",
  sealLabel = "🔒 Tự động đóng dấu băm SHA-256",
  onFileSelect,
  className = "",
}: LegalDropzoneProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect?.(e.target.files[0]);
    }
  };

  return (
    <label className={`dropzone-box block cursor-pointer group hover:border-[var(--primary)] dark:hover:border-[var(--gold)] transition-colors ${className}`}>
      <input type="file" className="hidden" onChange={handleChange} accept=".pdf,.jpg,.jpeg,.png" />
      
      <div className="w-12 h-12 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
        <UploadCloud className="w-6 h-6" />
      </div>

      <div className="text-[12.5px] font-bold text-[var(--primary)] dark:text-[#F3F7F4]">
        {title}
      </div>

      <div className="text-[10.5px] text-[var(--text-muted)] mt-0.5">
        {subtitle}
      </div>

      {sealLabel && (
        <span className="inline-flex items-center gap-1 mt-3 px-2.5 py-1 rounded-[20px] bg-[var(--gold-light)] text-[#7D5D28] dark:text-[#E2C17D] border border-[var(--gold-border)] text-[10.5px] font-semibold">
          <Lock className="w-3 h-3 text-[#A07839]" />
          <span>{sealLabel}</span>
        </span>
      )}
    </label>
  );
}
