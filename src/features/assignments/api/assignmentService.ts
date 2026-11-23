import { z } from "zod";
import { apiClient } from "@/shared/api";
import { VAULT_PIN_HEADER } from "@/shared/api/vaultPin";
import {
  assignmentListSchema,
  setAssetRecipientsSchema,
} from "@/entities/assignment/model/assignment.schema";

const idSchema = z.string().uuid();
const assignments = (vaultId: string) => `/vaults/${idSchema.parse(vaultId)}/assignments`;
const assetAssignments = (vaultId: string, assetId: string) =>
  `/vaults/${idSchema.parse(vaultId)}/assets/${idSchema.parse(assetId)}/assignments`;

/**
 * Gán tài sản cho người nhận. Backend đòi mã PIN của kho khi thêm hoặc gỡ gán: transport tự hỏi PIN,
 * nên service không giữ PIN.
 */
export const assignmentService = {
  /** Mọi dòng gán của kho, theo thứ tự gán. FE gom theo tài sản hoặc theo người nhận. */
  async list(vaultId: string, signal?: AbortSignal) {
    return assignmentListSchema.parse(
      await apiClient.get<unknown, unknown>(assignments(vaultId), { signal }),
    );
  },
  /**
   * Đặt lại toàn bộ người nhận của một tài sản. Nhiều người nghĩa là nhận chung. Gỡ hết khi kế hoạch đang chạy
   * thì Backend trả 409 PLAN_DEACTIVATION_CONFIRMATION_REQUIRED; chỉ gửi confirmPlanDeactivation khi người dùng đã đồng ý.
   */
  async setRecipients(
    vaultId: string,
    assetId: string,
    beneficiaryIds: string[],
    confirmPlanDeactivation = false,
    pin?: string,
  ) {
    const body = setAssetRecipientsSchema.parse({ beneficiaryIds, confirmPlanDeactivation });
    const url = assetAssignments(vaultId, assetId);
    // Gán nhiều tài sản một lượt: gửi sẵn PIN đã kiểm để không hỏi lại ở từng tài sản.
    let response: unknown;
    if (pin === undefined) {
      response = await apiClient.put<unknown, unknown>(url, body);
    } else {
      response = await apiClient.put<unknown, unknown>(url, body, {
        headers: { [VAULT_PIN_HEADER]: pin },
      });
    }
    return assignmentListSchema.parse(response);
  },
  /** Gỡ một người nhận khỏi một tài sản. */
  async unassign(
    vaultId: string,
    assetId: string,
    beneficiaryId: string,
    confirmPlanDeactivation = false,
  ) {
    return assignmentListSchema.parse(
      await apiClient.delete<unknown, unknown>(
        `${assetAssignments(vaultId, assetId)}/${idSchema.parse(beneficiaryId)}`,
        { params: { confirmPlanDeactivation } },
      ),
    );
  },
};
