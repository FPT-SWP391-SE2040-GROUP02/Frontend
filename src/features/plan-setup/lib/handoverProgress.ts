import type { z } from "zod";
import type { planSetupSchema } from "../model/planSetup.schema";

type PlanSetup = z.infer<typeof planSetupSchema>;

/** Bốn điều kiện chính của trang Bàn giao, theo mã `missingRequirements` của Backend. */
const KNOWN_CODES = [
  "OWNER_EKYC_REQUIRED",
  "ASSET_REQUIRED",
  "PRIMARY_EXECUTOR_REQUIRED",
  "PAID_SERVICE_REQUIRED",
];

/** Lý do chưa đạt hiện ở thẻ tiến độ. Mã lạ (nếu có) dùng câu chung để không giấu điều kiện của máy chủ. */
const MISSING_LABELS: Record<string, string> = {
  ACCOUNT_NOT_ACTIVE: "Tài khoản chưa hoạt động",
  EMAIL_VERIFICATION_REQUIRED: "Cần xác minh email",
  VAULT_NOT_OPEN: "Kho phải đang mở",
  PAID_SERVICE_REQUIRED: "Cần gói dịch vụ trả phí còn hạn",
  OWNER_EKYC_REQUIRED: "Chưa xác minh danh tính (eKYC)",
  ASSET_REQUIRED: "Kho chưa có tài sản nào",
  PLAN_NOT_DRAFT: "Kế hoạch đã rời trạng thái nháp",
};

/** Cảnh báo không chặn kích hoạt. Mã lạ vẫn hiện nguyên văn. */
const WARNING_LABELS: Record<string, string> = {
  NO_BACKUP_EXECUTOR: "Chưa có Người thực thi dự phòng. Bạn vẫn kích hoạt được.",
};

export interface HandoverProgress {
  done: number;
  total: number;
  /** Các điều kiện chưa đạt, đã đổi sang câu tiếng Việt. */
  missingTexts: string[];
}

/** Câu cho một điều kiện chưa đạt; riêng Người thực thi tách "chưa chọn" và "đã mời nhưng chưa chấp nhận". */
function missingText(code: string, executors: PlanSetup["executors"]): string {
  if (code === "PRIMARY_EXECUTOR_REQUIRED") {
    for (const executor of executors) {
      if (executor.status === "INVITED" || executor.status === "SUSPENDED") {
        return "Người thực thi chưa chấp nhận";
      }
    }
    return "Chưa chọn Người thực thi";
  }
  if (Object.hasOwn(MISSING_LABELS, code)) {
    return MISSING_LABELS[code];
  }
  return "Còn điều kiện cần kiểm tra với máy chủ";
}

/** Đếm điều kiện đạt/tổng (gồm cả mã lạ của máy chủ) và liệt kê điều kiện chưa đạt. */
export function computeHandoverProgress(setup: PlanSetup): HandoverProgress {
  let done = 0;
  for (const code of KNOWN_CODES) {
    if (!setup.missingRequirements.includes(code)) {
      done = done + 1;
    }
  }
  const missingTexts: string[] = [];
  let extra = 0;
  for (const code of setup.missingRequirements) {
    if (!KNOWN_CODES.includes(code)) {
      extra = extra + 1;
    }
    missingTexts.push(missingText(code, setup.executors));
  }
  return { done, total: KNOWN_CODES.length + extra, missingTexts };
}

/** Đổi mã cảnh báo thành câu tiếng Việt. */
export function warningText(code: string): string {
  if (Object.hasOwn(WARNING_LABELS, code)) {
    return WARNING_LABELS[code];
  }
  return code;
}
