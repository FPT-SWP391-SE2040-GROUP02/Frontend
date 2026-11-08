import { useState, type ChangeEvent, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck, CircleX, FileImage, Hourglass, TriangleAlert } from "lucide-react";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { handoverService } from "../api/handoverService";
import { useHandoverAction } from "../model/useHandoverAction";
import {
  submissionFormError,
  type SubmissionDraft,
  type SubmissionKind,
} from "../model/submissionForm";
import { HandoverTerms } from "./HandoverTerms";

const FIELD =
  "h-10 rounded-lg border border-[#E0C486] bg-[#FFF6D8] px-3 text-sm font-semibold text-heritage-primary outline-none focus-visible:ring-2 focus-visible:ring-heritage-gold/40";

const EMPTY: SubmissionDraft = {
  kind: "ACCEPT",
  fullName: "",
  citizenId: "",
  dateOfBirth: "",
  front: null,
  back: null,
  acknowledged: false,
  voluntaryDecline: false,
};

/**
 * Bước danh tính theo prototype: người nhận chọn Chấp nhận hoặc Từ chối, điền văn bản mẫu (các ô vàng), tải ảnh căn cước
 * hai mặt rồi nộp cho Người xét duyệt. Backend đối chiếu bản khai với thông tin Chủ kho đã khai và chỉ giữ kết quả
 * khớp; màn hình không tự quyết duyệt hay từ chối.
 */
export function RecipientSubmissionPanel({
  turnId,
  groupName,
  onChanged,
}: {
  turnId: string;
  groupName: string;
  /** Gọi sau khi nộp xong để cổng tải lại lượt. */
  onChanged: () => void;
}) {
  const client = useQueryClient();
  const action = useHandoverAction();
  const [draft, setDraft] = useState<SubmissionDraft>(EMPTY);
  const [chosen, setChosen] = useState(false);
  const [touched, setTouched] = useState(false);
  const latest = useQuery({
    queryKey: ["handover", "submission", turnId],
    queryFn: ({ signal }) => handoverService.latestSubmission(turnId, signal),
    retry: false,
  });

  if (latest.isPending) return <p role="status">Đang tải hồ sơ của bạn…</p>;
  if (latest.isError)
    return (
      <div role="alert" className="space-y-3">
        <p className="text-sm text-[#A32119]">Không tải được hồ sơ của bạn.</p>
        <button
          type="button"
          className={buttonStyles.outline}
          onClick={() => void latest.refetch()}
        >
          Thử lại
        </button>
      </div>
    );

  const current = latest.data;
  if (current?.status === "SUBMITTED") {
    return (
      <div className="space-y-3 rounded-2xl border border-heritage-border bg-white p-5">
        <p className="flex items-center gap-2 font-semibold text-heritage-primary">
          <Hourglass className="size-5 text-[#7A5B24]" aria-hidden="true" />
          Đã gửi hồ sơ, chờ Người xét duyệt
        </p>
        <p className="text-sm leading-6 text-heritage-muted">
          Bạn đã chọn <b>{current.kind === "ACCEPT" ? "Chấp nhận" : "Từ chối"}</b>. Người xét duyệt
          đang đối chiếu ảnh căn cước và thông tin bạn khai. Có kết quả, trang này sẽ chuyển sang
          bước tiếp theo.
        </p>
        <button
          type="button"
          className={buttonStyles.outline}
          onClick={() => {
            void latest.refetch();
            onChanged();
          }}
        >
          Tải lại trạng thái
        </button>
      </div>
    );
  }

  const set = <K extends keyof SubmissionDraft>(key: K, value: SubmissionDraft[K]) =>
    setDraft((previous) => ({ ...previous, [key]: value }));
  const pickKind = (kind: SubmissionKind) => {
    setDraft((previous) => ({ ...previous, kind, voluntaryDecline: false, acknowledged: false }));
    setChosen(true);
  };
  const error = submissionFormError(draft);
  const supplement = current?.status === "SUPPLEMENT_REQUESTED" ? current : null;
  const decline = draft.kind === "DECLINE";

  const submit = () => {
    setTouched(true);
    if (error) return;
    void action.execute(
      () => handoverService.submitSubmission(turnId, draft),
      () => {
        setDraft(EMPTY);
        setChosen(false);
        setTouched(false);
        void client.invalidateQueries({ queryKey: ["handover", "submission", turnId] });
        onChanged();
      },
    );
  };

  return (
    <div className="space-y-4">
      {supplement && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-[#F8E1DE] px-4 py-3 text-sm text-[#A32119]"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            <b>Người xét duyệt yêu cầu bổ sung:</b> {supplement.supplementReason ?? "—"}. Hãy sửa
            rồi gửi lại bên dưới.
          </span>
        </div>
      )}
      <HandoverTerms groupName={groupName} />
      <div className="grid gap-3 sm:grid-cols-2">
        <ChoiceButton
          selected={chosen && !decline}
          onClick={() => pickKind("ACCEPT")}
          tone="accept"
          icon={<CircleCheck className="size-5" aria-hidden="true" />}
          title="Tôi chấp nhận"
        />
        <ChoiceButton
          selected={chosen && decline}
          onClick={() => pickKind("DECLINE")}
          tone="decline"
          icon={<CircleX className="size-5" aria-hidden="true" />}
          title="Tôi từ chối"
        />
      </div>
      {chosen && (
        <div className="space-y-4 rounded-2xl border border-heritage-border bg-white p-5 shadow-sm">
          <p className="text-sm text-heritage-muted">
            Văn bản có sẵn mẫu. Bạn chỉ cần điền vào các ô vàng (họ tên, ngày sinh, số căn cước),
            rồi tải ảnh căn cước hai mặt.
          </p>
          <article
            aria-label={decline ? "Văn bản từ chối" : "Văn bản chấp nhận"}
            className="rounded-xl border border-heritage-border bg-[#FFFEFB] px-5 py-6 text-sm leading-8"
          >
            <p className="text-center text-xs font-semibold uppercase tracking-wide text-heritage-muted">
              Cộng hòa xã hội chủ nghĩa Việt Nam
            </p>
            <h4 className="mt-1 text-center font-serif text-lg font-bold uppercase text-heritage-primary">
              {decline ? "Văn bản từ chối nhận tài sản" : "Văn bản chấp nhận nhận tài sản"}
            </h4>
            <p className="mt-4">
              Tôi tên là{" "}
              <input
                aria-label="Họ tên"
                value={draft.fullName}
                maxLength={200}
                onChange={(event) => set("fullName", event.target.value)}
                className={`${FIELD} w-64 max-w-full`}
              />
              , sinh ngày{" "}
              <input
                aria-label="Ngày sinh"
                type="date"
                value={draft.dateOfBirth}
                onChange={(event) => set("dateOfBirth", event.target.value)}
                className={`${FIELD} w-44`}
              />
              , số căn cước{" "}
              <input
                aria-label="Số căn cước"
                inputMode="numeric"
                maxLength={12}
                value={draft.citizenId}
                onChange={(event) => set("citizenId", event.target.value.replace(/\D/g, ""))}
                className={`${FIELD} w-44 font-mono tracking-wider`}
              />
              .
            </p>
            <p>
              {decline
                ? `Tôi tự nguyện từ chối nhận toàn bộ tài sản của nhóm “${groupName}” do Chủ kho để lại. Tôi hiểu rằng tài sản của nhóm này coi như không được giao cho ai.`
                : `Tôi đồng ý nhận các tài sản của nhóm “${groupName}” do Chủ kho để lại, và tự chịu trách nhiệm làm các thủ tục ngoài đời cùng nghĩa vụ tài sản liên quan trong phạm vi di sản nhận được.`}
            </p>
          </article>
          <div className="grid gap-3 sm:grid-cols-2">
            <ImagePicker
              label="Căn cước mặt trước"
              file={draft.front}
              onPick={(file) => set("front", file)}
            />
            <ImagePicker
              label="Căn cước mặt sau"
              file={draft.back}
              onPick={(file) => set("back", file)}
            />
          </div>
          {decline && (
            <label className="flex min-h-11 items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 size-5"
                checked={draft.voluntaryDecline}
                onChange={(event) => set("voluntaryDecline", event.target.checked)}
              />
              Tôi tự nguyện từ chối và không nhằm trốn tránh nghĩa vụ tài sản.
            </label>
          )}
          <label className="flex min-h-11 items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 size-5"
              checked={draft.acknowledged}
              onChange={(event) => set("acknowledged", event.target.checked)}
            />
            Tôi đã đọc điều khoản của lựa chọn này
            {decline ? ", gồm việc tài sản của nhóm này biến mất" : ""}.
          </label>
          {touched && error && (
            <p role="alert" className="text-sm font-medium text-[#A32119]">
              {error}
            </p>
          )}
          {action.error && !action.pending && (
            <p role="alert" className="rounded-xl bg-[#F8E1DE] px-4 py-3 text-sm text-[#A32119]">
              {action.error}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              className={decline ? buttonStyles.outline : buttonStyles.gold}
              disabled={action.pending}
              onClick={submit}
            >
              {action.pending ? "Đang gửi…" : decline ? "Gửi văn bản từ chối" : "Gửi chấp nhận"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChoiceButton({
  selected,
  onClick,
  tone,
  icon,
  title,
}: {
  selected: boolean;
  onClick: () => void;
  tone: "accept" | "decline";
  icon: ReactNode;
  title: string;
}) {
  const color =
    tone === "accept"
      ? "border-[#2E9E6E] text-[#1F7A55] hover:bg-[#F3FAF6]"
      : "border-[#A32119] text-[#A32119] hover:bg-[#FDF3F1]";
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 bg-white px-4 text-base font-semibold transition-colors ${color} ${
        selected ? "ring-4 ring-heritage-gold/40" : ""
      }`}
    >
      {icon}
      {title}
    </button>
  );
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
