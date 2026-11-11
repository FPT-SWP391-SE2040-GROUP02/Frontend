import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ImageUp } from "lucide-react";
import { isAxiosError } from "axios";
import { apiClient } from "@/shared/api";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { HTTP_STATUS } from "@/shared/constants";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { adminService } from "../api/adminService";

const CARD_TYPES = ["image/jpeg", "image/png", "image/webp"];
const CARD_MAX_BYTES = 2 * 1024 * 1024;

interface AdminNotaryCardDialogProps {
  userId: string;
  /** Tên hiển thị của Người xét duyệt, dùng trong tiêu đề. */
  name: string;
  open: boolean;
  onClose: () => void;
}

/** Tải ảnh thẻ của một Người xét duyệt (Admin xem). 404 khi chưa có ảnh. */
function downloadCard(userId: string, signal?: AbortSignal): Promise<Blob> {
  return apiClient.get<Blob, Blob>(`/admin/users/${userId}/notary-card`, {
    responseType: "blob",
    signal,
  });
}

/** Hộp thoại xem và nộp (hoặc nộp lại) ảnh thẻ công chứng viên của Người xét duyệt; ảnh chỉ tải khi mở hộp thoại. */
export function AdminNotaryCardDialog({ userId, name, open, onClose }: AdminNotaryCardDialogProps) {
  const query = useQuery({
    queryKey: ["admin", "notary-card", userId],
    queryFn: ({ signal }) => downloadCard(userId, signal),
    enabled: open,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
  const blob = query.data;
  const { execute, pending, error, succeeded, reset } = usePrivateAction();
  const input = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const onPick = (picked: File | null) => {
    reset();
    setFile(picked);
    if (picked === null) {
      setFileError(null);
      return;
    }
    if (!CARD_TYPES.includes(picked.type)) {
      setFileError("Chỉ nhận ảnh JPEG, PNG hoặc WebP.");
      return;
    }
    if (picked.size > CARD_MAX_BYTES) {
      setFileError("Ảnh tối đa 2 MB.");
      return;
    }
    setFileError(null);
  };

  const onSubmit = () => {
    if (file === null) {
      setFileError("Vui lòng chọn ảnh thẻ công chứng viên.");
      return;
    }
    if (fileError !== null) return;
    void execute(
      () => adminService.uploadNotaryCard(userId, file),
      () => {
        setFile(null);
        if (input.current) input.current.value = "";
        void query.refetch();
      },
    );
  };
  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!blob) return undefined;
    const objectUrl = URL.createObjectURL(blob);
    let active = true;
    void Promise.resolve().then(() => {
      if (active) setUrl(objectUrl);
    });
    return () => {
      active = false;
      URL.revokeObjectURL(objectUrl);
    };
  }, [blob]);

  const missing =
    query.isError &&
    isAxiosError(query.error) &&
    query.error.response?.status === HTTP_STATUS.NOT_FOUND;

  let content = (
    <p role="status" className="text-sm text-heritage-muted">
      Đang tải ảnh thẻ
    </p>
  );
  if (missing) {
    content = (
      <p role="status" className="text-sm text-heritage-muted">
        Người xét duyệt này chưa có ảnh thẻ công chứng viên.
      </p>
    );
  } else if (query.isError) {
    content = (
      <div role="alert" className="space-y-3">
        <p className="text-sm text-destructive">Chưa tải được ảnh thẻ.</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Thử lại
        </Button>
      </div>
    );
  } else if (url) {
    content = (
      <img
        src={url}
        alt={`Ảnh thẻ công chứng viên của ${name}`}
        className="max-h-[70vh] w-full rounded-xl border border-heritage-border object-contain"
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thẻ công chứng viên</DialogTitle>
          <DialogDescription>{name}</DialogDescription>
        </DialogHeader>
        {content}
        <div className="space-y-2 border-t border-heritage-border pt-4">
          <label
            htmlFor="admin-notary-card-file"
            className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-[#BDB8A6] bg-white px-4 py-3 text-sm transition-colors hover:border-heritage-gold hover:bg-[#FBF8EE] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-heritage-gold"
          >
            <ImageUp className="size-5 shrink-0 text-heritage-muted" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block font-semibold text-heritage-primary">
                {missing ? "Chọn ảnh thẻ để nộp" : "Chọn ảnh mới để nộp lại"}
              </span>
              <span id="admin-notary-card-hint" className="block text-xs text-heritage-muted">
                {file ? `Đã chọn: ${file.name}` : "JPEG, PNG hoặc WebP, tối đa 2 MB."}
              </span>
            </span>
            <input
              ref={input}
              id="admin-notary-card-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => onPick(event.target.files?.[0] ?? null)}
              aria-invalid={fileError !== null}
              aria-describedby="admin-notary-card-hint"
              disabled={pending}
              className="sr-only"
            />
          </label>
          {fileError && (
            <p role="alert" className="text-xs text-destructive">
              {fileError}
            </p>
          )}
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
          {succeeded && (
            <p role="status" className="text-xs font-medium text-[#1F7A55]">
              Đã nộp ảnh thẻ.
            </p>
          )}
          <Button onClick={onSubmit} disabled={pending || file === null || fileError !== null}>
            {pending ? "Đang nộp" : missing ? "Nộp ảnh thẻ" : "Nộp lại ảnh thẻ"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
