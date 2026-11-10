import { z } from "zod";
import { apiClient } from "@/shared/api/axiosClient";
import { handoverDocumentSchema, type DocumentKind } from "../model/handoverDocument.schema";

const id = z.string().uuid();
const documentsSchema = z.array(handoverDocumentSchema);

/** Transport biên bản theo controller thật; không tự quyết trạng thái hay chữ ký ở máy. */
export const handoverDocumentService = {
  /**
   * Người nhận chọn Chấp nhận hoặc Từ chối. Phần 1 về Chủ kho đã chép sẵn từ hồ sơ chứng tử, biên bản vào thẳng bước người nhận.
   * Gọi lại cùng lựa chọn trả biên bản cũ; chọn lại khác thì đổi được khi người nhận chưa nộp hồ sơ.
   */
  async create(turnId: string, kind: DocumentKind) {
    return handoverDocumentSchema.parse(
      await apiClient.post<unknown, unknown>(`/handover/turns/${id.parse(turnId)}/document`, {
        kind,
      }),
    );
  },
  /** Biên bản của lượt; null khi chưa bắt đầu (Backend trả 204 không có body). */
  async getByTurn(turnId: string, signal?: AbortSignal) {
    const body = await apiClient.get<unknown, unknown>(
      `/handover/turns/${id.parse(turnId)}/document`,
      { signal },
    );
    if (body === "" || body == null) return null;
    return handoverDocumentSchema.parse(body);
  },
  /** Mục Biên Bản của người nhận: mọi biên bản, mới nhất trước, không giới hạn thời gian. */
  async listMine(signal?: AbortSignal) {
    return documentsSchema.parse(
      await apiClient.get<unknown, unknown>("/handover/documents", { signal }),
    );
  },
  /** Người thực thi chỉ xem lại biên bản của các kho mình làm Người thực thi. */
  async listForExecutor(signal?: AbortSignal) {
    return documentsSchema.parse(
      await apiClient.get<unknown, unknown>("/executor/handover-documents", { signal }),
    );
  },
  async listForVerifier(signal?: AbortSignal) {
    return documentsSchema.parse(
      await apiClient.get<unknown, unknown>("/verifier/handover-documents", { signal }),
    );
  },
};
