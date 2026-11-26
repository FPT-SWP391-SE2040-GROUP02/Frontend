import { RecordFileList } from "./RecordFileList";
import type { TransferOptions } from "@/shared/lib/useTransfer";
import type { RecordFile } from "../model/handoverRecord.schema";
import type { SuggestedRecipient } from "../model/handoverReport.schema";
import { declaredIdentity } from "../model/declaredIdentity";

/** Loại giấy tờ theo thứ tự hiện. CLAIM_DOCUMENT: tệp chưa chia loại (nộp bổ sung, yêu cầu lưu từ trước). */
const GROUPS = [
  { kind: "DEATH_CERTIFICATE", label: "Giấy chứng tử" },
  { kind: "WILL", label: "Di chúc" },
  { kind: "OTHER", label: "Giấy tờ khác" },
  { kind: "CLAIM_DOCUMENT", label: "Giấy tờ" },
];

/** Loại lạ gom vào nhóm "Giấy tờ" để không tệp nào bị ẩn. */
function groupOf(kind: string): string {
  if (GROUPS.some((group) => group.kind === kind)) return kind;
  return "CLAIM_DOCUMENT";
}

/**
 * Giấy tờ của hồ sơ báo tin hoặc yêu cầu nhận tài sản, chia theo loại; loại không có tệp thì không hiện.
 */
export function DocumentFiles({
  files,
  download,
}: {
  files: RecordFile[];
  download: (file: { id: string }, options: TransferOptions) => Promise<Blob>;
}) {
  if (files.length === 0) return <p className="text-sm text-heritage-muted">Chưa có tệp nào.</p>;
  return (
    <div className="space-y-4">
      {GROUPS.map(({ kind, label }) => {
        const items = files.filter((file) => groupOf(file.kind) === kind);
        if (items.length === 0) return null;
        return (
          <div key={kind} className="space-y-2">
            <p className="text-sm font-semibold text-heritage-primary">{label}</p>
            <RecordFileList files={items} download={download} showWillLabel={false} />
          </div>
        );
      })}
    </div>
  );
}

/** Người nhận do người nộp khai, kèm email, số điện thoại, căn cước và ngày sinh nếu có. */
export function SuggestedRecipientList({ recipients }: { recipients: SuggestedRecipient[] }) {
  if (recipients.length === 0) return null;
  return (
    <div className="space-y-2 text-sm">
      <p className="font-semibold text-heritage-primary">Người nhận do người nộp khai</p>
      <ul className="divide-y divide-heritage-border rounded-xl border border-heritage-border bg-white">
        {recipients.map((person, index) => (
          <li key={`${index}:${person.email}`} className="px-4 py-3">
            <p className="font-medium">{person.fullName}</p>
            <p className="break-all text-heritage-muted">
              {[person.email, person.phone].filter((text) => text !== "").join(" · ")}
            </p>
            {declaredIdentity(person) !== "" && (
              <p className="text-heritage-muted">{declaredIdentity(person)}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
