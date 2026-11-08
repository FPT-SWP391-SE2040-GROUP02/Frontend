import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { buttonStyles, Chip, Panel } from "@/shared/ui/heritageKit";
import type { DeathCase, ExecutorVault } from "../model/deathCase.schema";
import {
  HELP_ARTICLES,
  PROCESS_STEP_INFO,
  PROCESS_STEP_NAMES,
  type HelpId,
} from "../model/processGuide";
import { deriveProcessStep } from "../model/processStep";
import { ProxyCheckIn } from "./ProxyCheckIn";

type StepState = "done" | "current" | "pending";

const dotStyles: Record<StepState, string> = {
  done: "border-[#2E9E6E] bg-[#2E9E6E] text-white",
  current: "border-[#1A4B3B] bg-[#1A4B3B] text-white ring-4 ring-[#BFE6D3]",
  pending: "border-[#BDB8A6] bg-white text-heritage-muted",
};

const captions: Record<StepState, string> = {
  done: "Xong",
  current: "Đang ở đây",
  pending: "Chờ",
};

function stateOf(step: number, current: number | null): StepState {
  if (current === null) return "pending";
  if (step < current) return "done";
  if (step === current) return "current";
  return "pending";
}

/**
 * Thanh 8 bước của quy trình. Bấm một bước mở cửa sổ: ai làm, tóm tắt, các bài hướng dẫn ngắn
 * (mở ngay trong cửa sổ, có nút quay lại) và nút đi tới màn làm việc của bước đó.
 */
export function ProcessStepper({
  vault,
  record,
}: {
  vault: ExecutorVault;
  record: DeathCase | null | undefined;
}) {
  const current = deriveProcessStep(vault, record);
  const [openStep, setOpenStep] = useState<number | null>(null);
  const [helpId, setHelpId] = useState<HelpId | null>(null);
  const close = () => {
    setOpenStep(null);
    setHelpId(null);
  };
  const info = openStep ? PROCESS_STEP_INFO[openStep - 1] : null;
  const article = helpId ? HELP_ARTICLES[helpId] : null;
  const canProxy = vault.checkInOverdue && !vault.openDeathCaseId;
  let chipLabel = "Chưa tới";
  if (openStep !== null) {
    const state = stateOf(openStep, current);
    if (state === "current") chipLabel = "Đang ở bước này";
    if (state === "done") chipLabel = "Đã xong";
  }
  return (
    <>
      <Panel title="Đang ở bước nào">
        <ol className="grid grid-cols-4 gap-x-2 gap-y-6 sm:grid-cols-8">
          {PROCESS_STEP_NAMES.map((name, index) => {
            const step = index + 1;
            const state = stateOf(step, current);
            return (
              <li
                key={name}
                aria-current={state === "current" ? "step" : undefined}
                className="flex justify-center"
              >
                <button
                  type="button"
                  aria-label={`Bước ${step}: ${name}, xem chi tiết`}
                  onClick={() => setOpenStep(step)}
                  className="group flex w-full flex-col items-center gap-2 rounded-xl px-1 pb-1 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
                >
                  <span
                    aria-hidden="true"
                    className={`flex size-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-shadow group-hover:ring-4 group-hover:ring-heritage-gold-border ${dotStyles[state]}`}
                  >
                    {state === "done" ? <Check className="size-5" /> : step}
                  </span>
                  <span className="text-xs font-semibold leading-snug group-hover:underline">
                    {name}
                  </span>
                  <span className="text-xs text-heritage-muted">{captions[state]}</span>
                </button>
              </li>
            );
          })}
        </ol>
        {current !== null && (
          <button
            type="button"
            onClick={() => setOpenStep(current)}
            className="mt-5 flex w-full items-center justify-between gap-3 rounded-xl border border-heritage-gold-border bg-heritage-gold-light px-4 py-3 text-left hover:border-heritage-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
          >
            <span className="min-w-0">
              <span className="block text-xs uppercase tracking-wide text-heritage-muted">
                Việc cần làm · {PROCESS_STEP_INFO[current - 1].who}
              </span>
              <span className="block font-semibold">{PROCESS_STEP_INFO[current - 1].todo}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-heritage-primary">
              Xem hướng dẫn
              <ChevronRight className="size-4" aria-hidden="true" />
            </span>
          </button>
        )}
      </Panel>
      {openStep !== null && info && (
        <Dialog open onOpenChange={(open) => !open && close()}>
          <DialogContent className="sm:max-w-lg">
            {article === null && (
              <>
                <DialogHeader>
                  <DialogTitle>
                    Bước {openStep}: {PROCESS_STEP_NAMES[openStep - 1]}
                  </DialogTitle>
                  <DialogDescription>{info.summary}</DialogDescription>
                </DialogHeader>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Chip tone={openStep === current ? "warning" : "neutral"}>{chipLabel}</Chip>
                  <span className="text-heritage-muted">Người làm: {info.who}</span>
                </div>
                {info.help.length > 0 && (
                  <nav
                    aria-label="Hướng dẫn"
                    className="overflow-hidden rounded-xl border border-heritage-border"
                  >
                    {info.help.map((id) => (
                      <a
                        key={id}
                        href={`#huong-dan-${id}`}
                        onClick={(event) => {
                          event.preventDefault();
                          setHelpId(id);
                        }}
                        className="flex min-h-12 items-center justify-between gap-3 border-b border-heritage-border px-4 font-semibold last:border-b-0 hover:bg-heritage-gold-light focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-heritage-gold"
                      >
                        {HELP_ARTICLES[id].title}
                        <ChevronRight className="size-4 text-heritage-gold" aria-hidden="true" />
                      </a>
                    ))}
                  </nav>
                )}
                <DialogFooter>
                  <button type="button" className={buttonStyles.outline} onClick={close}>
                    Đóng
                  </button>
                  <Link
                    to={info.to.path}
                    className={openStep === current ? buttonStyles.gold : buttonStyles.outline}
                    onClick={close}
                  >
                    {info.to.label}
                  </Link>
                </DialogFooter>
              </>
            )}
            {article !== null && (
              <>
                <DialogHeader>
                  <DialogDescription>
                    Bước {openStep}: {PROCESS_STEP_NAMES[openStep - 1]}
                  </DialogDescription>
                  <DialogTitle>{article.title}</DialogTitle>
                </DialogHeader>
                <ol className="space-y-4">
                  {article.steps.map((item, index) => (
                    <li key={item.title} className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E0C486] text-sm font-semibold text-[#0A281E]"
                      >
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-sm text-heritage-muted">{item.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                {helpId === "proxy" && canProxy && (
                  <ProxyCheckIn vaultId={vault.vaultId} left={vault.proxyCheckInsLeft} />
                )}
                <DialogFooter>
                  <button
                    type="button"
                    className={buttonStyles.outline}
                    onClick={() => setHelpId(null)}
                  >
                    ‹ Quay lại
                  </button>
                  <button type="button" className={buttonStyles.outline} onClick={close}>
                    Đóng
                  </button>
                  {helpId === "report" && (
                    <Link
                      to={PROCESS_STEP_INFO[4].to.path}
                      className={buttonStyles.gold}
                      onClick={close}
                    >
                      Mở Báo tin
                    </Link>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
