import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LivenessPanel } from "../LivenessPanel";
import { ekycService } from "../../api/ekycService";

vi.mock("../../api/ekycService", () => ({
  ekycService: {
    startLiveness: vi.fn(),
    sendLivenessFrame: vi.fn(),
    completeLiveness: vi.fn(),
  },
}));

const initial = {
  actions: [{ key: "blink" as const, label: "Chớp mắt" }],
  completed: [],
  currentIndex: 0,
  prompt: "Chớp mắt",
  calibrated: true,
  challengeCompleted: false,
  padPassed: false,
  passed: false,
  failedReason: "",
  frameHint: "",
  expiresInSeconds: 90,
};

const passing = {
  ...initial,
  passed: true,
  challengeCompleted: true,
  padPassed: true,
  expiresInSeconds: null,
};

const statusOk = {
  status: "PASSED" as const,
  verificationId: "11111111-1111-1111-1111-111111111111",
  citizenIdLast4: "8901",
  faceMatchScore: 0.42,
  matchThreshold: 0.363,
  spoofCheckPassed: true,
  createdAt: null,
  completedAt: null,
  purpose: "BENEFICIARY_CLAIM" as const,
  identityMatch: "MATCHED" as const,
  backSideChecked: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  const trackStop = vi.fn();
  const stream = { getTracks: () => [{ stop: trackStop }] } as unknown as MediaStream;
  trackStops.push(trackStop);
  vi.stubGlobal("isSecureContext", true);
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
  });
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  Object.defineProperty(HTMLMediaElement.prototype, "readyState", {
    configurable: true,
    get: () => 4,
  });
  Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", {
    configurable: true,
    get: () => 320,
  });
  Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", {
    configurable: true,
    get: () => 320,
  });
  HTMLCanvasElement.prototype.getContext = vi
    .fn()
    .mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
  HTMLCanvasElement.prototype.toBlob = vi.fn().mockImplementation((cb: BlobCallback) => {
    cb(new Blob(["synthetic"], { type: "image/jpeg" }));
  });
  vi.mocked(ekycService.startLiveness).mockResolvedValue(initial);
  vi.mocked(ekycService.sendLivenessFrame).mockResolvedValue(passing);
  vi.mocked(ekycService.completeLiveness).mockResolvedValue(statusOk);
});

const trackStops: Array<() => void> = [];

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  trackStops.length = 0;
});

async function startPanel() {
  render(<LivenessPanel onCompleted={vi.fn()} />);
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Bắt đầu thử thách camera" }));
  });
}

it("attaches the acquired stream to the rendered video", async () => {
  await startPanel();
  const video = screen.getByLabelText("Camera thử thách") as HTMLVideoElement;
  expect(video.srcObject).toBeDefined();
});

it("calls /liveness/complete after the server reports challenge passed", async () => {
  const onCompleted = vi.fn();
  render(<LivenessPanel onCompleted={onCompleted} />);
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Bắt đầu thử thách camera" }));
  });
  // Chờ interval 600ms + 1 frame + auto-complete
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 800));
  });
  expect(vi.mocked(ekycService.sendLivenessFrame)).toHaveBeenCalledTimes(1);
  expect(vi.mocked(ekycService.completeLiveness)).toHaveBeenCalledTimes(1);
  expect(onCompleted).toHaveBeenCalledWith(statusOk, expect.any(String));
});

it("stops camera and frame requests after a terminal frame", async () => {
  await startPanel();
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
  });
  expect(trackStops[0]).toHaveBeenCalled();
  const count = vi.mocked(ekycService.sendLivenessFrame).mock.calls.length;
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1300));
  });
  expect(vi.mocked(ekycService.sendLivenessFrame)).toHaveBeenCalledTimes(count);
});

it("serializes frames and aborts an outstanding frame on cancel", async () => {
  vi.useFakeTimers();
  let resolveFrame!: (value: typeof passing) => void;
  vi.mocked(ekycService.sendLivenessFrame).mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveFrame = resolve;
      }),
  );
  await startPanel();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1800);
  });
  expect(ekycService.sendLivenessFrame).toHaveBeenCalledTimes(1);
  const signal = vi.mocked(ekycService.sendLivenessFrame).mock.calls[0][1];
  fireEvent.click(screen.getByRole("button", { name: "Hủy thử thách" }));
  expect(signal?.aborted).toBe(true);
  await act(async () => {
    resolveFrame(passing);
  });
  expect(ekycService.completeLiveness).not.toHaveBeenCalled();
  expect(trackStops[0]).toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Bắt đầu thử thách camera" })).toBeInTheDocument();
});

it("expires a camera session even while a frame is outstanding", async () => {
  vi.useFakeTimers();
  vi.mocked(ekycService.startLiveness).mockResolvedValue({ ...initial, expiresInSeconds: 1 });
  vi.mocked(ekycService.sendLivenessFrame).mockImplementation(() => new Promise(() => {}));
  await startPanel();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1100);
  });
  expect(screen.getByRole("alert")).toHaveTextContent("hết hạn");
  expect(trackStops[0]).toHaveBeenCalled();
  expect(vi.mocked(ekycService.sendLivenessFrame).mock.calls[0][1]?.aborted).toBe(true);
  expect(ekycService.completeLiveness).not.toHaveBeenCalled();
});

it("stops camera when capture returns a null blob", async () => {
  vi.useFakeTimers();
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((cb) => cb(null));
  await startPanel();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(700);
  });
  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(trackStops[0]).toHaveBeenCalled();
  expect(ekycService.sendLivenessFrame).not.toHaveBeenCalled();
});

it("stops a camera permission result arriving after unmount", async () => {
  let grant!: (stream: MediaStream) => void;
  vi.mocked(navigator.mediaDevices.getUserMedia).mockImplementation(
    () =>
      new Promise((resolve) => {
        grant = resolve;
      }),
  );
  const view = render(<LivenessPanel onCompleted={vi.fn()} />);
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Bắt đầu thử thách camera" }));
  });
  view.unmount();
  const stop = vi.fn();
  await act(async () => {
    grant({ getTracks: () => [{ stop }] } as unknown as MediaStream);
  });
  expect(stop).toHaveBeenCalledTimes(1);
});

it("explains denied camera permission without submitting a frame", async () => {
  vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(
    new DOMException("denied", "NotAllowedError"),
  );
  await startPanel();
  expect(screen.getByRole("alert")).toHaveTextContent("chưa cho phép camera");
  expect(ekycService.sendLivenessFrame).not.toHaveBeenCalled();
});
