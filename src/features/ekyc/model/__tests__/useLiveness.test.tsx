import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ekycService } from "../../api/ekycService";
import { useLiveness } from "../useLiveness";

vi.mock("../../api/ekycService", () => ({
  ekycService: {
    startLiveness: vi.fn(),
    sendLivenessFrame: vi.fn(),
    completeLiveness: vi.fn(),
  },
}));

interface Harness {
  start: () => Promise<void>;
  complete: () => Promise<unknown>;
  cancel: () => void;
  state: ReturnType<typeof useLiveness>["state"];
}

function createHarness() {
  const ref: { current: Harness | null } = { current: null };
  const completedRef: { current: unknown } = { current: null };
  function Probe() {
    const { state, start, complete, cancel, videoRef, canvasRef } = useLiveness();
    ref.current = { start, complete, cancel, state };
    return (
      <div>
        <video ref={videoRef} aria-label="probe" />
        <canvas ref={canvasRef} aria-label="probe" />
      </div>
    );
  }
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function mount() {
    cleanup();
    return render(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    );
  }
  return { ref, mount, client, completedRef };
}

function stubMediaDevices(stream: MediaStream) {
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: vi.fn().mockResolvedValue(stream),
    },
  });
  vi.stubGlobal("isSecureContext", true);
  Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", {
    configurable: true,
    get: () => 320,
  });
  Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", {
    configurable: true,
    get: () => 320,
  });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((cb) =>
    cb(new Blob(["frame"], { type: "image/jpeg" })),
  );
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  Object.defineProperty(HTMLMediaElement.prototype, "readyState", {
    configurable: true,
    get: () => 4,
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useLiveness", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Mặc định navigator.mediaDevices không tồn tại trong jsdom: hook sẽ fail khi gọi start.
  });

  it("starts in idle without auto-calling startLiveness", () => {
    const { ref, mount } = createHarness();
    mount();
    expect(ekycService.startLiveness).not.toHaveBeenCalled();
    expect(ref.current?.state.kind).toBe("idle");
  });

  it("transitions to error when start fails (no camera available)", async () => {
    vi.mocked(ekycService.startLiveness).mockRejectedValue(new Error("BE down"));
    const { ref, mount } = createHarness();
    mount();
    await act(async () => {
      await ref.current!.start();
    });
    expect(ref.current!.state.kind).toBe("error");
    if (ref.current!.state.kind === "error") {
      expect(ref.current!.state.message).not.toContain("BE down");
      expect(ref.current!.state.message).toContain("thử lại");
    }
  });

  it("attaches the acquired stream to the rendered video", async () => {
    const trackStop = vi.fn();
    const stream = {
      getTracks: () => [{ stop: trackStop }],
    } as unknown as MediaStream;
    stubMediaDevices(stream);
    vi.mocked(ekycService.startLiveness).mockResolvedValue({
      actions: [{ key: "blink", label: "Chớp mắt" }],
      completed: [],
      currentIndex: 0,
      prompt: "Làm theo hướng dẫn",
      calibrated: true,
      challengeCompleted: false,
      padPassed: false,
      passed: false,
      failedReason: "",
      frameHint: "",
      expiresInSeconds: 90,
    });
    const { ref, mount } = createHarness();
    const { container } = mount();
    await act(async () => {
      await ref.current!.start();
    });
    expect(ref.current!.state.kind).toBe("running");
    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video.srcObject).toBe(stream);
  });

  it("stops the camera track on unmount when a stream is active", async () => {
    const trackStop = vi.fn();
    const stream = { getTracks: () => [{ stop: trackStop }] } as unknown as MediaStream;
    stubMediaDevices(stream);
    vi.mocked(ekycService.startLiveness).mockResolvedValue({
      actions: [{ key: "blink", label: "Chớp mắt" }],
      completed: [],
      currentIndex: 0,
      prompt: "Làm theo hướng dẫn",
      calibrated: true,
      challengeCompleted: false,
      padPassed: false,
      passed: false,
      failedReason: "",
      frameHint: "",
      expiresInSeconds: 90,
    });
    const { ref, mount } = createHarness();
    mount();
    await act(async () => {
      await ref.current!.start();
    });
    expect(ref.current!.state.kind).toBe("running");
    cleanup();
    expect(trackStop).toHaveBeenCalled();
  });

  it("allows completion once only after the challenge passes", async () => {
    const trackStop = vi.fn();
    const stream = { getTracks: () => [{ stop: trackStop }] } as unknown as MediaStream;
    stubMediaDevices(stream);
    const running = {
      actions: [{ key: "blink" as const, label: "Chớp mắt" }],
      completed: [] as string[],
      currentIndex: 0,
      prompt: "Chớp mắt",
      calibrated: true,
      challengeCompleted: false,
      padPassed: false,
      passed: false,
      failedReason: "",
      frameHint: "",
      expiresInSeconds: 90 as number | null,
    };
    const passing = {
      ...running,
      passed: true,
      challengeCompleted: true,
      padPassed: true,
    };
    vi.mocked(ekycService.startLiveness).mockResolvedValue(running);
    vi.mocked(ekycService.sendLivenessFrame).mockResolvedValue(passing);
    vi.mocked(ekycService.completeLiveness).mockResolvedValue({
      status: "PASSED",
      verificationId: "11111111-1111-1111-1111-111111111111",
      citizenIdLast4: "8901",
      faceMatchScore: 0.42,
      matchThreshold: 0.363,
      spoofCheckPassed: true,
      createdAt: null,
      completedAt: null,
      purpose: "BENEFICIARY_CLAIM",
      identityMatch: "MATCHED",
      backSideChecked: true,
    });
    // Stub captureFrame indirectly: video.readyState mocked ở stubMediaDevices; canvas cần toBlob.
    const drawImage = vi.fn();
    HTMLCanvasElement.prototype.getContext = vi
      .fn()
      .mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
    HTMLCanvasElement.prototype.toBlob = vi.fn().mockImplementation((cb: BlobCallback) => {
      cb(new Blob(["synthetic"], { type: "image/jpeg" }));
    });
    Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", {
      configurable: true,
      get: () => 320,
    });
    Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", {
      configurable: true,
      get: () => 320,
    });
    const { ref, mount } = createHarness();
    mount();
    await act(async () => {
      await ref.current!.start();
    });
    // Wait interval + frame send + complete
    await act(async () => {
      await new Promise((r) => setTimeout(r, 1200));
    });
    expect(vi.mocked(ekycService.sendLivenessFrame)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(ekycService.completeLiveness)).not.toHaveBeenCalled();
    await act(async () => {
      await Promise.all([ref.current!.complete(), ref.current!.complete()]);
    });
    expect(vi.mocked(ekycService.completeLiveness)).toHaveBeenCalledTimes(1);
    expect(trackStop).toHaveBeenCalled();
    if (ref.current!.state.kind === "result") {
      expect(ref.current!.state.passed).toBe(true);
    } else {
      throw new Error(`Expected result state, got ${ref.current!.state.kind}`);
    }
  });

  it("does not call completeLiveness when session is not running", async () => {
    const { ref, mount } = createHarness();
    mount();
    await act(async () => {
      await ref.current!.complete();
    });
    expect(ekycService.completeLiveness).not.toHaveBeenCalled();
  });

  it("ignores stale frame results after cancel", async () => {
    let resolveFrame: (
      value: Awaited<ReturnType<typeof ekycService.sendLivenessFrame>>,
    ) => void = () => undefined;
    vi.mocked(ekycService.startLiveness).mockResolvedValue({
      actions: [{ key: "blink", label: "Chớp mắt" }],
      completed: [],
      currentIndex: 0,
      prompt: "Làm theo hướng dẫn",
      calibrated: true,
      challengeCompleted: false,
      padPassed: false,
      passed: false,
      failedReason: "",
      frameHint: "",
      expiresInSeconds: 90,
    });
    vi.mocked(ekycService.sendLivenessFrame).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFrame = resolve;
        }),
    );
    const stream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;
    stubMediaDevices(stream);
    const { ref, mount } = createHarness();
    mount();
    await act(async () => {
      await ref.current!.start();
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 700));
    });
    expect(ekycService.sendLivenessFrame).toHaveBeenCalledTimes(1);
    // Cancel an actual pending frame; its response must not be published.
    await act(async () => {
      ref.current!.cancel();
    });
    await act(async () => {
      resolveFrame({
        actions: [],
        completed: [],
        currentIndex: 0,
        prompt: "",
        calibrated: true,
        challengeCompleted: true,
        padPassed: true,
        passed: true,
        failedReason: "",
        frameHint: "",
        expiresInSeconds: null,
      });
    });
    expect(ref.current!.state.kind).toBe("idle");
  });
});
