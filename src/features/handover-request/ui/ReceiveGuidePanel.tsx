import { ReceiveGuide } from "@/entities/handoverRecord";
import { availableStep } from "../model/availablePresentation";
import { useAvailableHandovers } from "../model/useHandoverRequest";

/**
 * Hướng dẫn sáu bước ở trang "Nhận tài sản", hiện cả khi chưa có kho nào. Chỉ tô bước đang làm khi có đúng một kho;
 * nhiều kho thì mỗi dòng kho tự ghi bước của mình.
 */
export function ReceiveGuidePanel() {
  const query = useAvailableHandovers();
  let current: number | null = null;
  if (query.isSuccess && query.data.length === 1) {
    current = availableStep(query.data[0]);
  }
  return <ReceiveGuide current={current} defaultOpen />;
}
