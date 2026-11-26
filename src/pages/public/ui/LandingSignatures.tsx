/* Lucian UX/UI Prompt #180 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#180 */
import { useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { prefersReducedMotion } from "../model/motion";
import { useLandingContent } from "../model/usePublicContent";
import "./lucian/u180.css";

/** Con dấu đập xuống: lớn và nghiêng rồi về đúng cỡ, như phần tử gốc. */
function stamp(seal: Element | null): void {
  if (!(seal instanceof HTMLElement) || prefersReducedMotion()) {
    return;
  }
  if (typeof seal.animate !== "function") {
    return;
  }
  seal.animate(
    [
      { transform: "rotate(-25deg) scale(1.35)", opacity: 0.2 },
      { transform: "rotate(-12deg) scale(1)", opacity: 1 },
    ],
    { duration: 450, easing: "cubic-bezier(.2,.8,.2,1)" },
  );
}

/**
 * Minh họa chữ ký ba bên trên một phần biên bản. Backend không bắt thứ tự ký, nên bấm ô nào trước cũng được.
 */
export function SignatureLine() {
  const content = useLandingContent().handover.signatures;
  const [signed, setSigned] = useState<readonly string[]>([]);

  function sign(role: string, event: MouseEvent<HTMLButtonElement>): void {
    if (signed.includes(role)) {
      return;
    }
    setSigned([...signed, role]);
    stamp(event.currentTarget.querySelector(".u180-seal"));
  }

  const people: ReactNode[] = [];
  for (const role of content.roles) {
    const done = signed.includes(role);
    let className = "u180-person";
    if (done) {
      className = "u180-person done";
    }
    people.push(
      <button
        key={role}
        type="button"
        className={className}
        aria-pressed={done}
        onClick={(event) => sign(role, event)}
      >
        <small>{role}</small>
        <span className="u180-seal">{content.seal}</span>
      </button>,
    );
  }

  const complete = signed.length === content.roles.length;
  let status: string = content.hint;
  if (complete) {
    status = content.complete;
  }

  return (
    <div className="ux ux-night u180">
      <div className="u180-signs" role="group" aria-label={content.label}>
        {people}
      </div>
      <p className="mt-3 text-center text-sm leading-6 text-heritage-sunken/75" aria-live="polite">
        {status}
      </p>
      {signed.length > 0 && (
        <div className="text-center">
          <button
            type="button"
            className="min-h-11 px-3 text-sm text-heritage-gold-soft underline underline-offset-4"
            onClick={() => setSigned([])}
          >
            {content.reset}
          </button>
        </div>
      )}
    </div>
  );
}
