// Lucian UX/UI Prompt #401 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#401
import { useLayoutEffect, useRef } from "react";
import { cn } from "cn";
import "./googleBusy.css";

/** Bề rộng khung chữ lúc mới hiện, gần bằng nút Google, để thấy nút co lại cho vừa câu. */
const START_WIDTH_PX = 180;

/**
 * Hiện thay nút Google sau khi người dùng đã chọn tài khoản: vòng bốn màu xoay trong lúc server xử lý, xong thì
 * thành dấu tích. Nút Google do Google vẽ trong khung riêng nên app không đổi được hình của nó.
 */
export function GoogleBusyPill({
  done,
  busyLabel,
  doneLabel,
}: {
  done: boolean;
  busyLabel: string;
  doneLabel: string;
}) {
  const labels = useRef<HTMLSpanElement>(null);
  const busyText = useRef<HTMLSpanElement>(null);
  const doneText = useRef<HTMLSpanElement>(null);
  const first = useRef(true);

  useLayoutEffect(() => {
    const box = labels.current;
    let target = busyText.current;
    if (done) {
      target = doneText.current;
    }
    if (box === null || target === null) {
      return;
    }
    const width = target.offsetWidth;
    if (!width) {
      box.style.width = "";
      return;
    }
    if (first.current) {
      first.current = false;
      box.style.width = `${START_WIDTH_PX}px`;
      // Buộc trình duyệt ghi nhận bề rộng đầu trước khi đổi, để có chuyển động co.
      void box.offsetWidth;
    }
    box.style.width = `${width}px`;
  }, [done, busyLabel, doneLabel]);

  let status = busyLabel;
  if (done) {
    status = doneLabel;
  }

  return (
    <div className={cn("u401-pill", done && "is-ok")}>
      <span className="u401-ic" aria-hidden="true">
        <svg className="u401-arc" viewBox="0 0 20 20">
          <g>
            <circle cx="10" cy="10" r="8" stroke="#EA4335" strokeDashoffset="0" />
            <circle cx="10" cy="10" r="8" stroke="#4285F4" strokeDashoffset="-12.57" />
            <circle cx="10" cy="10" r="8" stroke="#34A853" strokeDashoffset="-25.13" />
            <circle cx="10" cy="10" r="8" stroke="#FBBC05" strokeDashoffset="-37.7" />
          </g>
        </svg>
        <svg className="u401-ck" viewBox="0 0 20 20">
          <path d="M4.8 10.4l3.4 3.4 7-7.4" />
        </svg>
      </span>
      <span className="u401-lb" ref={labels} aria-hidden="true">
        <span className="u401-busy" ref={busyText}>
          {busyLabel}
        </span>
        <span className="u401-ok" ref={doneText}>
          {doneLabel}
        </span>
      </span>
      <span className="sr-only" role="status">
        {status}
      </span>
    </div>
  );
}
