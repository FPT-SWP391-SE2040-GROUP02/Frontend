import { useCallback, useEffect, useRef, useState } from "react";

import type { z } from "zod";

import { ekycService } from "../api/ekycService";

import { privateActionError } from "@/shared/api/usePrivateAction";

import type { ekycLivenessResponseSchema, ekycStatusSchema } from "./ekyc.schema";

type Progress = z.infer<typeof ekycLivenessResponseSchema>;

type Status = z.infer<typeof ekycStatusSchema>;

export type LivenessState =
  | { kind: "idle" | "starting" | "completing" }
  | { kind: "running" | "completed"; response: Progress }
  | { kind: "result"; status: Status; passed: boolean }
  | { kind: "error"; message: string };

/** A cancellable pause between sequential camera requests. */

function pause(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const finish = () => {
      window.clearTimeout(timer);

      signal.removeEventListener("abort", finish);

      resolve();
    };

    const timer = window.setTimeout(finish, ms);

    signal.addEventListener("abort", finish, { once: true });

    if (signal.aborted) finish();
  });
}

/** Owns one camera session; stop tracks and reject stale work on every exit. */

export function useLiveness() {
  const [state, setState] = useState<LivenessState>({ kind: "idle" });

  const stateRef = useRef<LivenessState>(state);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const streamRef = useRef<MediaStream | null>(null);

  const controller = useRef<AbortController | null>(null);

  const expiry = useRef<number | null>(null);

  const epoch = useRef(0);

  const mounted = useRef(true);

  /** Bằng chứng selfie (blob URL) khi thử thách đạt; null khi chưa chụp hoặc đã bàn giao/thu hồi. */

  const selfieUrlRef = useRef<string | null>(null);

  const publish = useCallback((next: LivenessState) => {
    stateRef.current = next;

    setState(next);
  }, []);

  /** Thu hồi blob URL selfie (an toàn cả khi trình duyệt/jsdom không có revokeObjectURL). */

  const releaseSelfie = useCallback(() => {
    const url = selfieUrlRef.current;

    selfieUrlRef.current = null;

    if (url) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        /* jsdom: chỉ dọn tham chiếu, không có object URL thật để revoke. */
      }
    }
  }, []);

  /**

   * Chuyển quyền sở hữu blob URL selfie sang component nhận onCompleted (parent tự revoke khi

   * "Bắt đầu lại" hay unmount). Sau khi bàn giao, hook không còn giữ URL nên không double-revoke.

   */

  const handoffSelfie = useCallback((): string | null => {
    const url = selfieUrlRef.current;

    selfieUrlRef.current = null;

    return url;
  }, []);

  const stop = useCallback(() => {
    controller.current?.abort();

    controller.current = null;

    if (expiry.current !== null) window.clearTimeout(expiry.current);

    expiry.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());

    streamRef.current = null;

    if (videoRef.current) videoRef.current.srcObject = null;

    // Release the last captured pixels as well as the stream.

    if (canvasRef.current) {
      canvasRef.current.width = 0;

      canvasRef.current.height = 0;
    }
  }, []);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;

      epoch.current += 1;

      stop();

      releaseSelfie();
    };
  }, [stop, releaseSelfie]);

  const start = useCallback(async () => {
    if (
      !mounted.current ||
      ["starting", "running", "completed", "completing"].includes(stateRef.current.kind)
    )
      return;

    const run = ++epoch.current;

    stop();

    const request = new AbortController();

    controller.current = request;

    const current = () => mounted.current && epoch.current === run && !request.signal.aborted;

    const fail = (message: string) => {
      if (!current()) return;

      stop();

      publish({ kind: "error", message });
    };

    publish({ kind: "starting" });

    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("Cần HTTPS hoặc localhost và thiết bị có camera để xác minh.");
      }

      const progress = await ekycService.startLiveness(request.signal);

      if (!current()) return;

      expiry.current = window.setTimeout(
        () => fail("Thử thách đã hết hạn. Bấm thử lại để bắt đầu phiên mới."),

        (progress.expiresInSeconds ?? 90) * 1000,
      );

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 320 }, facingMode: "user" },

        audio: false,
      });

      if (!current()) {
        stream.getTracks().forEach((track) => track.stop());

        return;
      }

      streamRef.current = stream;

      const video = videoRef.current;

      if (!video) throw new Error("Video chưa sẵn sàng. Vui lòng thử lại.");

      video.srcObject = stream;

      await video.play();

      const readyDeadline = Date.now() + 5000;

      while (current() && (video.readyState < 2 || !video.videoWidth)) {
        if (Date.now() >= readyDeadline)
          throw new Error("Không nhận được hình ảnh camera. Vui lòng thử lại.");

        await pause(100, request.signal);
      }

      if (!current()) return;

      publish({ kind: "running", response: progress });

      // Never overlap frames: wait for the previous response before capturing again.

      const capture = async () => {
        while (current()) {
          await pause(600, request.signal);

          if (!current()) return;

          const canvas = canvasRef.current;

          if (!canvas) throw new Error("Không chụp được khung hình.");

          canvas.width = video.videoWidth;

          canvas.height = video.videoHeight;

          const context = canvas.getContext("2d");

          if (!context) throw new Error("Không chụp được khung hình.");

          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/jpeg", 0.7),
          );

          if (!current()) return;

          if (!blob?.size) throw new Error("Không chụp được khung hình. Vui lòng thử lại.");

          const next = await ekycService.sendLivenessFrame(
            new File([blob], "frame.jpg", { type: "image/jpeg" }),

            request.signal,
          );

          if (!current()) return;

          if (next.failedReason) throw new Error(next.failedReason);

          if (next.passed) {
            if (selfieUrlRef.current) {
              try {
                URL.revokeObjectURL(selfieUrlRef.current);
              } catch {
                /* jsdom */
              }
            }

            try {
              selfieUrlRef.current = URL.createObjectURL(blob);
            } catch {
              selfieUrlRef.current = null;
            }

            stop();

            publish({ kind: "completed", response: next });

            return;
          }

          publish({ kind: "running", response: next });
        }
      };

      void capture().catch((error: unknown) => fail(privateActionError(error)));
    } catch (failure) {
      fail(
        failure instanceof DOMException && failure.name === "NotAllowedError"
          ? "Bạn chưa cho phép camera. Cấp quyền trong trình duyệt rồi thử lại."
          : "Không thực hiện được thử thách camera. Kiểm tra camera/kết nối rồi thử lại.",
      );
    }
  }, [publish, stop]);

  const complete = useCallback(async (): Promise<Status | null> => {
    if (
      !mounted.current ||
      stateRef.current.kind !== "completed" ||
      !stateRef.current.response.passed
    )
      return null;

    const run = ++epoch.current;

    stop();

    const request = new AbortController();

    controller.current = request;

    publish({ kind: "completing" });

    try {
      const status = await ekycService.completeLiveness(request.signal);

      if (!mounted.current || epoch.current !== run || request.signal.aborted) return null;

      stop();

      publish({ kind: "result", status, passed: status.status === "PASSED" });

      return status;
    } catch (failure) {
      if (mounted.current && epoch.current === run && !request.signal.aborted) {
        stop();

        publish({ kind: "error", message: privateActionError(failure) });
      }

      return null;
    }
  }, [publish, stop]);

  const cancel = useCallback(() => {
    epoch.current += 1;

    stop();

    releaseSelfie();

    if (mounted.current) publish({ kind: "idle" });
  }, [publish, stop, releaseSelfie]);

  return {
    state,
    start,
    complete,
    cancel,
    videoRef,
    canvasRef,
    releaseSelfie,
    handoffSelfie,
  };
}
