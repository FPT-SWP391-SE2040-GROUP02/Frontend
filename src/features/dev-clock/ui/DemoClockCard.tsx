import { useState, type FormEvent, type ReactNode } from "react";
import { CalendarClock, RotateCcw } from "lucide-react";
import { formatDate, formatDateTime } from "@/shared/lib/dateFormat";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { buttonStyles, Chip, Notice, Panel } from "@/shared/ui/heritageKit";
import { demoClockErrorMessage } from "../lib/demoClockError";
import { stepDetail, stepKindLabel } from "../lib/stepLabels";
import type { DemoClockStep } from "@/shared/clock/demoClock.schema";
import { useDemoClockStatus, useServerNow } from "@/shared/clock/useServerNow";
import { useResetDemoClock, useTravelDemoClock } from "../model/useDemoClockActions";

/** Số ngày tối đa Backend cho tua trong một lần là 400; chừa 1 ngày vì giờ đích là 9:00 sáng. */
const MAX_PICK_DAYS = 399;

/** Giá trị cho ô chọn ngày (yyyy-MM-dd) theo ngày của trình duyệt. */
function toDateInputValue(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

function StepTimeline({ steps }: { steps: DemoClockStep[] }) {
  const rows: ReactNode[] = [];
  for (let index = 0; index < steps.length; index = index + 1) {
    const step = steps[index];
    rows.push(
      <li
        key={`${step.at}-${index}`}
        className="flex gap-3 border-b border-heritage-border py-3 last:border-b-0"
      >
        <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-[#E0C486]" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-semibold">{stepKindLabel(step.kind)}</p>
          <p className="text-xs text-heritage-muted">
            {formatDateTime(step.at)} · {stepDetail(step)}
          </p>
        </div>
      </li>,
    );
  }
  return <ol aria-label="Các bước đã chạy">{rows}</ol>;
}

/**
 * Thẻ "Tua thời gian" của Admin để demo: chọn một ngày, hệ thống coi hôm nay là ngày đó và chạy việc nền ở từng mốc
 * để các email nhắc được gửi như thật. Chỉ Admin tua được; Backend chỉ mở ở Development/Staging.
 */
export function DemoClockCard() {
  const status = useDemoClockStatus();
  const travel = useTravelDemoClock();
  const reset = useResetDemoClock();
  const serverNow = useServerNow();
  const [date, setDate] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const minDate = toDateInputValue(addDays(serverNow, 1));
  const maxDate = toDateInputValue(addDays(serverNow, MAX_PICK_DAYS));
  const running = travel.isPending;

  function submit(event: FormEvent): void {
    event.preventDefault();
    travel.reset();
    if (date === "") {
      setFieldError("Hãy chọn ngày cần tua tới.");
      return;
    }
    if (date < minDate) {
      setFieldError("Chỉ chọn được ngày sau hôm nay theo hệ thống.");
      return;
    }
    if (date > maxDate) {
      setFieldError("Mỗi lần chỉ tua tối đa 400 ngày.");
      return;
    }
    setFieldError("");
    travel.mutate(date);
  }

  function runReset(): void {
    reset.mutate(undefined, {
      onSuccess: () => {
        setConfirmReset(false);
        travel.reset();
        setDate("");
      },
    });
  }

  let body: ReactNode;
  if (status.isPending) {
    body = (
      <p role="status" className="text-sm text-heritage-muted">
        Đang tải đồng hồ hệ thống…
      </p>
    );
  } else if (status.isError) {
    body = (
      <div role="alert" className="space-y-3">
        <p className="text-sm">Không tải được đồng hồ hệ thống.</p>
        <button
          type="button"
          className={buttonStyles.outline}
          onClick={() => void status.refetch()}
        >
          Thử lại
        </button>
      </div>
    );
  } else if (status.data === null) {
    body = (
      <Notice tone="neutral" role="status">
        Máy chủ này không bật chế độ tua thời gian (chỉ có ở môi trường thử nghiệm).
      </Notice>
    );
  } else {
    const clock = status.data;
    let shownError = fieldError;
    if (shownError === "" && travel.isError) {
      shownError = demoClockErrorMessage(travel.error);
    }
    let describedBy: string | undefined = undefined;
    if (shownError !== "") {
      describedBy = "demo-clock-date-error";
    }
    let runLabel = "Tua tới ngày này";
    if (running) {
      runLabel = "Đang chạy…";
    }
    body = (
      <div className="space-y-5">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-heritage-canvas p-4">
            <dt className="text-xs text-heritage-muted">Hôm nay theo hệ thống</dt>
            <dd className="mt-1 text-lg font-semibold">{formatDateTime(clock.nowUtc)}</dd>
          </div>
          <div className="rounded-xl bg-heritage-canvas p-4">
            <dt className="text-xs text-heritage-muted">Ngày thật</dt>
            <dd className="mt-1 text-lg font-semibold">{formatDate(clock.realNowUtc)}</dd>
          </div>
        </dl>

        <form className="space-y-3" onSubmit={submit} noValidate>
          <label htmlFor="demo-clock-date" className="block text-sm font-semibold">
            Tua tới ngày
          </label>
          <div className="flex flex-wrap items-start gap-3">
            <input
              id="demo-clock-date"
              type="date"
              value={date}
              min={minDate}
              max={maxDate}
              disabled={running}
              aria-invalid={shownError !== ""}
              aria-describedby={describedBy}
              onChange={(event) => {
                setDate(event.target.value);
                setFieldError("");
              }}
              className="min-h-11 rounded-xl border border-heritage-border bg-white px-4 text-sm"
            />
            <button type="submit" className={buttonStyles.gold} disabled={running}>
              <CalendarClock className="size-4" aria-hidden="true" />
              {runLabel}
            </button>
            <button
              type="button"
              className={buttonStyles.outline}
              disabled={running || !clock.isSimulated}
              onClick={() => setConfirmReset(true)}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Về ngày thật
            </button>
          </div>
          {shownError !== "" && (
            <p id="demo-clock-date-error" role="alert" className="text-sm text-destructive">
              {shownError}
            </p>
          )}
          <p className="text-xs text-heritage-muted">
            Chỉ tua tới, không tua lùi. Hệ thống đặt giờ là 9:00 sáng của ngày chọn và chạy các việc
            nền ở từng mốc để gửi đủ email nhắc. Muốn làm lại từ đầu thì đặt lại dữ liệu trong cơ sở
            dữ liệu.
          </p>
        </form>

        {travel.isSuccess && (
          <div className="space-y-2" role="status">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">Đã tua xong</h3>
              <Chip tone="success">{travel.data.steps.length} bước</Chip>
            </div>
            <StepTimeline steps={travel.data.steps} />
          </div>
        )}
      </div>
    );
  }

  let resetLabel = "Về ngày thật";
  if (reset.isPending) {
    resetLabel = "Đang xử lý…";
  }
  return (
    <>
      <Panel title="Tua thời gian" labelledBy="demo-clock-title">
        {body}
      </Panel>
      {confirmReset && (
        <Dialog open onOpenChange={(open) => !open && !reset.isPending && setConfirmReset(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Về ngày thật?</DialogTitle>
              <DialogDescription>
                Hệ thống dùng lại ngày thật. Email đã gửi và trạng thái đã đổi trong lúc tua vẫn giữ
                nguyên.
              </DialogDescription>
            </DialogHeader>
            {reset.isError && (
              <p role="alert" className="text-sm text-destructive">
                {demoClockErrorMessage(reset.error)}
              </p>
            )}
            <DialogFooter>
              <button
                type="button"
                className={buttonStyles.outline}
                disabled={reset.isPending}
                onClick={() => setConfirmReset(false)}
              >
                Giữ nguyên
              </button>
              <button
                type="button"
                className={buttonStyles.gold}
                disabled={reset.isPending}
                onClick={runReset}
              >
                {resetLabel}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
