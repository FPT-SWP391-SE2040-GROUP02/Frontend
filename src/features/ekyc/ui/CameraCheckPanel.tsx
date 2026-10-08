import { useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { CAMERA_CHECK_CONTENT as content } from "../model/camera.content";

/** Hai panel camera và thử thách của bản UI; chưa khởi tạo phiên sinh trắc học. */
export function CameraCheckPanel() {
  const [showNotice, setShowNotice] = useState(false);
  // TODO: [BẢN THIẾT KẾ THỰC THI - DEVELOPER BLUEPRINT]
  // 1. [MỤC TIÊU]: Hiển thị camera và thử thách theo phiên eKYC do backend cấp.
  // 2. [INPUT & OUTPUT]: Phiên/challenge được xác thực -> trạng thái và selfie khi đạt điều kiện.
  // 3. [CÁC BƯỚC]: Chốt DTO/API; tạo service và Query hooks; xin quyền getUserMedia khi bấm mở;
  //    gắn stream vào video; theo dõi thử thách từ backend; dừng tracks khi tắt/unmount.
  // 4. [HÀM / THƯ VIỆN]: MediaDevices, HTMLVideoElement, createBaseService, TanStack Query.
  // 5. [ĐIỀU KIỆN BIÊN]: Từ chối quyền, thiếu camera, HTTPS, timeout, mất mạng; không suy diễn
  //    thành công ở client; giữ ảnh trong RAM và dọn khi đổi phiên; không log ảnh/định danh.
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
      <section
        aria-labelledby="camera-title"
        className="rounded-2xl border border-heritage-border bg-heritage-surface p-5 sm:p-6"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 id="camera-title" className="text-xl font-semibold">
            {content.camera}
          </h2>
          <span className="rounded-full bg-heritage-canvas px-3 py-1 text-xs">{content.off}</span>
        </div>
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-heritage-primary text-heritage-surface">
          <span className="absolute left-5 top-5 text-xs font-medium">{content.cameraOff}</span>
          <div
            aria-hidden="true"
            className="absolute inset-x-[28%] inset-y-[15%] rounded-[50%] border-2 border-dashed border-heritage-gold/80"
          />
          <span
            aria-hidden="true"
            className="absolute left-4 top-4 size-7 rounded-tl-lg border-l-2 border-t-2 border-heritage-surface/30"
          />
          <span
            aria-hidden="true"
            className="absolute right-4 top-4 size-7 rounded-tr-lg border-r-2 border-t-2 border-heritage-surface/30"
          />
          <span
            aria-hidden="true"
            className="absolute bottom-4 left-4 size-7 rounded-bl-lg border-b-2 border-l-2 border-heritage-surface/30"
          />
          <span
            aria-hidden="true"
            className="absolute bottom-4 right-4 size-7 rounded-br-lg border-b-2 border-r-2 border-heritage-surface/30"
          />
          <div className="relative flex flex-col items-center gap-3">
            <Camera className="size-9 text-heritage-surface/50" aria-hidden="true" />
            <p className="text-sm text-heritage-surface/75">{content.startHint}</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-heritage-muted">{content.guide}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button size="lg" onClick={() => setShowNotice(true)}>
            {content.open}
          </Button>
          <Button size="lg" variant="outline" disabled>
            {content.close}
          </Button>
          <Button size="lg" variant="outline" disabled>
            {content.begin}
          </Button>
        </div>
        {showNotice && (
          <p
            role="status"
            className="mt-4 rounded-xl border border-heritage-gold-border bg-heritage-gold-light p-4 text-sm leading-6"
          >
            {content.scaffoldNotice}
          </p>
        )}
        <details className="mt-6 border-t border-heritage-border pt-2">
          <summary className="flex min-h-12 cursor-pointer flex-wrap items-center gap-2 rounded-lg text-sm font-semibold focus-visible:outline-2 focus-visible:outline-heritage-gold">
            {content.advanced}
            <span className="rounded-full bg-heritage-canvas px-2 py-1 text-xs font-normal">
              {content.advancedTag}
            </span>
          </summary>
          <p className="mt-2 text-sm leading-6 text-heritage-muted">{content.advancedNote}</p>
          <label htmlFor="anti-spoof-image" className="mt-4 block text-sm">
            {content.upload}
          </label>
          <input id="anti-spoof-image" type="file" disabled className="mt-2 max-w-full text-sm" />
        </details>
      </section>
      <section
        aria-labelledby="challenge-title"
        className="rounded-2xl border border-heritage-border bg-heritage-surface p-5 sm:p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="challenge-title" className="text-xl font-semibold">
            {content.challengesTitle}
          </h2>
          <span className="shrink-0 rounded-full bg-heritage-canvas px-3 py-1 text-xs">
            {content.notStarted}
          </span>
        </div>
        <p className="mt-5 text-sm leading-6 text-heritage-muted">{content.instructions}</p>
        <ol className="mt-5 space-y-3">
          {content.challenges.map((label, index) => (
            <li
              key={label}
              className="flex items-center gap-3 rounded-xl bg-heritage-gold-light p-3 text-sm"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-heritage-border bg-heritage-surface">
                {index + 1}
              </span>
              {label}
            </li>
          ))}
        </ol>
        <dl className="mt-6 divide-y divide-heritage-border">
          {content.metrics.map(({ label, value }) => (
            <div key={label} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
              <dt className="text-heritage-muted">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-sm leading-6 text-heritage-muted">{content.finishHint}</p>
        <Button className="mt-5 w-full whitespace-normal" size="lg" disabled>
          {content.useSelfie}
        </Button>
      </section>
    </div>
  );
}
