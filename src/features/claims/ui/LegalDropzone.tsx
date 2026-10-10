import React, { useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";


/**
 * @file LegalDropzone.tsx
 * @description Khung kéo thả tải lên chứng từ tử tuất/tòa án chuyên dụng cho Người Thi Hành (Executor).
 * Tuân thủ tuyệt đối:
 * 1. ZERO useState: Không sử dụng useState gây re-render thừa; hiệu ứng kéo thả được quản lý qua DOM ref/data-attributes.
 * 2. Rule 7 (Scaffold with TODO): Khung logic băm SHA-256 và đẩy Cloudflare R2 để trống cho Developer tự viết theo Hướng 1.
 * 3. Rule 8 (JSDoc): Đầy đủ tài liệu định dạng chuẩn.
 */

export interface LegalDropzoneProps {
  /** Callback khi tải lên và tính toán mã băm SHA-256 thành công */
  onUploadSuccess: (fileUrl: string, fileHash: string, fileName: string) => void;
  /** Vô hiệu hóa vùng kéo thả */
  disabled?: boolean;
}

export interface UploadedFileResult {
  fileUrl: string;
  fileHash: string;
  fileName: string;
  fileSize: number;
}

/**
 * Khung kéo thả tải tệp scan chứng từ tử tuất
 * @param {LegalDropzoneProps} props Thuộc tính component
 * @returns {React.JSX.Element} Dropzone component
 */
export const LegalDropzone: React.FC<LegalDropzoneProps> = ({
  onUploadSuccess,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneContainerRef = useRef<HTMLDivElement>(null);

  // ZERO useState: Sử dụng TanStack Query useMutation duy nhất để quản lý vòng đời Async/Server State
  const uploadMutation = useMutation<UploadedFileResult, Error, File>({
    mutationFn: async (_file: File) => {
      // =========================================================================
      // [RULE 7 - BẮT BUỘC TỰ CODE LOGIC THỰC THI]
      // =========================================================================
      // TODO: [P2][EVIDENCE-01] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
      // 1. [MỤC TIÊU]: Validate tệp theo chính sách upload chứng cứ được BE xác nhận.
      // 2. [INPUT & OUTPUT]: File + policy MIME/size/count -> file hợp lệ hoặc inline error.
      // 3. [CÁC BƯỚC]: Sau DEATH-01 chốt policy; schema/guard ở model; kiểm trước upload; BE vẫn kiểm nội dung thực.
      // 4. [HÀM / THƯ VIỆN]: Zod/native File, shared constants, service policy.
      // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Không áp quota Free 20 MiB thành giới hạn mỗi chứng cứ; file rỗng/sai MIME/quá hạn; không ghi file/CCCD vào log.

      // TODO: [P2][EVIDENCE-02] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
      // 1. [MỤC TIÊU]: Tính checksum chỉ khi hợp đồng upload yêu cầu.
      // 2. [INPUT & OUTPUT]: File hợp lệ -> SHA-256 hex/checksum theo DTO.
      // 3. [CÁC BƯỚC]: Sau EVIDENCE-01 chốt định dạng checksum; arrayBuffer -> crypto.subtle.digest -> encode; BE đối chiếu độc lập.
      // 4. [HÀM / THƯ VIỆN]: Web Crypto API, TextEncoder/Uint8Array theo kiểu input.
      // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Băm không chứng minh giấy tờ hợp pháp; tệp lớn/abort/mất quyền; không lưu bytes hoặc checksum kèm dữ liệu định danh vào log.

      // TODO: [P2][EVIDENCE-03] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
      // 1. [MỤC TIÊU]: Khởi tạo upload private đúng death-case.
      // 2. [INPUT & OUTPUT]: caseId/version + metadata -> upload session/document reference.
      // 3. [CÁC BƯỚC]: Sau DEATH-01 chốt upload BE hoặc staging/presigned; service/hook riêng; kiểm scope và thời hạn; không tự bịa route /storage/presigned-upload.
      // 4. [HÀM / THƯ VIỆN]: Shared transport, FormData, Zod, TanStack Query.
      // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Không coi URL ký sẵn là document hoàn tất; không lộ secret storage; signed URL ngắn hạn/không log; đổi case phải hủy reference cũ.

      // TODO: [P2][EVIDENCE-04] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
      // 1. [MỤC TIÊU]: Gửi binary theo transport đã chốt và xác nhận hoàn tất.
      // 2. [INPUT & OUTPUT]: File + upload session -> response upload/finalize BE.
      // 3. [CÁC BƯỚC]: Sau EVIDENCE-03 upload qua service; nếu presigned thì PUT đúng headers rồi finalize; chỉ cho tiếp tục sau server xác nhận.
      // 4. [HÀM / THƯ VIỆN]: FormData/shared transport; fetch chỉ cho presigned được xác nhận.
      // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Mạng gián đoạn, expired URL, abort, 413/415; không đặt Bearer API lên storage URL; không tự tạo link public.

      // TODO: [P2][EVIDENCE-05] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
      // 1. [MỤC TIÊU]: Migrate UploadedFileResult sang reference chứng cứ BE.
      // 2. [INPUT & OUTPUT]: Response đã validate -> documentId/name/checksum/status theo DTO.
      // 3. [CÁC BƯỚC]: Sau EVIDENCE-04 chốt schema; đổi props/callers đồng bộ; bỏ giả định fileUrl public; adapter ở entity.
      // 4. [HÀM / THƯ VIỆN]: Zod, TypeScript, entity adapter, RHF setValue.
      // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Không gửi URL bất kỳ làm bằng chứng; file chưa finalize hoặc thuộc case khác phải bị chặn; không giả thành công khi helper còn throw.
      
      throw new Error("Chưa cài đặt uploadMutation.mutationFn - Vui lòng tự hoàn thiện 5 bước băm SHA-256 và tải lên R2 theo Rule 7.");
    },
    onSuccess: (data) => {
      // TODO: [P2][EVIDENCE-06] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
      // 1. [MỤC TIÊU]: Đồng bộ form chỉ với chứng cứ đã được BE nhận.
      // 2. [INPUT & OUTPUT]: Document response -> callback reference cho form case hiện tại.
      // 3. [CÁC BƯỚC]: Sau EVIDENCE-05 cập nhật callback signature; kiểm case/version; invalidate document list; xóa reference khi upload lỗi/đổi hồ sơ.
      // 4. [HÀM / THƯ VIỆN]: useMutation onSuccess, RHF setValue, queryKeys.
      // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Callback hiện có chỉ là wiring legacy; response muộn không gắn vào case khác; không dùng URL local/public để bypass quyền.
      onUploadSuccess(data.fileUrl, data.fileHash, data.fileName);
    },
  });

  const handleProcessFile = (file: File) => {
    // TODO: [P2][EVIDENCE-07] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
    // 1. [MỤC TIÊU]: Điều khiển upload theo session/case và trạng thái pending.
    // 2. [INPUT & OUTPUT]: File chọn/drop -> một mutation đúng case hoặc validation error.
    // 3. [CÁC BƯỚC]: Sau EVIDENCE-01..06 disable pending; guard drop/input thống nhất; hủy khi đổi phiên; thông báo API lỗi để retry.
    // 4. [HÀM / THƯ VIỆN]: TanStack Query, refs DOM, RHF/Zod, shared/ui.
    // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Không gửi lặp nhiều drop; thiếu session/case thì chặn; không giữ evidence trong storage hoặc tái dùng upload của người khác.
    uploadMutation.mutate(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploadMutation.isPending && dropzoneContainerRef.current) {
      dropzoneContainerRef.current.classList.add("border-[#B88E4C]", "bg-[#FBF7EE]");
    }
  };

  const handleDragLeave = () => {
    if (dropzoneContainerRef.current) {
      dropzoneContainerRef.current.classList.remove("border-[#B88E4C]", "bg-[#FBF7EE]");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropzoneContainerRef.current) {
      dropzoneContainerRef.current.classList.remove("border-[#B88E4C]", "bg-[#FBF7EE]");
    }
    if (disabled || uploadMutation.isPending) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const isSuccess = uploadMutation.isSuccess && uploadMutation.data;

  return (
    <div className="w-full space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || uploadMutation.isPending}
      />

      <div
        ref={dropzoneContainerRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploadMutation.isPending && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-[20px] p-6 text-center cursor-pointer transition-all ${
          isSuccess
            ? "border-[#059669] bg-[#E5EDE8]/40"
            : "border-[#DCD9D0] bg-[#FAF9F5] hover:border-[#B88E4C] hover:bg-[#FBF7EE]/40"
        } ${disabled || uploadMutation.isPending ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        {uploadMutation.isPending ? (
          <div className="flex flex-col items-center justify-center py-4 space-y-3">
            <Loader2 className="w-8 h-8 text-[#B88E4C] animate-spin" />
            <p className="text-xs font-bold text-[#0B291E]">Đang băm SHA-256 & truyền tệp lên Cloudflare R2...</p>
            <p className="text-[10px] text-[#66786E]">Vui lòng không đóng trình duyệt</p>
          </div>
        ) : isSuccess ? (
          <div className="flex flex-col items-center justify-center py-2 space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#E5EDE8] flex items-center justify-center text-[#059669]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#0B291E]">{uploadMutation.data.fileName}</p>
              <p className="text-[10px] text-[#66786E]">
                {(uploadMutation.data.fileSize / 1024 / 1024).toFixed(2)} MB • Đã niêm phong băm SHA-256
              </p>
            </div>
            {/* Thẻ hiển thị mã băm toàn vẹn */}
            <div className="w-full max-w-md mt-2 p-2 rounded-xl bg-[#FAF9F5] border border-[#DCD9D0] text-left">
              <span className="text-[10px] font-bold text-[#B88E4C] block uppercase tracking-wider">
                Mã Băm Toàn Vẹn (Integrity Hash):
              </span>
              <p className="font-mono text-[10px] text-[#14241C] truncate select-all">
                {uploadMutation.data.fileHash}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                uploadMutation.reset();
                fileInputRef.current?.click();
              }}
              className="text-[11px] font-bold text-[#B88E4C] hover:underline pt-1"
            >
              Chọn tệp khác thay thế
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 space-y-3">
            <div className="w-12 h-12 rounded-[16px] bg-[#E5EDE8] flex items-center justify-center text-[#0B291E]">
              <UploadCloud className="w-6 h-6 text-[#0B291E]" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#14241C]">
                Kéo thả tệp scan hoặc <span className="text-[#B88E4C] underline">bấm để chọn file</span>
              </p>
              <p className="text-[11px] text-[#66786E] mt-0.5">
                Hỗ trợ PDF, PNG, JPG (Tối đa 20MB). Tệp sẽ được băm SHA-256 ngay tại máy khách.
              </p>
            </div>
          </div>
        )}
      </div>

      {uploadMutation.error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadMutation.error.message}</span>
        </div>
      )}
    </div>
  );
};
