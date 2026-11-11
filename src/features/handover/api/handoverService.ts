import { z } from "zod";
import { apiClient } from "@/shared/api/axiosClient";
import {
  invitationSchema,
  handoverTurnSchema,
  handoverItemSchema,
  mailCheckSchema,
  submissionSchema,
} from "../model/handover.schema";
import type { SubmissionDraft } from "../model/submissionForm";
import { readBlobProblem } from "../model/handover.errors";
const id = z.string().uuid();
const token = z.string().min(1).max(512);
const turn = (value: string) => `/handover/turns/${id.parse(value)}`;
/** API người nhận chính thức; token lời mời không persist ngoài URL lời mời được cấp. */
export const handoverService = {
  async invitation(value: string, signal?: AbortSignal) {
    return invitationSchema.parse(
      await apiClient.get<unknown, unknown>(
        `/handover/invitations/${encodeURIComponent(token.parse(value))}`,
        { signal },
      ),
    );
  },
  /** Công khai: kiểm thư mời bằng mã hồ sơ và 4 số cuối căn cước; hết lượt thử thì 423 HANDOVER_MAIL_CHECK_LOCKED. */
  async checkMail(value: string, caseCode: string, citizenIdLast4: string) {
    return mailCheckSchema.parse(
      await apiClient.post<unknown, unknown>(
        `/handover/invitations/${encodeURIComponent(token.parse(value))}/check-mail`,
        {
          caseCode: z.string().trim().min(1).max(16).parse(caseCode),
          citizenIdLast4: z
            .string()
            .regex(/^\d{4}$/)
            .parse(citizenIdLast4),
        },
      ),
    );
  },
  /** Hồ sơ mới nhất của lượt này; chưa nộp thì Backend trả 204 và hàm này trả null. */
  async latestSubmission(value: string, signal?: AbortSignal) {
    const body = await apiClient.get<unknown, unknown>(`${turn(value)}/submission`, { signal });
    if (body === "" || body === null || body === undefined) return null;
    return submissionSchema.parse(body);
  },
  /** Nộp hồ sơ: lựa chọn, bản khai trên văn bản mẫu và hai ảnh căn cước (multipart). Không retry, không lưu ảnh ở máy. */
  async submitSubmission(value: string, draft: SubmissionDraft) {
    const form = new FormData();
    form.append("Kind", draft.kind);
    form.append("FullName", draft.fullName.trim());
    form.append("CitizenId", draft.citizenId);
    form.append("DateOfBirth", draft.dateOfBirth);
    form.append("ResidenceAddress", draft.residenceAddress.trim());
    form.append("Acknowledged", String(draft.acknowledged));
    form.append("VoluntaryDecline", String(draft.voluntaryDecline));
    if (!draft.front || !draft.back) throw new Error("Cần ảnh căn cước hai mặt.");
    form.append("FrontImage", draft.front);
    form.append("BackImage", draft.back);
    // Bỏ Content-Type mặc định (application/json) để trình duyệt tự đặt multipart kèm boundary; nếu không Backend trả 415.
    return submissionSchema.parse(
      await apiClient.post<unknown, unknown>(`${turn(value)}/submission`, form, {
        headers: { "Content-Type": undefined },
      }),
    );
  },
  async claim(value: string) {
    return handoverTurnSchema.parse(
      await apiClient.post<unknown, unknown>(
        `/handover/invitations/${encodeURIComponent(token.parse(value))}/claim`,
      ),
    );
  },
  async list(signal?: AbortSignal) {
    return z
      .array(handoverTurnSchema)
      .parse(await apiClient.get<unknown, unknown>("/handover/turns/me", { signal }));
  },
  async get(value: string, signal?: AbortSignal) {
    return handoverTurnSchema.parse(await apiClient.get<unknown, unknown>(turn(value), { signal }));
  },
  async decide(value: string, decision: "accept" | "decline") {
    return handoverTurnSchema.parse(
      await apiClient.post<unknown, unknown>(`${turn(value)}/${decision}`),
    );
  },
  /** Xác nhận đã nhận đủ tài sản sau khi tải. */
  async confirmReceivedAll(value: string) {
    return handoverTurnSchema.parse(
      await apiClient.post<unknown, unknown>(`${turn(value)}/received-all`),
    );
  },
  /** Nhập khóa mở gói do Người thực hiện đưa; sai thì 403 HANDOVER_KEY_INVALID, quá giới hạn thì 423. */
  async verifyKey(value: string, key: string) {
    return handoverTurnSchema.parse(
      await apiClient.post<unknown, unknown>(`${turn(value)}/verify-key`, {
        key: z.string().trim().min(1).max(80).parse(key),
      }),
    );
  },
  /** Chốt danh tính lượt bàn giao; BE chuyển READY_TO_ACCEPT nếu đủ điều kiện. */
  async completeIdentity(value: string) {
    return handoverTurnSchema.parse(
      await apiClient.post<unknown, unknown>(`${turn(value)}/identity/complete`),
    );
  },
  async assets(grantId: string, signal?: AbortSignal) {
    return z.array(handoverItemSchema).parse(
      await apiClient.get<unknown, unknown>(`/handover/grants/${id.parse(grantId)}/assets`, {
        signal,
      }),
    );
  },
  /** Không cache blob, không dùng public URL để vượt Bearer hoặc integrity check của BE. */
  async download(grantId: string, itemId: string): Promise<Blob> {
    try {
      return await apiClient.get<Blob, Blob>(
        `/handover/grants/${id.parse(grantId)}/assets/${id.parse(itemId)}/content`,
        { responseType: "blob" },
      );
    } catch (failure) {
      throw await readBlobProblem(failure);
    }
  },
};
