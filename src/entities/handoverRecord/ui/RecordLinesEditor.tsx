import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles, Notice, Panel } from "@/shared/ui/heritageKit";
import { handoverRecordService } from "../api/handoverRecordService";
import type { HandoverRecord, RecordLine } from "../model/handoverRecord.schema";
import { handoverRecordKeys } from "../model/useHandoverRecord";

const pairKey = (beneficiaryId: string, assetId: string) => `${beneficiaryId}:${assetId}`;

function linesOf(record: HandoverRecord): Set<string> {
  const result = new Set<string>();
  for (const recipient of record.recipients) {
    for (const asset of recipient.assets)
      result.add(pairKey(recipient.beneficiaryId, asset.assetId));
  }
  return result;
}

/**
 * Bước 1 của luật sư: chọn ai nhận tài sản nào. Mỗi ô là một cặp người nhận - tài sản; một tài sản có thể
 * giao cho nhiều người (đồng thừa kế). Có thể lấy file phân chia của Chủ kho làm bản đầu rồi sửa.
 * Lưu xong mới chốt được; đã chốt thì phải mở lại biên bản mới sửa.
 */
export function RecordLinesEditor({ record }: { record: HandoverRecord }) {
  const client = useQueryClient();
  const save = usePrivateAction();
  const split = usePrivateAction();
  const finalize = usePrivateAction();
  const saved = useMemo(() => linesOf(record), [record]);
  const [selected, setSelected] = useState<Set<string>>(saved);
  const dirty = selected.size !== saved.size || [...selected].some((key) => !saved.has(key));
  const busy = save.pending || split.pending || finalize.pending;

  const apply = (next: HandoverRecord) => {
    client.setQueryData(handoverRecordKeys.verifier(next.id), next);
    setSelected(linesOf(next));
    void client.invalidateQueries({ queryKey: handoverRecordKeys.root });
  };
  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
  };
  const lines: RecordLine[] = [...selected].map((key) => {
    const [beneficiaryId, assetId] = key.split(":");
    return { beneficiaryId, assetId };
  });

  if (record.availableAssets.length === 0 || record.availableRecipients.length === 0) {
    return (
      <Notice tone="warning" title="Kho chưa có đủ dữ liệu để lập biên bản">
        Chủ kho chưa khai tài sản hoặc người nhận nào.
      </Notice>
    );
  }

  return (
    <Panel title="Bước 1 · Lập biên bản" labelledBy="record-lines">
      <div className="space-y-4">
        <p className="text-sm leading-6">
          Đánh dấu người nhận cho từng tài sản theo kết quả bạn đã xử lý ở ngoài hệ thống. Một tài
          sản có thể giao cho nhiều người.
        </p>
        {record.ownerSplit.length > 0 ? (
          <div className="space-y-2 rounded-xl border border-heritage-border p-4 text-sm">
            <p className="font-semibold">File phân chia của Chủ kho</p>
            <ul className="list-disc space-y-1 pl-4">
              {record.ownerSplit.map((pkg) => (
                <li key={pkg.packageName}>
                  {`${pkg.packageName}: ${pkg.assetIds.length} tài sản cho ${pkg.beneficiaryIds.length} người nhận`}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={buttonStyles.outline}
              disabled={busy}
              onClick={() =>
                void split.execute(() => handoverRecordService.useOwnerSplit(record.id), apply)
              }
            >
              {split.pending ? "Đang lấy…" : "Lấy file phân chia làm bản đầu"}
            </button>
            {split.error && (
              <p role="alert" className="text-destructive">
                {split.error}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-heritage-muted">
            Chủ kho chưa lập file phân chia. Bạn tự lập biên bản.
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <caption className="sr-only">Chọn người nhận cho từng tài sản</caption>
            <thead>
              <tr className="border-b border-heritage-border text-sm text-heritage-muted">
                <th scope="col" className="py-3 pr-4 font-semibold">
                  Tài sản
                </th>
                {record.availableRecipients.map((person) => (
                  <th key={person.beneficiaryId} scope="col" className="px-4 py-3 font-semibold">
                    <span className="block">{person.fullName || "—"}</span>
                    <span className="font-normal">{`****${person.citizenIdLast4}`}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-heritage-border">
              {record.availableAssets.map((asset) => (
                <tr key={asset.assetId}>
                  <th scope="row" className="py-3 pr-4 font-medium">
                    {asset.name}
                  </th>
                  {record.availableRecipients.map((person) => {
                    const key = pairKey(person.beneficiaryId, asset.assetId);
                    return (
                      <td key={key} className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="size-5 cursor-pointer accent-[#0A281E]"
                          aria-label={`${person.fullName} nhận ${asset.name}`}
                          checked={selected.has(key)}
                          disabled={busy}
                          onChange={() => toggle(key)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={buttonStyles.outline}
            disabled={busy || !dirty || selected.size === 0}
            onClick={() =>
              void save.execute(() => handoverRecordService.setLines(record.id, lines), apply)
            }
          >
            {save.pending ? "Đang lưu…" : "Lưu biên bản"}
          </button>
          <button
            type="button"
            className={buttonStyles.gold}
            disabled={busy || dirty || saved.size === 0}
            onClick={() =>
              void finalize.execute(() => handoverRecordService.finalize(record.id), apply)
            }
          >
            {finalize.pending ? "Đang chốt…" : "Chốt biên bản"}
          </button>
        </div>
        {dirty && (
          <p role="status" className="text-sm text-heritage-muted">
            Có thay đổi chưa lưu. Lưu biên bản rồi mới chốt được.
          </p>
        )}
        {(save.error || finalize.error) && (
          <p role="alert" className="text-sm text-destructive">
            {save.error || finalize.error}
          </p>
        )}
        <p className="text-sm text-heritage-muted">
          Chốt xong, hệ thống gửi thư mời cho từng người nhận để họ nộp căn cước.
        </p>
      </div>
    </Panel>
  );
}
