import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "cn";
import { latestAdultBirthDate, type SuggestedRecipient } from "@/entities/handoverRecord";
import { DatePickerInput } from "@/shared/ui/date-picker-input";
import {
  isBlankRecipient,
  MAX_REPORT_RECIPIENTS,
  recipientFieldErrors,
  type RecipientField,
  type RecipientFieldErrors,
} from "../model/reportForm";

const INPUT = "h-11 w-full rounded-xl border border-heritage-border bg-white px-3";
const INVALID = "border-heritage-danger focus-visible:outline-heritage-danger";
const EMPTY_RECIPIENT: SuggestedRecipient = {
  fullName: "",
  email: "",
  phone: "",
  citizenId: "",
  dateOfBirth: "",
};

/** Lọc ký tự ngay lúc gõ để ô không nhận chữ cái: số điện thoại chỉ giữ số, +, khoảng trắng, chấm, gạch; căn cước chỉ giữ 12 số. */
const FILTERS: Partial<Record<RecipientField, (value: string) => string>> = {
  phone: (value) => value.replace(/[^\d+\s.-]/g, ""),
  citizenId: (value) => value.replace(/\D/g, "").slice(0, 12),
};

/** Câu báo lỗi dưới ô: hiện nhẹ nhàng, trình đọc màn hình đọc ngay. */
function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="pm-fade text-sm font-normal text-destructive">
      {children}
    </p>
  );
}

/** Thời gian trượt khi thêm hoặc bỏ một khối; bằng `.receive-collapse-slow` trong CSS. */
const SLIDE_MS = 300;

interface RecipientEntry {
  key: number;
  person: SuggestedRecipient;
  /** Đang thu lại sau khi bấm ×: đã bị loại khỏi dữ liệu form, chờ hết hoạt ảnh rồi mới gỡ khỏi màn hình. */
  closing: boolean;
  /** Khối mới thêm bằng nút: trượt xuống khi hiện. Khối có sẵn lúc mở form hiện ngay, không có hoạt ảnh. */
  slideIn: boolean;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

/**
 * Khung trượt của một dòng người nhận. Mở: bắt đầu ở độ cao 0 rồi mở ra ở khung hình kế tiếp. Đóng: thu về 0 và
 * không nhận tab hay chuột trong lúc thu.
 */
function SlideRow({
  slideIn,
  closing,
  children,
}: {
  slideIn: boolean;
  closing: boolean;
  children: ReactNode;
}) {
  const [shown, setShown] = useState(!slideIn);
  useEffect(() => {
    if (shown) {
      return;
    }
    const frame = window.requestAnimationFrame(() => setShown(true));
    return () => window.cancelAnimationFrame(frame);
  }, [shown]);
  const open = shown && !closing;
  return (
    <div
      data-open={open}
      inert={closing}
      aria-hidden={closing || undefined}
      className="receive-collapse receive-collapse-slow"
    >
      <div>
        <div className="pb-3">{children}</div>
      </div>
    </div>
  );
}

/**
 * Các dòng người nhận để luật sư liên hệ và đối chiếu: họ tên, email, số điện thoại, số căn cước, ngày sinh. Có sẵn Người nhận 1; thanh
 * "Thêm người nhận" ở dưới mở thêm khối mới trượt xuống ngay trong form, dấu × thu khối lại.
 * Dòng đang thu không còn nằm trong dữ liệu gửi lên `onChange`.
 */
export function RecipientRows({
  disabled,
  showErrors = false,
  onChange,
}: {
  disabled: boolean;
  /** Đã bấm nộp: hiện mọi lỗi, kể cả ô chưa chạm tới. */
  showErrors?: boolean;
  onChange: (rows: SuggestedRecipient[]) => void;
}) {
  const id = useId();
  // Ô đã rời khỏi (blur) thì mới báo lỗi, để người dùng không bị mắng giữa lúc đang gõ.
  const [visited, setVisited] = useState<ReadonlySet<string>>(new Set());
  const nextKey = useRef(1);
  const timers = useRef<number[]>([]);
  const [entries, setEntries] = useState<RecipientEntry[]>([
    { key: 0, person: EMPTY_RECIPIENT, closing: false, slideIn: false },
  ]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  function commit(next: RecipientEntry[]) {
    setEntries(next);
    onChange(next.filter((entry) => !entry.closing).map((entry) => entry.person));
  }

  function update(key: number, field: RecipientField, value: string) {
    commit(
      entries.map((entry) =>
        entry.key === key
          ? { ...entry, person: { ...entry.person, [field]: FILTERS[field]?.(value) ?? value } }
          : entry,
      ),
    );
  }

  function add() {
    const key = nextKey.current;
    nextKey.current += 1;
    commit([...entries, { key, person: EMPTY_RECIPIENT, closing: false, slideIn: true }]);
  }

  function remove(key: number) {
    if (prefersReducedMotion()) {
      commit(entries.filter((entry) => entry.key !== key));
      return;
    }
    commit(entries.map((entry) => (entry.key === key ? { ...entry, closing: true } : entry)));
    const timer = window.setTimeout(() => {
      setEntries((current) => current.filter((entry) => entry.key !== key));
    }, SLIDE_MS);
    timers.current.push(timer);
  }

  function visit(key: number, field: RecipientField) {
    setVisited((current) => new Set(current).add(`${key}.${field}`));
  }

  /** Lỗi của một dòng; dòng để trống hoàn toàn không báo lỗi gì. Trùng email, căn cước tính với các dòng đứng trước. */
  function errorsOf(entry: RecipientEntry): RecipientFieldErrors {
    if (isBlankRecipient(entry.person)) return {};
    const before = entries
      .filter((other) => !other.closing && other.key < entry.key)
      .map((other) => other.person);
    return recipientFieldErrors(entry.person, before);
  }

  function shown(
    key: number,
    field: RecipientField,
    errors: RecipientFieldErrors,
  ): string | undefined {
    if (!showErrors && !visited.has(`${key}.${field}`)) return undefined;
    return errors[field];
  }

  // Số thứ tự hiển thị chỉ tính các khối chưa đóng; khối đang thu giữ chỗ ngay sau khối mở liền trước để nhãn không đổi giữa lúc mờ dần.
  const numbers: number[] = [];
  let openCount = 0;
  for (const entry of entries) {
    if (entry.closing) {
      numbers.push(openCount + 1);
    } else {
      openCount += 1;
      numbers.push(openCount);
    }
  }
  return (
    <div>
      {entries.map((entry, index) => {
        const number = numbers[index];
        return (
          <SlideRow key={entry.key} slideIn={entry.slideIn} closing={entry.closing}>
            <div
              role="group"
              aria-label={`Người nhận ${number}`}
              className="space-y-3 rounded-xl border border-heritage-border bg-white p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-heritage-primary">Người nhận {number}</p>
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={`Bỏ người nhận ${number}`}
                  className="-my-2 -mr-2 inline-flex size-11 cursor-pointer items-center justify-center rounded-lg text-heritage-muted hover:bg-heritage-sunken hover:text-heritage-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold-hover disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => remove(entry.key)}
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              {(() => {
                const errors = errorsOf(entry);
                const nameError = shown(entry.key, "fullName", errors);
                const emailError = shown(entry.key, "email", errors);
                const phoneError = shown(entry.key, "phone", errors);
                const citizenError = shown(entry.key, "citizenId", errors);
                const birthError = shown(entry.key, "dateOfBirth", errors);
                // Thiếu cả email lẫn số điện thoại: báo khi người dùng đã rời một trong hai ô, hoặc sau khi bấm nộp.
                let contactError: string | undefined;
                if (
                  showErrors ||
                  visited.has(`${entry.key}.email`) ||
                  visited.has(`${entry.key}.phone`)
                ) {
                  contactError = errors.contact;
                }
                const base = `${id}-${entry.key}`;
                return (
                  <>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="space-y-1">
                        <span className="block font-semibold">Họ tên</span>
                        <input
                          className={cn(INPUT, nameError && INVALID)}
                          maxLength={200}
                          value={entry.person.fullName}
                          disabled={disabled}
                          aria-invalid={Boolean(nameError)}
                          aria-describedby={nameError ? `${base}-name` : undefined}
                          onChange={(event) => update(entry.key, "fullName", event.target.value)}
                          onBlur={() => visit(entry.key, "fullName")}
                        />
                        <FieldError id={`${base}-name`}>{nameError}</FieldError>
                      </label>
                      <label className="space-y-1">
                        <span className="block font-semibold">Email</span>
                        <input
                          type="email"
                          className={cn(INPUT, emailError && INVALID)}
                          maxLength={256}
                          value={entry.person.email}
                          disabled={disabled}
                          aria-invalid={Boolean(emailError)}
                          aria-describedby={emailError ? `${base}-email` : undefined}
                          onChange={(event) => update(entry.key, "email", event.target.value)}
                          onBlur={() => visit(entry.key, "email")}
                        />
                        <FieldError id={`${base}-email`}>{emailError}</FieldError>
                      </label>
                      <label className="space-y-1">
                        <span className="block font-semibold">Số điện thoại</span>
                        <input
                          type="tel"
                          inputMode="tel"
                          autoComplete="off"
                          placeholder="0912345678"
                          className={cn(INPUT, phoneError && INVALID)}
                          maxLength={32}
                          value={entry.person.phone}
                          disabled={disabled}
                          aria-invalid={Boolean(phoneError)}
                          aria-describedby={phoneError ? `${base}-phone` : undefined}
                          onChange={(event) => update(entry.key, "phone", event.target.value)}
                          onBlur={() => visit(entry.key, "phone")}
                        />
                        <FieldError id={`${base}-phone`}>{phoneError}</FieldError>
                      </label>
                    </div>
                    <FieldError id={`${base}-contact`}>{contactError}</FieldError>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1">
                        <span className="block font-semibold">
                          Số căn cước{" "}
                          <span className="font-normal text-heritage-muted">(12 số)</span>
                        </span>
                        <input
                          inputMode="numeric"
                          autoComplete="off"
                          className={cn(INPUT, citizenError && INVALID)}
                          maxLength={12}
                          value={entry.person.citizenId}
                          disabled={disabled}
                          aria-invalid={Boolean(citizenError)}
                          aria-describedby={citizenError ? `${base}-citizen` : undefined}
                          onChange={(event) => update(entry.key, "citizenId", event.target.value)}
                          onBlur={() => visit(entry.key, "citizenId")}
                        />
                        <FieldError id={`${base}-citizen`}>{citizenError}</FieldError>
                      </label>
                      <div className="space-y-1">
                        <span className="block font-semibold">Ngày sinh</span>
                        <DatePickerInput
                          aria-label={`Ngày sinh của người nhận ${number}`}
                          value={entry.person.dateOfBirth}
                          max={latestAdultBirthDate()}
                          disabled={disabled}
                          placeholder="ngày/tháng/năm"
                          aria-invalid={Boolean(birthError)}
                          aria-describedby={birthError ? `${base}-birth` : undefined}
                          className={cn(
                            "min-h-11 bg-white font-normal placeholder:text-heritage-muted",
                            birthError && `${INVALID} aria-invalid:bg-white`,
                          )}
                          onChange={(iso) => update(entry.key, "dateOfBirth", iso)}
                          onBlur={() => visit(entry.key, "dateOfBirth")}
                        />
                        <FieldError id={`${base}-birth`}>{birthError}</FieldError>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </SlideRow>
        );
      })}
      {openCount < MAX_REPORT_RECIPIENTS && (
        <button
          type="button"
          disabled={disabled}
          className="receive-press inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-heritage-primary/35 bg-heritage-primary-light px-5 text-sm font-semibold text-heritage-primary hover:border-heritage-primary/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold-hover disabled:pointer-events-none disabled:opacity-50"
          onClick={add}
        >
          Thêm người nhận
          <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
