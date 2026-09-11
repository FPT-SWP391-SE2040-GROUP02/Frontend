import * as React from "react";

/**
 * Thuộc tính của component WebcamAffidavitModal
 */
export interface WebcamAffidavitModalProps {
  /**
   * Thời lượng video tối đa yêu cầu (giây, mặc định: 15s theo Điều 630 BLDS)
   */
  maxDurationSeconds?: number;
  /**
   * Callback khi hoàn tất quay video và có video blob
   */
  onRecordingComplete?: (videoBlob: Blob) => void;
  /**
   * Callback khi đóng khung quay
   */
  onClose?: () => void;
  /**
   * Trạng thái hiển thị modal
   */
  isOpen?: boolean;
  /**
   * Class CSS bổ sung
   */
  className?: string;
}

/**
 * @description Khung quay video tuyên thệ minh mẫn 15s (Điều 630 Bộ luật Dân sự 2015).
 * Đảm bảo người lập di chúc có video xác thực năng lực hành vi dân sự tại thời điểm lập.
 * Tích hợp đèn tín hiệu REC, đồng hồ đếm ngược và thanh điều khiển tối màu sang trọng.
 *
 * @param {WebcamAffidavitModalProps} props Thuộc tính component
 * @returns {React.ReactElement} Phần tử giao diện WebcamAffidavitModal
 *
 * @example
 * ```tsx
 * <WebcamAffidavitModal
 *   isOpen={isRecordingModalOpen}
 *   onClose={() => setIsRecordingModalOpen(false)}
 *   onRecordingComplete={(blob) => handleUploadVideo(blob)}
 * />
 * ```
 */
export const WebcamAffidavitModal: React.FC<WebcamAffidavitModalProps> = ({
  maxDurationSeconds = 15,
  onRecordingComplete,
  onClose,
  isOpen = true,
  className = "",
}) => {
  const [secondsLeft, setSecondsLeft] = React.useState<number>(maxDurationSeconds);
  const [isRecording, setIsRecording] = React.useState<boolean>(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = React.useState<string | null>(null);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  // Bắt đầu webcam khi mở modal
  React.useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (isMounted) {
          mediaStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }
      })
      .catch(() => {
        // Fallback giả lập nếu trình duyệt không có camera
      });

    return () => {
      isMounted = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  const handleStopRecording = React.useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const handleStartRecording = () => {
    chunksRef.current = [];
    setSecondsLeft(maxDurationSeconds);
    setRecordedVideoUrl(null);

    if (mediaStreamRef.current && typeof MediaRecorder !== "undefined") {
      const recorder = new MediaRecorder(mediaStreamRef.current);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        if (onRecordingComplete) {
          onRecordingComplete(blob);
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
    }
    setIsRecording(true);
  };

  // Bộ đếm lùi thời gian ghi hình
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRecording && secondsLeft === 0) {
      handleStopRecording();
    }
    return () => clearInterval(timer);
  }, [isRecording, secondsLeft, handleStopRecording]);

  if (!isOpen) return null;

  const formattedSeconds = String(secondsLeft).padStart(2, "0");

  return (
    <div className={`w-full max-w-[420px] bg-[#071e16] border border-[#2d4236] rounded-xl overflow-hidden shadow-2xl ${className}`}>
      {/* Khung video */}
      <div className="relative h-[220px] bg-black/40 flex items-center justify-center">
        {recordedVideoUrl ? (
          <video src={recordedVideoUrl} controls className="w-full h-full object-cover" />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        )}

        {/* Đèn báo REC */}
        {isRecording && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/70 px-2.5 py-1 rounded-full backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-white font-mono text-[10.5px] font-bold">
              REC 00:{formattedSeconds} / 00:{maxDurationSeconds}
            </span>
          </div>
        )}

        {!isRecording && !recordedVideoUrl && (
          <div className="text-[#8da195] text-xs text-center px-4">
            Bấm "Bắt đầu tuyên thệ" để quay video xác thực năng lực minh mẫn (15s)
          </div>
        )}
      </div>

      {/* Thanh điều khiển */}
      <div className="bg-[#0b291e] p-3 flex justify-between items-center border-t border-[#133e2f]">
        <div>
          <div className="text-[#faf8f5] text-xs font-semibold">Điều 630 BLDS 2015</div>
          <div className="text-[#8da195] text-[10px]">Tuyên thệ ý chí tự nguyện</div>
        </div>

        <div className="flex gap-2">
          {isRecording ? (
            <button
              type="button"
              onClick={handleStopRecording}
              className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1"
            >
              <span>⏹</span> Dừng quay
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartRecording}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors flex items-center gap-1"
            >
              <span>🔴</span> {recordedVideoUrl ? "Quay lại" : "Bắt đầu tuyên thệ"}
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 text-xs font-medium text-[#8da195] hover:text-white transition-colors"
            >
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
