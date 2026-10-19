import { z } from "zod";

/** @description State nhập liệu của wizard preview; chưa phải request estate-plan BE. */
export const willWizardSchema = z.object({
  title: z.string(),
  declarationNotes: z.string(),
  selectedAssetIds: z.array(z.string()),
  beneficiaries: z.array(
    z.object({ id: z.string(), name: z.string(), contact: z.string(), relationship: z.string() }),
  ),
  designations: z.record(z.array(z.string())),
  executor: z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    backupName: z.string().optional(),
    backupEmail: z.string().optional(),
  }),
  policyConfirmed: z.boolean(),
});
/** @description Form state của wizard. */
export type WillWizardFormValues = z.infer<typeof willWizardSchema>;
/** @description Người nhận do người dùng nhập trong preview. */
export type BeneficiaryItem = WillWizardFormValues["beneficiaries"][number];
/** @description Liên kết tài sản với người nhận trong form. */
export type AssetDesignationMap = WillWizardFormValues["designations"];
/** @description Thông tin người thực thi trong form. */
export type ExecutorInfo = WillWizardFormValues["executor"];
