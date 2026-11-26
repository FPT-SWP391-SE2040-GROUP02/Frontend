import { RecordFileList } from "./RecordFileList";
import type { TransferOptions } from "@/shared/lib/useTransfer";
import type { ReportFile, SuggestedRecipient } from "../model/handoverReport.schema";
import { suggestedDetailLine } from "../model/recipientDraft";

const KIND_LABEL: Record<ReportFile["kind"], string> = {
  DEATH_CERTIFICATE: "Giấy chứng tử",
  WILL: "Di chúc",
  OTHER: "Giấy tờ khác",
};
const KINDS: ReportFile["kind"][] = ["DEATH_CERTIFICATE", "WILL", "OTHER"];

/** Giấy tờ của hồ sơ báo tin, chia theo loại; loại không có tệp thì không hiện. */
export function ReportFiles({
  files,
  download,
}: {
  files: ReportFile[];
  download: (file: { id: string }, options: TransferOptions) => Promise<Blob>;
}) {
  return (
    <div className="space-y-4">
      {KINDS.map((kind) => {
        const items = files.filter((file) => file.kind === kind);
        if (items.length === 0) return null;
        return (
          <div key={kind} className="space-y-2">
            <p className="text-sm font-semibold text-heritage-primary">{KIND_LABEL[kind]}</p>
            <RecordFileList files={items} download={download} showWillLabel={false} />
          </div>
        );
      })}
    </div>
  );
}

/** Người nhận do người nộp khai, kèm email và số điện thoại. */
export function SuggestedRecipientList({ recipients }: { recipients: SuggestedRecipient[] }) {
  if (recipients.length === 0) return null;
  return (
    <div className="space-y-2 text-sm">
      <p className="font-semibold text-heritage-primary">Người nhận do người nộp khai</p>
      <ul className="divide-y divide-heritage-border rounded-xl border border-heritage-border bg-white">
        {recipients.map((person, index) => (
          <li key={`${index}:${person.email}`} className="px-4 py-3">
            <p className="font-medium">{person.fullName}</p>
            <p className="break-all text-heritage-muted">{suggestedDetailLine(person)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
