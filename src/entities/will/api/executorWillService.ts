import { z } from "zod";
import { apiClient } from "@/shared/api/axiosClient";
import { willIdentitySchema } from "../model/willIdentity.schema";
import { recipientSchema } from "../model/willRecipient.schema";

/** `vault`: Người thực thi đã nhận vai; `invitation`: người đang được mời đọc trước khi ký. */
export interface ExecutorWillSource {
  kind: "vault" | "invitation";
  id: string;
}

const executorWillSchema = z.object({
  versionNo: z.number().int().positive(),
  signedAt: z.string().datetime({ offset: true }),
  ownerName: z.string(),
  ownerEmail: z.string(),
  recipients: z.array(recipientSchema),
  unassignedAssetCount: z.number().int().nonnegative(),
  identity: willIdentitySchema,
});

export type ExecutorWill = z.infer<typeof executorWillSchema>;

export const executorWillService = {
  /** Có CCCD đầy đủ: không log, không lưu storage, không giữ trong cache (xem useExecutorWillPaper). */
  async get(source: ExecutorWillSource, signal?: AbortSignal): Promise<ExecutorWill> {
    let base = "/executor/vaults";
    if (source.kind === "invitation") base = "/executor/invitations";
    const url = `${base}/${z.string().uuid().parse(source.id)}/will`;
    return executorWillSchema.parse(await apiClient.get<unknown, unknown>(url, { signal }));
  },
};
