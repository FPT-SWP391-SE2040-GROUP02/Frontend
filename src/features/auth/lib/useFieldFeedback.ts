import { useState } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

/**
 * Thời điểm báo lỗi cho form đăng nhập, đăng ký (form dùng mode "onSubmit", reValidateMode "onChange"):
 * - Rời một ô còn trống: không báo gì.
 * - Rời một ô đã gõ mà sai: báo ngay.
 * - Bấm gửi: báo hết, kể cả ô trống, và rung các ô sai.
 * - Đang sửa ô đỏ: hết đỏ ngay khi đúng.
 */
export function useFieldFeedback<T extends FieldValues>(form: UseFormReturn<T>) {
  const { register, trigger, getValues, formState } = form;
  const { errors, isSubmitted } = formState;
  const [shakes, setShakes] = useState<Record<string, number>>({});

  function shake(names: string[]): void {
    setShakes((previous) => {
      const next = { ...previous };
      for (const name of names) {
        next[name] = (next[name] ?? 0) + 1;
      }
      return next;
    });
  }

  /**
   * @param name Ô cần gắn.
   * @param options.partner Ô phải kiểm lại theo ô này (xác nhận mật khẩu đi theo mật khẩu).
   * @param options.onEdit Chạy mỗi lần người dùng sửa ô.
   */
  function field(name: Path<T>, options: { partner?: Path<T>; onEdit?: () => void } = {}) {
    const { partner, onEdit } = options;
    return register(name, {
      onChange: () => {
        onEdit?.();
        // Sau lần bấm gửi, react-hook-form tự kiểm lại ô đang sửa.
        if (!isSubmitted && errors[name]) {
          void trigger(name);
        }
        if (partner && errors[partner]) {
          void trigger(partner);
        }
      },
      onBlur: (event: { target: { value: string } }) => {
        if (!isSubmitted && event.target.value.trim() !== "") {
          void trigger(name);
        }
        if (partner && getValues(partner)) {
          void trigger(partner);
        }
      },
    });
  }

  return { field, shake, shakes };
}
