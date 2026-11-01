import { useCallback, useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/shared/ui/button";

/** Chất lượng JPEG khi chụp; đủ nét để so khớp khuôn mặt mà vẫn nhỏ hơn giới hạn 8 MiB. */
const JPEG_QUALITY = 0.92;

/**
 * Chụp selfie trực tiếp từ webcam rồi trả về tệp JPEG. Chỉ mở camera khi người dùng bấm "Chụp ảnh"
 * và luôn tắt luồng khi chụp xong, hủy hoặc rời màn hình. Không lưu ảnh ở đâu ngoài bộ nhớ trang.
 */
export function SelfieCamera({
  onCapture,
  disabled,
}: {
  onCapture: (file: File) => void;
  disabled?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const stop = useCallback(() => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setOpen(false);
  }, []);

  useEffect(() => stop, [stop]);

  const start = async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Trình duyệt không hỗ trợ chụp ảnh. Hãy chọn tệp ảnh thay thế.");
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      stream.current = media;
      setOpen(true);
    } catch {
      setError("Không mở được camera. Hãy cho phép truy cập camera hoặc chọn tệp ảnh thay thế.");
    }
  };

  useEffect(() => {
    if (open && video.current && stream.current) {
      video.current.srcObject = stream.current;
    }
  }, [open]);

  const capture = () => {
    const element = video.current;
    if (!element || !element.videoWidth) {
      setError("Camera chưa sẵn sàng, vui lòng thử lại sau giây lát.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = element.videoWidth;
    canvas.height = element.videoHeight;
    canvas.getContext("2d")?.drawImage(element, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Không chụp được ảnh. Vui lòng thử lại.");
          return;
        }
        onCapture(new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" }));
        stop();
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  };

  return (
    <div className="space-y-2">
      {open && (
        <div className="space-y-2">
          <video
            ref={video}
            autoPlay
            playsInline
            muted
            aria-label="Xem trước camera"
            className="w-full max-w-sm -scale-x-100 rounded-lg bg-black"
          />
          <div className="flex gap-2">
            <Button type="button" onClick={capture}>
              <Camera className="size-4" aria-hidden="true" />
              Chụp
            </Button>
            <Button type="button" variant="outline" onClick={stop}>
              Hủy
            </Button>
          </div>
        </div>
      )}
      {!open && (
        <Button type="button" variant="outline" onClick={() => void start()} disabled={disabled}>
          <Camera className="size-4" aria-hidden="true" />
          Chụp ảnh
        </Button>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
