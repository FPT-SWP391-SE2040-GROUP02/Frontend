import { useId, useState, type CSSProperties } from "react";
import { Check, ChevronDown } from "lucide-react";
import { usePolicyWindows } from "@/shared/settings/usePolicyWindows";
import {
  RECEIVE_STEP_ROLES,
  RECEIVE_STEP_TITLES,
  receiveStepTexts,
  type ReceiveStepRole,
} from "../model/receiveSteps";

const ROLE_BADGE: Record<ReceiveStepRole["kind"], string> = {
  mine: "bg-heritage-primary-light text-heritage-primary",
  lawyer: "bg-heritage-warning-bg text-heritage-warning",
  shared: "bg-heritage-sunken text-heritage-muted",
};

/** Một bước trên đường thời gian: số, tên, ai làm; bấm vào mới hiện lời giải thích. */
function GuideStep({
  number,
  title,
  text,
  role,
  current,
}: {
  number: number;
  title: string;
  text: string;
  role: ReceiveStepRole;
  current: number | null;
}) {
  const done = current !== null && number < current;
  const here = current === number;
  // null: chưa bấm lần nào, bước đang làm tự mở sẵn.
  const [chosen, setChosen] = useState<boolean | null>(null);
  let open = here;
  if (chosen !== null) {
    open = chosen;
  }
  const textId = useId();
  let circle = "border-heritage-gold-soft bg-heritage-gold-soft text-heritage-primary";
  if (role.kind === "lawyer") {
    circle = "border-heritage-gold-soft bg-heritage-gold-light text-heritage-primary";
  }
  if (done) circle = "border-heritage-success bg-heritage-success text-white";
  if (here) circle = "border-heritage-primary bg-heritage-primary text-white";

  return (
    <li aria-current={here ? "step" : undefined} className="flex gap-3">
      <div aria-hidden="true" className="flex flex-col items-center">
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${circle}`}
        >
          {done ? <Check className="size-4" /> : number}
        </span>
        {number < RECEIVE_STEP_TITLES.length && (
          <span className="w-0.5 flex-1 bg-heritage-border" />
        )}
      </div>
      <div className="min-w-0 flex-1 pb-3">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={textId}
          onClick={() => setChosen(!open)}
          className="-mt-1.5 flex w-full cursor-pointer flex-wrap items-center gap-x-2 gap-y-1 rounded-lg py-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
        >
          <span className="text-sm font-semibold text-heritage-primary">{title}</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE[role.kind]}`}
          >
            {role.label}
          </span>
          {done && <span className="text-xs font-semibold text-heritage-success">Đã xong</span>}
          {here && (
            <span className="text-xs font-semibold text-heritage-success">Bạn đang ở đây</span>
          )}
        </button>
        <div id={textId} className="receive-collapse" data-open={open} inert={!open}>
          <div>
            <p className="pt-1 text-sm leading-6 text-heritage-muted">{text}</p>
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * Hướng dẫn người nhận đi hết quy trình, từ gửi yêu cầu tới tải tài sản. current là bước đang làm (1–6), 7 khi đã xong
 * hết, null khi chưa gắn với bước nào. Chỉ giải thích quy trình, không hiện dữ liệu của hồ sơ cụ thể.
 */
export function ReceiveGuide({
  current = null,
  defaultOpen = false,
}: {
  current?: number | null;
  defaultOpen?: boolean;
}) {
  const policy = usePolicyWindows();
  const texts = receiveStepTexts(policy.grantDays);
  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border border-heritage-border bg-white p-5 shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-left font-semibold text-heritage-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold">
        Cách nhận tài sản: 6 bước
        <ChevronDown
          className="size-5 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <p className="mt-2 text-sm leading-6 text-heritage-muted">
        LegacyVault không tự biết khi nào Chủ tài sản qua đời, nên bạn cần chủ động gửi yêu cầu. Bấm
        một bước để xem chi tiết.
      </p>
      <ol className="mt-4" aria-label="Các bước nhận tài sản">
        {RECEIVE_STEP_TITLES.map((title, index) => (
          <GuideStep
            key={title}
            number={index + 1}
            title={title}
            text={texts[index]}
            role={RECEIVE_STEP_ROLES[index]}
            current={current}
          />
        ))}
      </ol>
      <p className="mt-1 text-sm leading-6 text-heritage-muted">
        Chưa được khai làm người nhận? Dùng mục Báo tin Chủ tài sản đã mất ở trang Nhận tài sản. Khi
        luật sư ghi bạn vào phương án chia, bạn đi tiếp từ bước 3.
      </p>
    </details>
  );
}

/**
 * Hướng dẫn sáu bước dạng đường thời gian mở sẵn toàn bộ (trang Hướng dẫn): số bước, tên, ai làm và lời giải thích.
 * Bước luật sư làm tô vàng, bước của bạn tô xanh đậm. Không hiện dữ liệu của hồ sơ cụ thể.
 */
export function ReceiveGuideTimeline() {
  const policy = usePolicyWindows();
  const texts = receiveStepTexts(policy.grantDays);
  return (
    <ol aria-label="Các bước nhận tài sản">
      {RECEIVE_STEP_TITLES.map((title, index) => {
        const role = RECEIVE_STEP_ROLES[index];
        const last = index === RECEIVE_STEP_TITLES.length - 1;
        let circle = "bg-heritage-primary text-white";
        if (role.kind === "lawyer") {
          circle = "border border-heritage-gold-soft bg-heritage-warning-bg text-heritage-warning";
        }
        return (
          <li
            key={title}
            style={{ "--pm-i": index } as CSSProperties}
            className="pm-rise flex gap-4"
          >
            <div aria-hidden="true" className="flex flex-col items-center">
              <span
                className={`pm-pop flex size-[34px] shrink-0 items-center justify-center rounded-full font-semibold ${circle}`}
              >
                {index + 1}
              </span>
              {!last && <span className="mt-1.5 w-0.5 flex-1 bg-heritage-border" />}
            </div>
            <div className={`min-w-0 flex-1 pt-1 ${last ? "" : "pb-5"}`}>
              <h3 className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-heritage-primary">
                {title}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE[role.kind]}`}
                >
                  {role.label}
                </span>
              </h3>
              <p className="mt-1 text-sm leading-6 text-heritage-muted">{texts[index]}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
