import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { buttonStyles, Chip } from "@/shared/ui/heritageKit";
import { handoverService } from "../api/handoverService";
import {
  MAX_RESIDENCE_ADDRESS_LENGTH,
  submissionFormError,
  type SubmissionDraft,
} from "../model/submissionForm";
import { useHandoverAction } from "../model/useHandoverAction";
import { ImagePicker } from "./ImagePicker";

const FIELD =
  "h-11 w-full rounded-xl border border-heritage-gold-soft bg-heritage-warning-bg px-3 text-sm font-semibold text-heritage-primary outline-none focus-visible:ring-2 focus-visible:ring-heritage-gold/40";

function emptyDraft(): SubmissionDraft {
  return {
    kind: "ACCEPT",
    fullName: "",
    citizenId: "",
    dateOfBirth: "",
    residenceAddress: "",
    front: null,
    back: null,
    acknowledged: false,
    voluntaryDecline: false,
  };
}

/** Bản khai danh tính: họ tên, ngày sinh, số căn cước, nơi thường trú và ảnh căn cước hai mặt. */
function IdentityForm({ turnId, onDone }: { turnId: string; onDone: () => void }) {
  const action = useHandoverAction();
  const [draft, setDraft] = useState<SubmissionDraft>(emptyDraft);
  const [touched, setTouched] = useState(false);
  const set = <K extends keyof SubmissionDraft>(key: K, value: SubmissionDraft[K]) =>
    setDraft((previous) => ({ ...previous, [key]: value }));
  const error = submissionFormError(draft);
  const submit = () => {
    setTouched(true);
    if (error) return;
    void action.execute(() => handoverService.submitSubmission(turnId, draft), onDone);
  };
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1 text-sm font-semibold">
          Họ tên
          <input
            className={FIELD}
            value={draft.fullName}
            maxLength={200}
            onChange={(event) => set("fullName", event.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm font-semibold">
          Ngày sinh
          <input
            className={FIELD}
            type="date"
            value={draft.dateOfBirth}
            onChange={(event) => set("dateOfBirth", event.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm font-semibold">
          Số căn cước
          <input
            className={`${FIELD} font-mono tracking-wider`}
            inputMode="numeric"
            maxLength={12}
            value={draft.citizenId}
            onChange={(event) => set("citizenId", event.target.value.replace(/\D/g, ""))}
          />
        </label>
      </div>
      <label className="block space-y-1 text-sm font-semibold">
        Nơi thường trú
        <input
          className={FIELD}
          value={draft.residenceAddress}
          maxLength={MAX_RESIDENCE_ADDRESS_LENGTH}
          autoComplete="street-address"
          onChange={(event) => set("residenceAddress", event.target.value)}
        />
        <span className="block text-sm font-normal text-heritage-muted">
          Ghi đúng như trên căn cước
        </span>
      </label>
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
      <p className="text-sm text-heritage-muted">
        Ảnh căn cước chỉ để luật sư đối chiếu danh tính, xóa khi bàn giao xong.
      </p>
      <label className="flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1 size-5 cursor-pointer accent-heritage-primary"
          checked={draft.acknowledged}
          onChange={(event) => set("acknowledged", event.target.checked)}
        />
        <span>Tôi cam đoan thông tin và ảnh căn cước trên là của tôi và đúng sự thật.</span>
      </label>
      {touched && error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <button
        type="button"
        className={buttonStyles.dark}
        disabled={action.pending}
        onClick={submit}
      >
        {action.pending ? "Đang gửi…" : "Gửi cho luật sư kiểm"}
      </button>
      {action.error && !action.pending && (
        <p role="alert" className="text-sm text-destructive">
          {action.error}
        </p>
      )}
    </div>
  );
}

/**
 * Bước danh tính của người nhận (lượt đang xác minh danh tính): nộp căn cước để luật sư đối chiếu với thông tin
 * Chủ kho đã khai. Đã nộp thì chờ; luật sư yêu cầu làm lại thì hiện lý do và cho nộp lại.
 */
export function RecipientIdentityPanel({
  turnId,
  onChanged,
}: {
  turnId: string;
  onChanged: () => void;
}) {
  const query = useQuery({
    queryKey: ["handover", "submission", turnId],
    queryFn: ({ signal }) => handoverService.latestSubmission(turnId, signal),
    retry: false,
  });
  if (query.isPending) return <p role="status">Đang tải hồ sơ danh tính…</p>;
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p className="text-sm text-heritage-danger">Không tải được hồ sơ danh tính của bạn.</p>
        <button type="button" className={buttonStyles.outline} onClick={() => void query.refetch()}>
          Thử lại
        </button>
      </div>
    );
  }
  const refresh = () => {
    void query.refetch();
    onChanged();
  };
  const latest = query.data;
  if (latest && latest.status === "SUBMITTED") {
    return (
      <div className="space-y-2 rounded-2xl border border-heritage-border bg-white p-5 text-sm leading-6">
        <p className="flex flex-wrap items-center gap-2 font-semibold text-heritage-primary">
          Đã gửi cho luật sư <Chip>Chờ kiểm</Chip>
        </p>
        <p className="text-heritage-muted">
          Luật sư đang đối chiếu căn cước của bạn. Khi mọi người nhận được xác nhận, bạn sẽ ký biên
          bản bàn giao.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {latest && latest.status === "SUPPLEMENT_REQUESTED" && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-heritage-danger-bg px-4 py-3 text-sm text-heritage-danger"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            <b>Luật sư yêu cầu làm lại:</b> {latest.supplementReason}
          </span>
        </div>
      )}
      <p className="text-sm leading-6">
        Bạn có tên trong biên bản bàn giao. Khai đúng thông tin trên căn cước để luật sư xác nhận
        danh tính.
      </p>
      <IdentityForm turnId={turnId} onDone={refresh} />
    </div>
  );
}
