/**
 * @file index.ts
 * @description Public API entry point cho Feature Wills (Digital Will & Testament).
 */

export * from "./model/will.types";
export * from "./model/will.schema";
export * from "./model/useWills";
export * from "./api/willService";
export * from "./lib/adapters";

export { WillStepper, type StepItem } from "./ui/WillStepper";
export { Step3ExecutorActivation, type ExecutorInfo } from "./ui/Step3ExecutorActivation";
export { WillTable } from "./ui/WillTable";
export { WillDetailModal } from "./ui/WillDetailModal";
