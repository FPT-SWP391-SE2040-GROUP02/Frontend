import type { z } from "zod";
import type {
  billingKindSchema,
  billingPlansSchema,
  billingQuoteSchema,
  billingSelectionSchema,
  billingTierSchema,
  billingYearsSchema,
  paymentOrderSchema,
  paymentOrderStatusSchema,
} from "./billing.schema";

export type BillingTier = z.infer<typeof billingTierSchema>;
export type BillingYears = z.infer<typeof billingYearsSchema>;
export type BillingKind = z.infer<typeof billingKindSchema>;
export type BillingPlans = z.infer<typeof billingPlansSchema>;
export type BillingQuote = z.infer<typeof billingQuoteSchema>;
export type BillingSelection = z.infer<typeof billingSelectionSchema>;
export type PaymentOrder = z.infer<typeof paymentOrderSchema>;
export type PaymentOrderStatus = z.infer<typeof paymentOrderStatusSchema>;
