import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, X } from "lucide-react";
import type { SuggestedRecipient } from "@/entities/handoverRecord";
import { MAX_REPORT_RECIPIENTS } from "../model/reportForm";

const INPUT = "h-11 w-full rounded-xl border border-heritage-border bg-white px-3";
const EMPTY_RECIPIENT: SuggestedRecipient = { fullName: "", email: "", phone: "" };

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
 * Các dòng người nhận để luật sư liên hệ nhanh: họ tên, email, số điện thoại. Có sẵn Người nhận 1; thanh
 * "Thêm người nhận" ở dưới mở thêm khối mới trượt xuống ngay trong form, dấu × thu khối lại.
 * Dòng đang thu không còn nằm trong dữ liệu gửi lên `onChange`.
 */
export function RecipientRows({
  disabled,
  onChange,
}: {
  disabled: boolean;
  onChange: (rows: SuggestedRecipient[]) => void;
}) {
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

  function update(key: number, field: keyof SuggestedRecipient, value: string) {
    commit(
      entries.map((entry) =>
        entry.key === key ? { ...entry, person: { ...entry.person, [field]: value } } : entry,
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
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1">
                  <span className="block font-semibold">Họ tên</span>
                  <input
                    className={INPUT}
                    maxLength={200}
                    value={entry.person.fullName}
                    disabled={disabled}
                    onChange={(event) => update(entry.key, "fullName", event.target.value)}
                  />
                </label>
                <label className="space-y-1">
                  <span className="block font-semibold">Email</span>
                  <input
                    type="email"
                    className={INPUT}
                    maxLength={256}
                    value={entry.person.email}
                    disabled={disabled}
                    onChange={(event) => update(entry.key, "email", event.target.value)}
                  />
                </label>
                <label className="space-y-1">
                  <span className="block font-semibold">Số điện thoại</span>
                  <input
                    type="tel"
                    className={INPUT}
                    maxLength={32}
                    value={entry.person.phone}
                    disabled={disabled}
                    onChange={(event) => update(entry.key, "phone", event.target.value)}
                  />
                </label>
              </div>
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
