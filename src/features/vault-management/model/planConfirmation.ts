import { isAxiosError } from "axios";

/**
 * SETUP-16: Backend báo thao tác gỡ/xóa sẽ làm mất gói Sẵn sàng cuối cùng của kế hoạch đang chạy (kế hoạch về Nháp)
 * và chưa gỡ gì. Chỉ lúc này mới hỏi Chủ kho, đồng ý thì gửi lại kèm confirmPlanDeactivation.
 */
export function needsPlanConfirmation(error: unknown): boolean {
  if (!isAxiosError<{ code?: unknown }>(error) || !error.response) {
    return false;
  }
  return error.response.data?.code === "PLAN_DEACTIVATION_CONFIRMATION_REQUIRED";
}
