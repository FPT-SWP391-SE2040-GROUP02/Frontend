import {
  useController,
  type FieldValues,
  type Path,
  type PathValue,
  type UseFormReturn,
} from "react-hook-form";
import { isWeakPin, PIN_LENGTH } from "../model/pinRules";
import { PIN_MISMATCH_MESSAGE, PIN_WEAK_MESSAGE } from "../model/vaultPin.schema";
import { PinDotsField } from "./PinDotsField";

/**
 * Hai ô "mã PIN mới" và "nhập lại", dùng chung cho đặt, đổi và quên PIN. Gõ đủ 6 số thì báo ngay mã quá dễ đoán
 * hoặc chưa khớp; mã mới dùng được thì con trỏ tự sang ô nhập lại.
 */
export function NewPinPair<T extends FieldValues>({
  form,
  pinName,
  confirmName,
  idPrefix,
  confirmLabel,
  autoFocus,
}: {
  form: UseFormReturn<T>;
  pinName: Path<T>;
  confirmName: Path<T>;
  idPrefix: string;
  confirmLabel: string;
  autoFocus?: boolean;
}) {
  const {
    field: { ref: pinRef, value: rawPin, onChange: changePin, onBlur: blurPin },
    fieldState: pinState,
  } = useController({ control: form.control, name: pinName });
  const {
    field: { ref: confirmRef, value: rawConfirm, onChange: changeConfirm, onBlur: blurConfirm },
    fieldState: confirmState,
  } = useController({ control: form.control, name: confirmName });
  const pinValue = String(rawPin);
  const confirmValue = String(rawConfirm);

  // Báo ngay khi đủ số; các lỗi còn lại (bỏ trống, thiếu số) chỉ hiện sau khi bấm gửi.
  let pinError = pinState.error?.message;
  const weak = pinValue.length === PIN_LENGTH && isWeakPin(pinValue);
  if (weak) pinError = PIN_WEAK_MESSAGE;

  let confirmError = confirmState.error?.message;
  let matched: string | undefined;
  if (confirmValue.length === PIN_LENGTH) {
    if (confirmValue !== pinValue) {
      confirmError = PIN_MISMATCH_MESSAGE;
    } else if (!weak) {
      matched = "Hai mã đã khớp.";
    }
  }

  return (
    <>
      <PinDotsField
        ref={pinRef}
        id={`${idPrefix}-new`}
        label="Mã PIN mới"
        hint="Đúng 6 chữ số, không dùng số giống nhau hoặc dãy liên tiếp."
        autoFocus={autoFocus}
        value={pinValue}
        error={pinError}
        onBlur={blurPin}
        onChange={(digits) => {
          changePin(digits);
          form.clearErrors(pinName);
          // Đổi mã mới thì phần nhập lại không còn giá trị.
          if (confirmValue !== "") {
            form.setValue(confirmName, "" as PathValue<T, Path<T>>);
            form.clearErrors(confirmName);
          }
          if (digits.length === PIN_LENGTH && !isWeakPin(digits)) form.setFocus(confirmName);
        }}
      />
      <PinDotsField
        ref={confirmRef}
        id={`${idPrefix}-confirm`}
        label={confirmLabel}
        value={confirmValue}
        error={confirmError}
        success={matched}
        onBlur={blurConfirm}
        onChange={(digits) => {
          changeConfirm(digits);
          form.clearErrors(confirmName);
        }}
      />
    </>
  );
}
