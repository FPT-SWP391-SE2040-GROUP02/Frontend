import { useState } from "react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { useSuccessHold } from "@/shared/lib/useSuccessHold";
import { ActionButton } from "@/shared/ui/ActionButton";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { filesError } from "../model/handoverRequest.schema";
import { DocumentPicker } from "./DocumentPicker";

/** Nộp bổ sung giấy tờ khi luật sư yêu cầu; dùng chung cho yêu cầu nhận và hồ sơ báo tin. */
export function SupplementForm({
  send,
  onSent,
}: {
  send: (note: string, files: File[]) => Promise<unknown>;
  onSent: () => void;
}) {
  const action = usePrivateAction();
  const sent = useSuccessHold();
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);
  const error = filesError(files);
  return (
    <div className="space-y-3 border-t border-heritage-border pt-4">
      <DocumentPicker files={files} onChange={setFiles} disabled={action.pending} />
      {touched && error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <label className="block space-y-1 text-sm font-semibold">
        Lời nhắn (không bắt buộc)
        <textarea
          className="min-h-20 w-full rounded-xl border border-heritage-border bg-white p-3 font-normal"
          maxLength={1000}
          value={note}
          disabled={action.pending}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <ActionButton
        className={buttonStyles.dark}
        pending={action.pending}
        done={sent.done}
        pendingLabel="Đang nộp…"
        doneLabel="Đã nộp"
        onClick={() => {
          setTouched(true);
          if (error) return;
          void action.execute(
            () => sent.hold(() => send(note, files)),
            () => {
              setFiles([]);
              setNote("");
              setTouched(false);
              onSent();
            },
          );
        }}
      >
        Nộp bổ sung
      </ActionButton>
      {action.error && (
        <p role="alert" className="text-sm text-destructive">
          {action.error}
        </p>
      )}
    </div>
  );
}
