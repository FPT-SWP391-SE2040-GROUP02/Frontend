import type { ComponentProps } from "react";
import { Input } from "@/shared/ui/input";
import { cn } from "cn";

/** Số chữ số của mã PIN kho (BE: VaultPinRules.PinLength). */
export const PIN_DIGITS = 6;

interface PinCodeInputProps extends Omit<
  ComponentProps<"input">,
  "type" | "inputMode" | "maxLength" | "autoComplete" | "value" | "onChange"
> {
  value: string;
  /** Nhận chuỗi chỉ gồm chữ số, tối đa 6 số. */
  onValueChange: (digits: string) => void;
}

/** Ô nhập mã PIN 6 số: ẩn ký tự, bàn phím số, không cho trình duyệt tự điền, chỉ nhận chữ số. */
export function PinCodeInput({ value, onValueChange, className, ...props }: PinCodeInputProps) {
  return (
    <Input
      type="password"
      inputMode="numeric"
      autoComplete="off"
      maxLength={PIN_DIGITS}
      value={value}
      onChange={(event) => {
        onValueChange(event.target.value.replace(/\D/g, "").slice(0, PIN_DIGITS));
      }}
      className={cn(
        "mt-1.5 h-[52px] bg-heritage-surface text-center text-2xl tracking-[0.6em] [text-indent:0.6em] placeholder:text-heritage-subtle",
        className,
      )}
      {...props}
    />
  );
}
