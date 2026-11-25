import "@testing-library/jest-dom/vitest";
import { setSuccessHoldMs } from "@/shared/lib/useSuccessHold";

// Test không phải chờ nhịp giữ dấu tích của ActionButton.
setSuccessHoldMs(0);
