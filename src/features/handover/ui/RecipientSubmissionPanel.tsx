import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck, CircleX, Hourglass, TriangleAlert } from "lucide-react";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { handoverService } from "../api/handoverService";
import { useHandoverAction } from "../model/useHandoverAction";
import {
  submissionFormError,
  type SubmissionDraft,
  type SubmissionKind,
} from "../model/submissionForm";
import { HandoverTerms } from "./HandoverTerms";
import { SubmissionFormDialog } from "./SubmissionFormDialog";

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
 * Bước danh tính theo prototype: người nhận chọn Chấp nhận hoặc Từ chối thì hiện hộp thoại văn bản mẫu để điền các ô vàng,
 * tải ảnh căn cước hai mặt rồi nộp cho Người xét duyệt. Backend đối chiếu bản khai với thông tin Chủ kho đã khai và chỉ giữ kết quả
 * khớp; màn hình không tự quyết duyệt hay từ chối.
 */
export function RecipientSubmissionPanel({
  turnId,
  groupName,
  serverTime,
  onChanged,
}: {
  turnId: string;
  groupName: string;
  /** Giờ máy chủ của lượt, in lên dòng "Hôm nay, ngày ..." của văn bản. */
  serverTime: string;
  /** Gọi sau khi nộp xong để cổng tải lại lượt. */
  onChanged: () => void;
}) {
  const client = useQueryClient();
  const action = useHandoverAction();
  const [draft, setDraft] = useState<SubmissionDraft>(EMPTY);
  const [chosen, setChosen] = useState(false);
  const [open, setOpen] = useState(false);
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
    setOpen(true);
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
        setOpen(false);
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
      {chosen && open && (
        <SubmissionFormDialog
          draft={draft}
          onChange={set}
          serverTime={serverTime}
          pending={action.pending}
          formError={touched ? error : null}
          serverError={action.error}
          onClose={() => setOpen(false)}
          onSubmit={submit}
        />
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
