import { isAxiosError } from "axios";

/** Tên tệp tải về an toàn, không chứa ký tự đường dẫn hoặc điều khiển. */
export function safeFileName(value: string): string {
  return value.replace(/[^\p{L}\p{N} ._()-]/gu, "_").slice(0, 120);
}

/** Lưu Blob thành tệp: object URL chỉ sống tạm rồi thu hồi, không vào cache. */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeFileName(fileName);
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Body lỗi của endpoint tải là Blob (responseType blob) nên mã lỗi bị mất.
 * Đọc lại thành object JSON để báo đúng lỗi; body không phải JSON thì bỏ đi.
 */
export async function readBlobFailure(failure: unknown): Promise<unknown> {
  if (isAxiosError<unknown>(failure) && failure.response?.data instanceof Blob) {
    try {
      failure.response.data = JSON.parse(await failure.response.data.text()) as unknown;
    } catch {
      failure.response.data = undefined;
    }
  }
  return failure;
}
