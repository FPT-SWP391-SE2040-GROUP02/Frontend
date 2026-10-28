import { useRef, useState } from "react";
import { RotateCw, ZoomIn, ZoomOut, Check, Crop } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";
import { useImagePreview } from "./useImagePreview";

// Tỷ lệ chuẩn CCCD Việt Nam (ID-1): 85.6mm x 53.98mm ≈ 1.586
const CARD_ASPECT_RATIO = 85.6 / 53.98;

export function ImageCropModal({
  open,
  onOpenChange,
  file,
  onCrop,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  onCrop: (croppedFile: File) => void;
}) {
  const imageUrl = useImagePreview(file);
  const [prevFile, setPrevFile] = useState<File | null>(file);
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  if (file !== prevFile) {
    setPrevFile(file);
    setRotation(0);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleApplyCrop = () => {
    if (!imageRef.current || !containerRef.current || !file) return;

    const img = imageRef.current;
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    // Khung cắt tỷ lệ chuẩn nằm chính giữa container
    const cropBoxWidth = containerRect.width * 0.9;
    const cropBoxHeight = cropBoxWidth / CARD_ASPECT_RATIO;
    const cropBoxX = (containerRect.width - cropBoxWidth) / 2;
    const cropBoxY = (containerRect.height - cropBoxHeight) / 2;

    // Kích thước canvas xuất ra (chuẩn hóa độ phân giải cao cho OCR)
    const exportWidth = 1200;
    const exportHeight = Math.round(exportWidth / CARD_ASPECT_RATIO);

    const canvas = document.createElement("canvas");
    canvas.width = exportWidth;
    canvas.height = exportHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Tỉ lệ scale từ màn hình sang canvas xuất
    const scaleFactor = exportWidth / cropBoxWidth;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, exportWidth, exportHeight);

    ctx.save();
    // Di chuyển gốc tọa độ theo khung cắt
    ctx.scale(scaleFactor, scaleFactor);
    ctx.translate(-cropBoxX, -cropBoxY);

    // Di chuyển đến tâm ảnh sau khi pan
    const centerX = containerRect.width / 2 + pan.x;
    const centerY = containerRect.height / 2 + pan.y;
    ctx.translate(centerX, centerY);

    // Áp dụng góc xoay
    ctx.rotate((rotation * Math.PI) / 180);

    // Áp dụng zoom và vẽ ảnh
    const isRotated90or270 = rotation === 90 || rotation === 270;
    const imgNaturalW = img.naturalWidth;
    const imgNaturalH = img.naturalHeight;

    // Tính kích thước hiển thị cơ bản của ảnh trong container
    const fitScale = Math.min(
      (containerRect.width * 0.85) / (isRotated90or270 ? imgNaturalH : imgNaturalW),
      (containerRect.height * 0.85) / (isRotated90or270 ? imgNaturalW : imgNaturalH),
    );
    const drawW = imgNaturalW * fitScale * zoom;
    const drawH = imgNaturalH * fitScale * zoom;

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const croppedFileName = file.name.replace(/\.[^/.]+$/, "") + "_cropped.jpg";
        const croppedFile = new File([blob], croppedFileName, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
        onCrop(croppedFile);
        onOpenChange(false);
      },
      "image/jpeg",
      0.95,
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-6" aria-label="Cắt và xoay ảnh căn cước">
        <DialogTitle className="flex items-center gap-2 text-xl font-medium text-heritage-primary">
          <Crop className="size-5 text-heritage-gold" aria-hidden="true" />
          Cắt & Xoay ảnh căn cước
        </DialogTitle>
        <DialogDescription>
          Kéo ảnh hoặc xoay để đưa thẻ căn cước vừa vặn vào khung chữ nhật bên dưới.
        </DialogDescription>

        <div className="relative mt-2">
          {/* Vùng xem trước và cắt */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="relative flex h-80 w-full cursor-move select-none items-center justify-center overflow-hidden rounded-xl border border-heritage-border bg-black/90"
          >
            {imageUrl && (
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Ảnh cần cắt"
                draggable={false}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
                  transformOrigin: "center center",
                  maxHeight: "85%",
                  maxWidth: "85%",
                  objectFit: "contain",
                }}
                className="pointer-events-none transition-transform duration-75 ease-out"
              />
            )}

            {/* Khung hướng dẫn tỷ lệ chuẩn CCCD (1.586 : 1) */}
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center p-4"
              aria-hidden="true"
            >
              <div
                style={{
                  aspectRatio: `${CARD_ASPECT_RATIO} / 1`,
                  width: "90%",
                }}
                className="relative rounded-xl border-2 border-dashed border-heritage-gold shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
              >
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-full bg-heritage-gold/90 px-3 py-0.5 text-[11px] font-semibold text-black">
                  Khung căn cước chuẩn
                </span>
              </div>
            </div>
          </div>

          {/* Thanh công cụ điều khiển: Xoay, Zoom, Reset */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRotate}
                className="flex items-center gap-1.5"
                title="Xoay 90 độ"
              >
                <RotateCw className="size-4" aria-hidden="true" />
                Xoay 90°
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                  setRotation(0);
                }}
              >
                Đặt lại
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs text-heritage-muted">
              <ZoomOut className="size-3.5" aria-hidden="true" />
              <input
                type="range"
                min="0.8"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="h-1.5 w-24 cursor-pointer accent-heritage-gold"
                aria-label="Phóng to thu nhỏ"
              />
              <ZoomIn className="size-3.5" aria-hidden="true" />
              <span className="w-8 text-right font-mono font-medium">
                {Math.round(zoom * 100)}%
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleApplyCrop}
            className="flex items-center gap-1.5 bg-[#E0C486] font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B]"
          >
            <Check className="size-4" aria-hidden="true" />
            Cắt và sử dụng ảnh này
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
