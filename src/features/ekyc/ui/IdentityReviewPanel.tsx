import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CircleCheck,
  CircleAlert,
  IdCard,
  UserRound,
  LoaderCircle,
  Circle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { EKYC_REVIEW_CONTENT as content } from "../model/review.content";
import { CAMERA_CHECK_CONTENT } from "../model/camera.content";

/** Thuộc tính panel so khớp/kết quả mẫu, không chứa quyền bàn giao. */
export interface IdentityReviewPanelProps {
  result: boolean;
  portal: string;
}

/** Panel so khớp và ma trận trạng thái kết quả UI; không suy diễn xác minh thành công. */
export function IdentityReviewPanel({ result, portal }: IdentityReviewPanelProps) {
  const [params] = useSearchParams();
  const [selfieName, setSelfieName] = useState("");
  const [fileError, setFileError] = useState("");
  const requested = params.get("outcome");
  const outcome =
    requested && Object.hasOwn(content.states, requested)
      ? (requested as keyof typeof content.states)
      : "success";
  const state = content.states[outcome];
  // TODO: [BẢN THIẾT KẾ THỰC THI - DEVELOPER BLUEPRINT]
  // 1. [MỤC TIÊU]: Trình bày kết quả eKYC xác thực từ backend theo phiên người nhận.
  // 2. [INPUT & OUTPUT]: DTO phiên/ảnh hợp lệ -> kết quả, lý do lỗi và bước tiếp theo.
  // 3. [CÁC BƯỚC]: Chốt contract; tạo service/Query hooks; gửi ảnh khi xác nhận; xử lý
  //    loading/error/empty/success; chỉ cho chuyển bước khi backend xác nhận điều kiện.
  // 4. [HÀM / THƯ VIỆN]: createBaseService, TanStack Query, Zod, MediaDevices.
  // 5. [ĐIỀU KIỆN BIÊN]: Timeout, thiếu ảnh, sai phiên, từ chối quyền; không dùng URL
  //    outcome để cấp quyền; không lưu hoặc ghi log sinh trắc học.
  if (result)
    return (
      <section className="rounded-2xl border border-heritage-border bg-heritage-surface p-6 sm:p-10">
        <nav aria-label={content.resultTitle} className="mb-8 flex flex-wrap gap-2">
          {Object.entries(content.states).map(([key, item]) => (
            <Link
              key={key}
              to={`?step=result&outcome=${key}`}
              aria-current={outcome === key ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-xl border px-4 text-sm ${outcome === key ? "border-heritage-primary bg-heritage-primary text-white" : "border-heritage-border"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div aria-live="polite" className="mx-auto flex max-w-xl flex-col items-center text-center">
          {outcome === "loading" ? (
            <LoaderCircle
              aria-hidden="true"
              className="size-14 text-heritage-gold motion-safe:animate-spin"
            />
          ) : outcome === "success" ? (
            <CircleCheck aria-hidden="true" className="size-14 text-emerald-700" />
          ) : (
            <CircleAlert aria-hidden="true" className="size-14 text-heritage-gold" />
          )}
          <h2 className="mt-6 text-2xl font-semibold">{state.title}</h2>
          <p className="mt-4 text-sm leading-7 text-heritage-muted">{state.detail}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              className="flex min-h-11 items-center rounded-xl bg-heritage-primary px-5 text-sm text-white"
              to={outcome === "permission" ? "?step=camera" : "?step=documents"}
            >
              {outcome === "permission" ? content.returnCamera : content.retry}
            </Link>
            <Link
              className="flex min-h-11 items-center rounded-xl border border-heritage-border px-5 text-sm"
              to={portal}
            >
              {content.portal}
            </Link>
          </div>
        </div>
      </section>
    );
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <section className="min-w-0 rounded-2xl border border-heritage-border bg-heritage-surface p-5 sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{content.comparison}</h2>
          <Link
            to="?step=documents"
            className="flex min-h-11 items-center text-sm text-heritage-primary underline underline-offset-4"
          >
            {content.changeDocument}
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-3 font-semibold">{content.reference}</h3>
            <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl border border-dashed border-heritage-border bg-heritage-canvas p-5 text-center">
              <IdCard aria-hidden="true" className="size-12 text-heritage-gold" />
              <p className="mt-4 text-sm text-heritage-muted">{content.referenceHint}</p>
            </div>
            <p className="mt-3 text-xs leading-6 text-heritage-muted">{content.referenceDetail}</p>
          </div>
          <div className="min-w-0">
            <h3 className="mb-3 font-semibold">{content.selfie}</h3>
            <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl border border-dashed border-heritage-border p-5 text-center">
              <UserRound aria-hidden="true" className="size-10 text-heritage-gold" />
              <p className="mt-3 text-sm font-medium">{content.chooseSelfie}</p>
              <p className="mt-1 text-xs text-heritage-muted">{content.selfieHint}</p>
              <label className="relative mt-4 flex min-h-11 cursor-pointer items-center rounded-xl bg-heritage-primary px-5 text-sm text-white focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-heritage-gold">
                {content.select}
                <input
                  type="file"
                  aria-label={content.chooseSelfie}
                  accept={CAMERA_CHECK_CONTENT.documents.accept}
                  className="absolute inset-0 w-full cursor-pointer opacity-0"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    event.currentTarget.value = "";
                    if (!file) return;
                    const valid =
                      CAMERA_CHECK_CONTENT.documents.accept.split(",").includes(file.type) &&
                      file.size <= CAMERA_CHECK_CONTENT.documents.maxBytes;
                    setSelfieName(valid ? file.name : "");
                    setFileError(valid ? "" : CAMERA_CHECK_CONTENT.documents.invalid);
                  }}
                />
              </label>
              <p className="mt-3 text-xs text-heritage-muted">
                {CAMERA_CHECK_CONTENT.documents.formats}
              </p>
            </div>
            {selfieName && (
              <p role="status" className="mt-3 break-all text-xs leading-6">
                {selfieName}
              </p>
            )}
            {fileError && (
              <p role="alert" className="mt-3 text-xs text-red-700">
                {fileError}
              </p>
            )}
            <Link
              to="?step=camera"
              className="mt-3 flex min-h-11 items-center justify-center rounded-xl border border-heritage-border px-3 text-center text-xs"
            >
              {content.cameraSelfie}
            </Link>
          </div>
        </div>
        <details className="mt-6 border-t border-heritage-border pt-4 text-sm">
          <summary className="min-h-11 cursor-pointer py-3 font-medium">
            {content.threshold}
          </summary>
          <p className="pb-4 text-xs leading-6 text-heritage-muted">{content.thresholdHint}</p>
        </details>
        <p className="mt-3 text-xs leading-6 text-heritage-muted">{content.uploadedHint}</p>
        <Button size="lg" disabled className="mt-4 min-h-12 w-full justify-between">
          {content.compare}
          <ArrowRight aria-hidden="true" />
        </Button>
        <p className="mt-4 text-xs leading-6 text-heritage-muted">{content.note}</p>
      </section>
      <div>
        <section className="rounded-2xl border border-heritage-border bg-heritage-surface p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">{content.matchResult}</h2>
            <span className="rounded-full bg-heritage-canvas px-3 py-1 text-xs text-heritage-muted">
              {content.notRun}
            </span>
          </div>
          <div
            className="mx-auto mt-8 flex size-36 items-center justify-center rounded-full border-[12px] border-heritage-border"
            role="img"
            aria-label={content.scoreLabel}
          >
            <span className="text-3xl font-semibold text-heritage-muted">{content.score}</span>
          </div>
          <h3 className="mt-5 text-center font-semibold">{content.resultWaiting}</h3>
          <p className="mt-2 text-center text-sm leading-6 text-heritage-muted">
            {content.resultHint}
          </p>
          <ul className="mt-6 divide-y divide-heritage-border">
            {content.checks.map((item) => (
              <li key={item} className="flex items-start gap-3 py-4 text-sm text-heritage-muted">
                <Circle aria-hidden="true" className="size-5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>
        <p className="mt-5 text-xs leading-6 text-heritage-muted">
          {CAMERA_CHECK_CONTENT.disclaimer}
        </p>
      </div>
    </div>
  );
}
