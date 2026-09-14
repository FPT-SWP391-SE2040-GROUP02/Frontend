import React, { useRef, useState, useEffect } from "react";
import { Camera, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Card,
  Badge,
} from "@/shared/ui";
import { useVerifyBiometricEkyc } from "../model/useHandover";
import type { EkycSessionResult } from "../model/handover.types";

/**
 * @file BiometricEkycModal.tsx
 * @description Hộp thoại xác thực khuôn mặt sinh trắc học và kiểm tra người thật 3D (eKYC Liveness $\ge 90\%$, Face Match $\ge 85\%$).
 */

export interface BiometricEkycModalProps {
  /** Trạng thái mở/đóng modal */
  isOpen: boolean;
  /** Họ tên Người thụ hưởng cần đối soát */
  beneficiaryFullName: string;
  /** Số CCCD Người thụ hưởng */
  beneficiaryNationalId: string;
  /** Đóng modal */
  onClose: () => void;
  /** Callback khi xác thực sinh trắc học đạt chuẩn thành công */
  onSuccess: (result: EkycSessionResult) => void;
}

/**
 * Modal xác thực sinh trắc học eKYC
 * @param {BiometricEkycModalProps} props Thuộc tính component
 * @returns {React.JSX.Element} Dialog component
 */
export const BiometricEkycModal: React.FC<BiometricEkycModalProps> = ({
  isOpen,
  beneficiaryFullName,
  beneficiaryNationalId,
  onClose,
  onSuccess,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Local Ephemeral UI State: Chỉ dùng cho luồng webcam DOM cục bộ (tự dọn dẹp khi unmount)
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const verifyEkycMutation = useVerifyBiometricEkyc();

  // Khởi tạo MediaStream từ webcam máy tính
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (isOpen && !capturedImage) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" } })
        .then((mediaStream) => {
          stream = mediaStream;
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            setCameraActive(true);
          }
        })
        .catch((err) => {
          console.error("Không thể mở Webcam:", err);
          setCameraActive(false);
        });
    }

    return () => {
      // Dọn sạch luồng camera khi đóng modal hoặc unmount
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, capturedImage]);

  const handleCaptureFrame = () => {
    // Chụp khung hình từ webcam video và chuyển thành Base64 JPEG
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setCapturedImage(dataUrl);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    verifyEkycMutation.reset();
  };

  const handleSubmitVerification = () => {
    // Gửi ảnh khuôn mặt lên server eKYC để kiểm tra người thật 3D và tính điểm khớp CCCD
    if (!capturedImage) return;

    verifyEkycMutation.mutate(
      {
        sessionId: `ekyc_${Date.now()}`,
        faceImageBase64: capturedImage,
      },
      {
        onSuccess: (result) => {
          onSuccess(result);
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-[#FAF9F5] border border-[#E8DCC6] rounded-[28px] shadow-2xl">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-b from-[#EFECE6] to-[#FAF9F5] border-b border-[#E8DCC6]/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#0B291E] text-[#B88E4C] flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-[#0B291E]">
                  Xác Thực Sinh Trắc Học eKYC (AI Liveness)
                </DialogTitle>
                <DialogDescription className="text-xs text-[#66786E]">
                  Đối soát khuôn mặt với CSDL Căn cước công dân gắn chip để mở khóa di sản số
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Đóng hộp thoại"
              className="p-1.5 rounded-full hover:bg-black/5 text-[#66786E] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Thẻ đối chiếu thông tin pháp lý */}
          <Card className="p-3.5 bg-[#FBF7EE] border-[#B88E4C]/30 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#66786E] uppercase tracking-wider block">
                Người thụ hưởng chỉ định:
              </span>
              <p className="text-xs font-bold text-[#0B291E] mt-0.5">{beneficiaryFullName}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-[#66786E] uppercase tracking-wider block">
                Số CCCD gắn chip:
              </span>
              <p className="text-xs font-mono font-bold text-[#B88E4C] mt-0.5">{beneficiaryNationalId}</p>
            </div>
          </Card>

          {/* Khung Webcam Trực Tiếp hoặc Ảnh đã chụp */}
          <div className="relative aspect-4/3 w-full rounded-[22px] overflow-hidden bg-[#14241C] border-2 border-[#DCD9D0] flex items-center justify-center shadow-inner">
            <canvas ref={canvasRef} className="hidden" />

            {capturedImage ? (
              <img src={capturedImage} alt="Ảnh chụp khuôn mặt" className="w-full h-full object-cover" />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
            )}

            {/* Khung viền chỉ thị vị trí khuôn mặt (Oval Face Guide) */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className={`w-52 h-64 rounded-[50%] border-2 border-dashed transition-all duration-300 ${
                  capturedImage
                    ? "border-[#059669] bg-[#059669]/10"
                    : cameraActive
                    ? "border-[#B88E4C] animate-pulse"
                    : "border-gray-500"
                }`}
              />
            </div>

            {/* Badge chỉ thị trạng thái AI Liveness */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <Badge className="bg-[#0B291E]/80 backdrop-blur-md text-[#FAF9F5] border-none text-[10px] px-2.5 py-1">
                {capturedImage ? "Đã cố định khung hình" : cameraActive ? "Đang quét khuôn mặt 3D..." : "Đang kết nối Webcam..."}
              </Badge>
              <span className="text-[10px] text-white/80 font-mono bg-black/40 px-2 py-0.5 rounded-lg">
                Anti-Deepfake Active
              </span>
            </div>
          </div>

          {/* Thông báo lỗi nếu xác thực thất bại */}
          {verifyEkycMutation.error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{verifyEkycMutation.error.message}</span>
            </div>
          )}

          {/* Kết quả thành công */}
          {verifyEkycMutation.data?.isPassed && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                <span className="font-bold">Xác thực eKYC thành công!</span>
              </div>
              <span className="font-mono text-[11px] font-bold">
                Khớp {verifyEkycMutation.data.faceMatchScore}% • Liveness {verifyEkycMutation.data.livenessConfidence}%
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-2 bg-[#FAF9F5] border-t border-[#E8DCC6]/60 flex items-center justify-end gap-3">
          {capturedImage ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleRetake}
                disabled={verifyEkycMutation.isPending}
                className="rounded-[18px] text-xs font-bold border-[#DCD9D0] text-[#14241C] flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Chụp Lại</span>
              </Button>

              <Button
                type="button"
                onClick={handleSubmitVerification}
                disabled={verifyEkycMutation.isPending}
                className="rounded-[18px] bg-[#0B291E] hover:bg-[#133E2F] text-white text-xs font-bold px-6 flex items-center gap-2 shadow-md"
              >
                {verifyEkycMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#B88E4C]" />
                    <span>Đang Đối Soát Sinh Trắc Học...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-[#B88E4C]" />
                    <span>Xác Nhận & Mở Khóa Di Sản</span>
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={handleCaptureFrame}
              disabled={!cameraActive}
              className="w-full sm:w-auto rounded-[18px] bg-[#0B291E] hover:bg-[#133E2F] text-white text-xs font-bold px-6 py-2.5 flex items-center justify-center gap-2 shadow-md"
            >
              <Camera className="w-4 h-4 text-[#B88E4C]" />
              <span>Chụp Khuôn Mặt Đối Soát</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
