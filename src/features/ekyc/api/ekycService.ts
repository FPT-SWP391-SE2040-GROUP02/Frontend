import { apiClient } from "@/shared/api";
import { ekycDocumentSchema, ekycStatusSchema } from "../model/ekyc.schema";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
function imageForm(file: File) {
  if (
    !["image/jpeg", "image/png"].includes(file.type) ||
    file.size === 0 ||
    file.size > MAX_IMAGE_BYTES
  )
    throw new Error("Chọn ảnh JPEG hoặc PNG có dung lượng tối đa 8 MiB.");
  const form = new FormData();
  form.append("file", file);
  return form;
}
/** Transport sau merge eKYC 3575d4d; không retry gửi ảnh hoặc tự quyết định PASSED. */
export const ekycService = {
  /** GET trạng thái của principal hiện tại. */
  async getStatus(signal?: AbortSignal) {
    return ekycStatusSchema.parse(await apiClient.get<unknown, unknown>("/ekyc/me", { signal }));
  },
  /** POST ảnh mặt trước; response OCR chỉ giữ RAM, chưa nối submit UI nghiệp vụ. */
  async submitDocument(file: File) {
    return ekycDocumentSchema.parse(
      await apiClient.post<unknown, unknown>("/ekyc/document", imageForm(file), {
        headers: { "Content-Type": undefined },
      }),
    );
  },
  /** POST selfie sau document; server kiểm hạn và quyền, mỗi document chỉ match một lần. */
  async matchFace(file: File) {
    return ekycStatusSchema.parse(
      await apiClient.post<unknown, unknown>("/ekyc/face-match", imageForm(file), {
        headers: { "Content-Type": undefined },
      }),
    );
  },
};
