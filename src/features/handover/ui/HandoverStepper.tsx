import { Stepper, type StepperStep } from "@/shared/ui/Stepper";

const STEPS = [
  "Báo tin",
  "Phản đối 72 giờ",
  "Xét duyệt",
  "Xác minh eKYC",
  "Đồng ý hoặc từ chối",
  "Tải nội dung 30 ngày",
] as const;

/**
 * Sáu bước của quy trình bàn giao theo thiết kế (tiến trình bàn giao): xong, đang ở đây, chờ.
 * @deprecated Lớp bọc mỏng quanh `Stepper` dùng chung; trang mới dùng `Stepper` trực tiếp.
 */
export function HandoverStepper({ current }: { current: number }) {
  const steps: StepperStep[] = STEPS.map((label, index) => {
    const number = index + 1;
    let state: StepperStep["state"] = "todo";
    if (number < current) state = "done";
    if (number === current) state = "current";
    return { id: label, label, state };
  });
  return (
    <Stepper
      steps={steps}
      ariaLabel="Tiến trình bàn giao"
      showState
      stateLabels={{ current: "Đang ở đây", todo: "Chờ" }}
    />
  );
}
