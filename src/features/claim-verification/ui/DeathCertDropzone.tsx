import * as React from "react";

/**
 * Thuộc tính của component DeathCertDropzone
 */
export interface DeathCertDropzoneProps {
  /**
   * Callback khi file hợp lệ được chọn hoặc kéo thả vào
   */
  onFileSelect?: (file: File) => void;
  /**
   * Các định dạng file cho phép (mặc định: PDF, JPG, PNG)
   */
  acceptedFormats?: string[];
  /**
   * Dung lượng file tối đa (MB, mặc định: 5MB)
   */
  maxSizeMB?: number;
  /**
   * Đang trong tiến trình upload hoặc tính toán SHA-256
   */
  isProcessing?: boolean;
  /**
   * Class CSS bổ sung
   */
  className?: string;
}

/**
 * @description Vùng kéo thả tải lên bản scan Giấy chứng tử số (Death Certificate Dropzone).
 * Hỗ trợ kéo thả, kiểm tra dung lượng định dạng và tự động đóng dấu băm SHA-256.
 *
 * @param {DeathCertDropzoneProps} props Thuộc tính cấu hình Dropzone
 * @returns {React.ReactElement} Phần tử giao diện DeathCertDropzone
 *
 * @example
 * ```tsx
 * <DeathCertDropzone
 *   maxSizeMB={5}
 *   onFileSelect={(file) => handleUploadCertificate(file)}
 * />
 * ```
 */
export const DeathCertDropzone: React.FC<DeathCertDropzoneProps> = ({
  onFileSelect,
  acceptedFormats = [".pdf", ".jpg", ".jpeg", ".png"],
  maxSizeMB = 5,
  isProcessing = false,
  className = "",
}) => {
  const [isDragOver, setIsDragOver] = React.useState<boolean>(false);
  const [selectedFileName, setSelectedFileName] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const validateAndHandleFile = (file: File) => {
    setErrorMessage(null);

    // Kiểm tra dung lượng
    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMessage(`Dung lượng file vượt quá giới hạn ${maxSizeMB}MB`);
      return;
    }

    // Kiểm tra phần mở rộng
    const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!acceptedFormats.includes(ext)) {
      setErrorMessage(`Định dạng không được hỗ trợ. Vui lòng chọn ${acceptedFormats.join(", ")}`);
      return;
    }

    setSelectedFileName(file.name);
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndHandleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndHandleFile(e.target.files[0]);
    }
  };

  return (
    <div className={`w-full flex flex-col gap-2 ${className}`}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? "border-[var(--heritage-gold,#b88e4c)] bg-[var(--heritage-gold-light,#fbf7ee)]"
            : "border-[#c5beaf] bg-[#faf9f5] hover:border-[var(--heritage-gold,#b88e4c)] hover:bg-[#fcfaf6]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(",")}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="text-3xl mb-2">📄</div>

        <div className="text-sm font-semibold text-[var(--heritage-primary,#0b291e)]">
          {selectedFileName ? (
            <span className="text-emerald-700 font-bold">✓ Đã chọn: {selectedFileName}</span>
          ) : (
            "Kéo thả bản scan Giấy chứng tử số hoặc bấm để tải lên"
          )}
        </div>

        <div className="text-xs text-[var(--text-muted,#66786e)] mt-1">
          Hỗ trợ định dạng {acceptedFormats.map((f) => f.toUpperCase().replace(".", "")).join(", ")}{" "}
          (Tối đa {maxSizeMB}MB)
        </div>

        <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold bg-[var(--heritage-gold-light,#fbf7ee)] text-[#7a5b27] border border-[var(--heritage-gold-border,#e8dcc6)] px-3 py-1 rounded-full">
          <span>🔒</span>
          <span>{isProcessing ? "Đang mã hóa & hash..." : "Tự động đóng dấu băm SHA-256"}</span>
        </div>
      </div>

      {errorMessage && (
        <span className="text-xs text-red-600 font-medium px-1">⚠️ {errorMessage}</span>
      )}
    </div>
  );
};
