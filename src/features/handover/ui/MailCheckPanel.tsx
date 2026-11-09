import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { MailCheck, ShieldAlert, ShieldCheck } from "lucide-react";
import { handoverService } from "../api/handoverService";
import type { MailCheck as MailCheckResult } from "../model/handover.schema";

type Outcome =
  | { kind: "none" }
  | { kind: "ok"; result: MailCheckResult }
  | { kind: "bad"; attemptsLeft: number }
  | { kind: "locked" }
  | { kind: "error" };

/**
 * Kiểm tra thư mời có thật không, không cần đăng nhập (theo prototype): nhập mã hồ sơ ghi trong thư và 4 số cuối căn cước.
 * Có giới hạn số lần thử do Backend quyết định; màn hình chỉ hiện kết quả máy chủ trả về.
 */
export function MailCheckPanel({ token }: { token: string }) {
  const [code, setCode] = useState("");
  const [last4, setLast4] = useState("");
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>({ kind: "none" });
  const ready = code.trim().length > 0 && /^\d{4}$/.test(last4);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ready || pending) return;
    setPending(true);
    try {
      const result = await handoverService.checkMail(token, code.trim(), last4);
      setOutcome(
        result.verified
          ? { kind: "ok", result }
          : { kind: "bad", attemptsLeft: result.attemptsLeft },
      );
    } catch (failure) {
      const locked = isAxiosError(failure) && failure.response?.status === 423;
      setOutcome({ kind: locked ? "locked" : "error" });
    } finally {
      setPending(false);
    }
  };

  return (
    <section
      aria-labelledby="mail-check-title"
      className="rounded-2xl border border-heritage-border bg-white p-5 shadow-sm"
    >
      <header className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F1E6CC] text-[#7A5B24]"
        >
          <MailCheck className="size-5" />
        </span>
        <div>
          <h3 id="mail-check-title" className="font-semibold text-heritage-primary">
            Kiểm tra thư này có thật không
          </h3>
          <p className="mt-1 text-sm leading-6 text-heritage-muted">
            Nhập mã hồ sơ ghi trong thư và 4 số cuối căn cước của bạn. Có giới hạn số lần thử.
          </p>
        </div>
      </header>
      <form onSubmit={(event) => void submit(event)} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-heritage-primary">Mã hồ sơ</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              maxLength={16}
              autoComplete="off"
              spellCheck={false}
              placeholder="Ví dụ: 01A16CF1"
              className="mt-1 h-11 w-full rounded-xl border border-heritage-border bg-white px-3 font-mono text-sm uppercase outline-none focus-visible:border-heritage-gold focus-visible:ring-2 focus-visible:ring-heritage-gold/30"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-heritage-primary">4 số cuối căn cước</span>
            <input
              value={last4}
              onChange={(event) => setLast4(event.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              maxLength={4}
              autoComplete="off"
              className="mt-1 h-11 w-full rounded-xl border border-heritage-border bg-white px-3 font-mono text-sm tracking-widest outline-none focus-visible:border-heritage-gold focus-visible:ring-2 focus-visible:ring-heritage-gold/30"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={!ready || pending}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-heritage-primary px-5 text-sm font-semibold text-white hover:bg-[#133e2f] disabled:pointer-events-none disabled:opacity-50"
        >
          {pending ? "Đang kiểm tra…" : "Kiểm tra"}
        </button>
      </form>
      <div aria-live="polite" className="mt-3">
        {outcome.kind === "ok" && (
          <p
            role="status"
            className="flex items-start gap-2 rounded-xl bg-[#E4F3EB] px-4 py-3 text-sm text-[#1F7A55]"
          >
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              <b>Thư là thật.</b>
              {outcome.result.containerName && <> Gói “{outcome.result.containerName}”</>}
              {outcome.result.ownerFullName && <> · Chủ kho {outcome.result.ownerFullName}</>}.
            </span>
          </p>
        )}
        {outcome.kind === "bad" && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl bg-[#F8E1DE] px-4 py-3 text-sm text-[#A32119]"
          >
            <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>Không khớp. Còn {outcome.attemptsLeft} lần thử.</span>
          </p>
        )}
        {outcome.kind === "locked" && (
          <p role="alert" className="rounded-xl bg-[#F8E1DE] px-4 py-3 text-sm text-[#A32119]">
            Bạn đã thử quá số lần cho phép. Hãy gọi số điện thoại công ty ghi trong thư để xác minh,
            đừng bấm vào liên kết nếu còn nghi ngờ.
          </p>
        )}
        {outcome.kind === "error" && (
          <p role="alert" className="rounded-xl bg-[#F8E1DE] px-4 py-3 text-sm text-[#A32119]">
            Không kiểm tra được lúc này. Kiểm tra liên kết hoặc thử lại sau.
          </p>
        )}
      </div>
    </section>
  );
}
