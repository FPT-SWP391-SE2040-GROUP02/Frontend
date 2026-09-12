/**
 * @file index.ts
 * @description Public API entry point cho Feature Wills (Digital Will & Testament).
 */

export * from "./model/will.types";
export * from "./model/will.schema";
export * from "./model/useWills";
export * from "./api/willService";
export * from "./lib/adapters";

export { WillStepper } from "./ui/WillStepper";
export { Step1SelectAssets } from "./ui/Step1SelectAssets";
export { Step2AllocateBeneficiaries } from "./ui/Step2AllocateBeneficiaries";
export { Step3VideoAffidavit } from "./ui/Step3VideoAffidavit";
export { Step4CryptographicSeal } from "./ui/Step4CryptographicSeal";
export { WillTable } from "./ui/WillTable";
export { WillDetailModal } from "./ui/WillDetailModal";
