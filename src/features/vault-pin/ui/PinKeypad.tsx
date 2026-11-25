// Lucian UX/UI Prompt #480 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#480
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Delete } from "lucide-react";
import { cn } from "cn";
import { PIN_LENGTH } from "../model/pinRules";
import { enterPinFormSchema } from "../model/vaultPin.schema";
import "./pinKeypad.css";

/** Chờ chấm cuối nảy xong rồi mới gửi. Máy bật giảm chuyển động thì gửi ngay. */
const SUBMIT_DELAY_MS = 260;
/** Sáu chấm đỏ rung trong khoảng này khi hộp mở lại vì PIN sai. */
const WRONG_FLASH_MS = 620;
/** Thời gian phím trên màn hình lún xuống khi gõ bằng bàn phím máy tính. */
const PRESS_MS = 140;
const TOP_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * Bàn phím số để nhập mã PIN: sáu chấm, đủ 6 số thì tự gửi. Gõ bằng bàn phím máy tính, dán và xóa vẫn được.
 * Không tự kiểm PIN đúng hay sai: Backend kiểm, sai thì hộp mở lại kèm `error`.
 */
export function PinKeypad({
  error,
  onSubmit,
}: {
  /** Câu báo PIN vừa nhập chưa đúng. */
  error?: string;
  onSubmit: (pin: string) => void;
}) {
  const messageId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  // Vị trí chấm vừa xóa, để chấm đó thu nhỏ lại.
  const [removed, setRemoved] = useState<number | null>(null);
  const [flash, setFlash] = useState(Boolean(error));
  const [pressed, setPressed] = useState<string | null>(null);
  const [tooShort, setTooShort] = useState("");

  const latestSubmit = useRef(onSubmit);
  useEffect(() => {
    latestSubmit.current = onSubmit;
  });

  useEffect(() => {
    if (value.length !== PIN_LENGTH) {
      return;
    }
    let wait = SUBMIT_DELAY_MS;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      wait = 0;
    }
    const timer = window.setTimeout(() => latestSubmit.current(value), wait);
    return () => window.clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    if (!flash) {
      return;
    }
    const timer = window.setTimeout(() => setFlash(false), WRONG_FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [flash]);

  useEffect(() => {
    if (pressed === null) {
      return;
    }
    const timer = window.setTimeout(() => setPressed(null), PRESS_MS);
    return () => window.clearTimeout(timer);
  }, [pressed]);

  function change(next: string): void {
    // Đủ số rồi thì đang gửi, không nhận thêm.
    if (value.length === PIN_LENGTH) {
      return;
    }
    const digits = next.replace(/\D/g, "").slice(0, PIN_LENGTH);
    if (digits.length < value.length) {
      setRemoved(digits.length);
    } else {
      setRemoved(null);
    }
    setValue(digits);
    setFlash(false);
    setTooShort("");
  }

  /** Bàn phím máy tính: ô nhập tự nhận chữ; đang đứng ở phím trên màn hình thì chuyển phím gõ vào ô. */
  function handleKey(event: KeyboardEvent<HTMLDivElement>): void {
    const inInput = event.target === input.current;
    if (/^[0-9]$/.test(event.key)) {
      setPressed(event.key);
      if (!inInput) {
        event.preventDefault();
        change(value + event.key);
      }
      return;
    }
    if (event.key === "Backspace" && !inInput) {
      event.preventDefault();
      change(value.slice(0, -1));
      return;
    }
    if (event.key === "Enter" && inInput) {
      const checked = enterPinFormSchema.safeParse({ pin: value });
      if (!checked.success) {
        setTooShort(checked.error.issues[0].message);
      }
    }
  }

  let message = "";
  if (tooShort) {
    message = tooShort;
  } else if (error) {
    message = error;
  }

  function digitKey(digit: string) {
    return (
      <button
        key={digit}
        type="button"
        className={cn("u480-k", pressed === digit && "is-down")}
        // Không lấy tiêu điểm của ô nhập, để gõ bàn phím máy tính tiếp được.
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => change(value + digit)}
      >
        {digit}
      </button>
    );
  }

  return (
    <div className="u480 space-y-2" onKeyDown={handleKey}>
      <div className="u480-field">
        <input
          ref={input}
          type="password"
          inputMode="none"
          autoComplete="off"
          autoFocus
          maxLength={PIN_LENGTH}
          aria-label="Mã PIN bảo vệ"
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          value={value}
          onChange={(event) => change(event.target.value)}
        />
        <div className={cn("u480-dots", flash && "is-bad")} aria-hidden="true">
          {Array.from({ length: PIN_LENGTH }, (_, index) => (
            <i
              key={index}
              className={cn(
                "u480-d",
                index < value.length && "is-on",
                index === removed && index >= value.length && "is-off",
                index === value.length && "is-next",
              )}
            />
          ))}
        </div>
      </div>
      <span className="sr-only" aria-live="polite">
        {`Đã nhập ${value.length} trên ${PIN_LENGTH} số`}
      </span>
      <div className="min-h-10 text-center">
        {message && (
          <p id={messageId} role="alert" className="text-sm font-medium text-heritage-danger">
            {message}
          </p>
        )}
      </div>
      <div className="u480-pad">
        {TOP_KEYS.map((digit) => digitKey(digit))}
        <span />
        {digitKey("0")}
        <button
          type="button"
          className="u480-k"
          aria-label="Xóa một số"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => change(value.slice(0, -1))}
        >
          <Delete className="size-6" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
