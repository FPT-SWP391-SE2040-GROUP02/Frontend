import { Stepper, type StepperStep } from "@/shared/ui/Stepper";

/**
 * Ba bước theo thứ tự Backend bắt buộc: đọc căn cước → thử thách camera → so khớp khuôn mặt.
 * (Backend chỉ so khớp sau khi thử thách camera đã đạt, nên camera đứng trước.)
 */
const STEPS = [
  { id: "read", label: "Đọc căn cước", hint: "Thông tin và nơi cư trú" },
  { id: "camera", label: "Kiểm tra camera", hint: "Thử thách trực tiếp" },
  { id: "match", label: "So khớp khuôn mặt", hint: "Căn cước và ảnh chân dung" },
];

/**
 * Thanh tiến trình eKYC: bước đã xong có dấu tích, bước hiện tại tô vàng, bước sau để trống.
 * @deprecated Lớp bọc mỏng quanh `Stepper` dùng chung; trang mới dùng `Stepper` trực tiếp.
 */
export function EkycStepper({ current }: { current: 1 | 2 | 3 | 4 }) {
  const steps: StepperStep[] = STEPS.map((step, index) => {
    const number = index + 1;
    let state: StepperStep["state"] = "todo";
    if (number < current) state = "done";
    if (number === current) state = "current";
    return { ...step, state };
  });
  return (
    <Stepper
      steps={steps}
      ariaLabel="Các bước xác minh"
      className="rounded-2xl border border-heritage-border bg-heritage-surface px-4 py-6"
    />
  );
}
