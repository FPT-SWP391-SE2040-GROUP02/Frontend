import type { ChangeEvent } from "react";
import { FileImage } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { buttonStyles } from "@/shared/ui/heritageKit";
import type { SubmissionDraft } from "../model/submissionForm";
import { SubmissionDocument } from "./SubmissionDocument";

const FIELD =
  "h-10 rounded-lg border border-[#E0C486] bg-[#FFF6D8] px-3 text-sm font-semibold text-heritage-primary outline-none focus-visible:ring-2 focus-visible:ring-heritage-gold/40";

interface SubmissionFormDialogProps {
  draft: SubmissionDraft;
  onChange: <K extends keyof SubmissionDraft>(key: K, value: SubmissionDraft[K]) => void;
  serverTime: string;
  pending: boolean;
  /** Lỗi hình thức của bản điền; chỉ hiện sau lần bấm gửi đầu tiên. */
  formError: string | null;
  /** Lỗi Backend trả về khi gửi; hiện trong hộp thoại vì lớp phủ che phần còn lại của trang. */
  serverError: string;
  onClose: () => void;
  onSubmit: () => void;
}

function ImagePicker({
  label,
  file,
  onPick,
}: {
  label: string;
  file: File | null;
  onPick: (file: File | null) => void;
}) {
  return (
    <label className="flex cursor-pointer flex-col gap-2 rounded-xl border border-dashed border-heritage-border bg-white p-4 text-sm hover:bg-[#F7F4EA]">
      <span className="font-semibold text-heritage-primary">{label}</span>
      <span className="flex items-center gap-2 text-heritage-muted">
        <FileImage className="size-5 shrink-0" aria-hidden="true" />
        {file ? file.name : "Chưa chọn ảnh (JPEG, PNG hoặc WEBP, tối đa 8 MiB)"}
      </span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label={label}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onPick(event.target.files?.[0] ?? null)}
      />
    </label>
  );
}

/**
 * Hộp thoại hiện văn bản mẫu khi người nhận chọn Chấp nhận hoặc Từ chối: điền các ô vàng ngay trên văn bản,
 * chọn ảnh căn cước hai mặt rồi gửi cho Người xét duyệt. Bản điền nằm ở trang cha nên đóng hộp thoại không mất dữ liệu.
 */
export function SubmissionFormDialog(props: SubmissionFormDialogProps) {
  const { draft, onChange } = props;
  const decline = draft.kind === "DECLINE";
  return (
    <Dialog open onOpenChange={(open) => !open && !props.pending && props.onClose()}>
      <DialogContent className="max-w-3xl bg-[#FBFAF5] p-6" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-heritage-primary">
            {decline ? "Văn bản từ chối" : "Biên bản đồng ý nhận"}
          </DialogTitle>
          <DialogDescription className="text-heritage-muted">
            Điền vào các ô vàng, chọn ảnh căn cước hai mặt rồi gửi cho Người xét duyệt.
          </DialogDescription>
        </DialogHeader>
        <SubmissionDocument draft={draft} onChange={onChange} serverTime={props.serverTime} />
        {!decline && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-semibold text-heritage-primary">
              Ngày sinh
              <input
                aria-label="Ngày sinh"
                type="date"
                value={draft.dateOfBirth}
                onChange={(event) => onChange("dateOfBirth", event.target.value)}
                className={FIELD}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold text-heritage-primary">
              Số căn cước
              <input
                aria-label="Số căn cước"
                inputMode="numeric"
                maxLength={12}
                value={draft.citizenId}
                onChange={(event) => onChange("citizenId", event.target.value.replace(/\D/g, ""))}
                className={`${FIELD} font-mono tracking-wider`}
              />
            </label>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <ImagePicker
            label="Căn cước mặt trước"
            file={draft.front}
            onPick={(file) => onChange("front", file)}
          />
          <ImagePicker
            label="Căn cước mặt sau"
            file={draft.back}
            onPick={(file) => onChange("back", file)}
          />
        </div>
        {decline && (
          <label className="flex min-h-11 items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 size-5"
              checked={draft.voluntaryDecline}
              onChange={(event) => onChange("voluntaryDecline", event.target.checked)}
            />
            Tôi tự nguyện từ chối và không nhằm trốn tránh nghĩa vụ tài sản.
          </label>
        )}
        <label className="flex min-h-11 items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1 size-5"
            checked={draft.acknowledged}
            onChange={(event) => onChange("acknowledged", event.target.checked)}
          />
          Tôi đã đọc điều khoản của lựa chọn này
          {decline ? ", gồm việc tài sản của nhóm này biến mất" : ""}.
        </label>
        {props.formError && (
          <p role="alert" className="text-sm font-medium text-[#A32119]">
            {props.formError}
          </p>
        )}
        {props.serverError && !props.pending && (
          <p role="alert" className="rounded-xl bg-[#F8E1DE] px-4 py-3 text-sm text-[#A32119]">
            {props.serverError}
          </p>
        )}
        <DialogFooter>
          <button
            type="button"
            className={buttonStyles.outline}
            disabled={props.pending}
            onClick={props.onClose}
          >
            Đóng
          </button>
          <button
            type="button"
            className={decline ? buttonStyles.dark : buttonStyles.gold}
            disabled={props.pending}
            onClick={props.onSubmit}
          >
            {props.pending ? "Đang gửi…" : decline ? "Gửi văn bản từ chối" : "Gửi chấp nhận"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
