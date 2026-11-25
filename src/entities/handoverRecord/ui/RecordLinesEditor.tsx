import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles, Notice, Panel } from "@/shared/ui/heritageKit";
import { handoverRecordService } from "../api/handoverRecordService";
import type { HandoverRecord, RecordLine, SplitDifference } from "../model/handoverRecord.schema";
import {
  draftsFromReports,
  draftToRecipient,
  draftWarning,
  recipientDraftErrors,
  serverDraftErrors,
  skippedDeclarations,
  type RecipientDraft,
  type RecipientDraftErrors,
} from "../model/recipientDraft";
import { SPLIT_DEVIATION_LABEL } from "../model/splitDifference";
import { handoverRecordKeys } from "../model/useHandoverRecord";
import { NewRecipientCards } from "./NewRecipientCards";
import { SplitDeviationPanel } from "./SplitDeviationPanel";
import { ActionButton } from "@/shared/ui/ActionButton";
import { useSuccessHold } from "@/shared/lib/useSuccessHold";

const pairKey = (beneficiaryId: string, assetId: string) => `${beneficiaryId}:${assetId}`;

function linesOf(record: HandoverRecord): Set<string> {
  const result = new Set<string>();
  for (const recipient of record.recipients) {
    for (const asset of recipient.assets)
      result.add(pairKey(recipient.beneficiaryId, asset.assetId));
  }
  return result;
}

/** Dưới tên người nhận ở đầu cột: Chủ kho có chia tài sản cho người này hay không. */
function RecipientSource({ fromOwnerSplit }: { fromOwnerSplit: boolean }) {
  let text = "Ngoài cách chia của Chủ kho";
  let tone = "bg-heritage-warning-bg text-heritage-warning";
  if (fromOwnerSplit) {
    text = "Chủ kho đã chia";
    tone = "bg-heritage-success-bg text-heritage-success";
  }
  return (
    <span className={`mt-1 block w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>
      {text}
    </span>
  );
}

/**
 * Bước 1 của luật sư: chọn ai nhận tài sản nào. Mỗi ô là một cặp người nhận - tài sản; một tài sản có thể
 * giao cho nhiều người (đồng thừa kế). Có thể lấy biên bản phân chia của Chủ kho làm bản đầu rồi sửa.
 * Người nhận chưa có trong kho thì nhập ngay tại đây. Một nút "Chốt và gửi thư" lưu người nhận, lưu biên bản, chốt và
 * gửi thư mời; lỗi giữa chừng thì phần đã lưu được giữ, bấm lại để làm tiếp. Đã chốt thì phải mở lại biên bản mới sửa.
 */
export function RecordLinesEditor({ record }: { record: HandoverRecord }) {
  const client = useQueryClient();
  const save = usePrivateAction();
  const split = usePrivateAction();
  const finalize = usePrivateAction();
  const finalized = useSuccessHold();
  const saved = useMemo(() => linesOf(record), [record]);
  const [selected, setSelected] = useState<Set<string>>(saved);
  const dirty = selected.size !== saved.size || [...selected].some((key) => !saved.has(key));
  // Luật sư phải tick xác nhận căn cứ pháp lý mỗi lần chốt; state nằm trong component được remount theo revisionNo nên reopen sẽ bỏ tick.
  const [legalBasisConfirmed, setLegalBasisConfirmed] = useState(false);
  // Biên bản khác cách chia của Chủ kho thì phải tick thêm ô này; cũng bỏ tick mỗi khi nội dung đổi.
  const [splitDeviationConfirmed, setSplitDeviationConfirmed] = useState(false);
  const [drafts, setDrafts] = useState<RecipientDraft[]>(() => draftsFromReports(record));
  const [draftErrors, setDraftErrors] = useState<Record<string, RecipientDraftErrors>>({});
  const prefilled = record.reports.some((report) => report.recipients.length > 0);
  // Người đang nhập chưa lưu nên máy chủ chưa tính: thêm họ vào danh sách khác biệt để luật sư xác nhận ngay, tránh
  // lưu người nhận xong mới bị chặn ở bước chốt. Chủ kho không chia gì thì không có gì để khác.
  const pendingDifferences: SplitDifference[] = [];
  if (record.ownerSplit.length > 0) {
    for (const draft of drafts) {
      pendingDifferences.push({
        kind: "RECIPIENT_ADDED",
        beneficiaryId: null,
        recipientName: draft.fullName.trim() || "người nhận mới",
        assetId: null,
        assetName: "",
        ownerRecipientNames: [],
        recordRecipientNames: [],
      });
    }
  }
  const differences = [...record.splitDifferences, ...pendingDifferences];
  const hasDeviation = differences.length > 0;
  const ownerRecipientIds = new Set(record.ownerSplit.map((entry) => entry.beneficiaryId));
  const draftWarnings = Object.fromEntries(
    drafts.map((draft) => [draft.key, draftWarning(record, draft)]),
  );
  const deviationReady = !hasDeviation || splitDeviationConfirmed;
  const busy = save.pending || split.pending || finalize.pending;
  // Người bị từ chối giấy tờ không được ghi vào biên bản; còn yêu cầu chưa xét thì chưa chốt được.
  const rejected = new Set(
    record.claims
      .filter((claim) => claim.status === "REJECTED")
      .map((claim) => claim.beneficiaryId),
  );
  const claimsPending = record.claims.some(
    (claim) => claim.status === "SUBMITTED" || claim.status === "SUPPLEMENT_REQUESTED",
  );
  // Biên bản mở từ hồ sơ báo tin đã chấp nhận thì không cần thêm yêu cầu nhận nào.
  const noAccepted =
    record.reports.length === 0 && !record.claims.some((claim) => claim.status === "ACCEPTED");
  const recipientNames = new Map(
    record.availableRecipients.map((person) => [person.beneficiaryId, person.fullName]),
  );

  const apply = (next: HandoverRecord) => {
    client.setQueryData(handoverRecordKeys.verifier(next.id), next);
    setSelected(linesOf(next));
    setLegalBasisConfirmed(false);
    setSplitDeviationConfirmed(false);
    void client.invalidateQueries({ queryKey: handoverRecordKeys.root });
  };
  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
    setLegalBasisConfirmed(false);
    setSplitDeviationConfirmed(false);
  };
  const changeDrafts = (next: RecipientDraft[]) => {
    setDrafts(next);
    setDraftErrors({});
    setLegalBasisConfirmed(false);
    setSplitDeviationConfirmed(false);
  };
  /** Lưu mọi người nhận mới trong một lần, lưu các dòng rồi chốt; chốt xong Backend gửi thư mời. */
  const sendAll = async (): Promise<HandoverRecord> => {
    const pairs = new Set(selected);
    if (drafts.length > 0) {
      const added = await handoverRecordService.addRecipients(
        record.id,
        drafts.map(draftToRecipient),
      );
      const idByEmail = new Map(
        added.availableRecipients.map((person) => [
          person.email.trim().toLowerCase(),
          person.beneficiaryId,
        ]),
      );
      for (const draft of drafts) {
        const addedId = idByEmail.get(draft.email.trim().toLowerCase());
        if (!addedId) throw new Error("Không đọc được người nhận vừa thêm.");
        for (const assetId of draft.assetIds) pairs.add(pairKey(addedId, assetId));
      }
      // Đã lưu cả nhóm: bỏ khỏi phần nhập để bấm lại không thêm trùng.
      client.setQueryData(handoverRecordKeys.verifier(record.id), added);
      setDrafts([]);
      setSelected(new Set(pairs));
    }
    if (dirty || drafts.length > 0) {
      const all = [...pairs].map((key) => {
        const [beneficiaryId, assetId] = key.split(":");
        return { beneficiaryId, assetId };
      });
      const saved = await handoverRecordService.setLines(record.id, all);
      client.setQueryData(handoverRecordKeys.verifier(record.id), saved);
    }
    return handoverRecordService.finalize(record.id, splitDeviationConfirmed);
  };
  const handleSend = () => {
    const errors = recipientDraftErrors(drafts);
    setDraftErrors(errors);
    if (Object.keys(errors).length > 0) return;
    void finalize.execute(
      () => finalized.hold(sendAll),
      apply,
      (failure) => {
        setDraftErrors(serverDraftErrors(failure, drafts));
      },
    );
  };
  const recipientCount =
    new Set([...selected].map((key) => key.split(":")[0])).size + drafts.length;
  const lines: RecordLine[] = [...selected].map((key) => {
    const [beneficiaryId, assetId] = key.split(":");
    return { beneficiaryId, assetId };
  });

  if (record.availableAssets.length === 0) {
    return (
      <Notice tone="warning" title="Kho chưa có đủ dữ liệu để lập biên bản">
        Kho không có tài sản nào.
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
            <p className="font-semibold">Biên bản phân chia của Chủ kho</p>
            <ul className="list-disc space-y-1 pl-4">
              {record.ownerSplit.map((entry) => (
                <li key={entry.beneficiaryId}>
                  {`${recipientNames.get(entry.beneficiaryId) || "Người nhận"}: ${entry.assetIds.length} tài sản`}
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
              {split.pending ? "Đang lấy…" : "Lấy biên bản phân chia làm bản đầu"}
            </button>
            {split.error && (
              <p role="alert" className="text-destructive">
                {split.error}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-heritage-muted">
            Chủ kho chưa lập biên bản phân chia. Bạn tự lập biên bản.
          </p>
        )}

        <NewRecipientCards
          drafts={drafts}
          errors={draftErrors}
          assets={record.availableAssets}
          prefilled={prefilled}
          warnings={draftWarnings}
          skipped={skippedDeclarations(record)}
          disabled={busy}
          onChange={changeDrafts}
        />

        {record.availableRecipients.length > 0 && (
          <div className="relative overflow-x-auto">
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
                      <span className="font-normal">{`CCCD ${person.citizenId}`}</span>
                      {record.ownerSplit.length > 0 && (
                        <RecipientSource
                          fromOwnerSplit={ownerRecipientIds.has(person.beneficiaryId)}
                        />
                      )}
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
                            className="size-5 cursor-pointer accent-heritage-primary"
                            aria-label={`${person.fullName} nhận ${asset.name}`}
                            checked={selected.has(key)}
                            disabled={busy || rejected.has(person.beneficiaryId)}
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
        )}

        <SplitDeviationPanel differences={differences} />
        {hasDeviation && (
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6">
            <input
              type="checkbox"
              className="mt-1 size-5 shrink-0 cursor-pointer accent-heritage-primary"
              checked={splitDeviationConfirmed}
              disabled={busy}
              onChange={(event) => setSplitDeviationConfirmed(event.target.checked)}
            />
            <span>{SPLIT_DEVIATION_LABEL}</span>
          </label>
        )}

        <label className="flex cursor-pointer items-start gap-3 text-sm leading-6">
          <input
            type="checkbox"
            className="mt-1 size-5 shrink-0 cursor-pointer accent-heritage-primary"
            checked={legalBasisConfirmed}
            disabled={busy}
            onChange={(event) => setLegalBasisConfirmed(event.target.checked)}
          />
          <span>
            Tôi đã kiểm tra di chúc (bản sau cùng, hợp pháp) và lập biên bản này theo đúng quy định.
            Tôi chịu trách nhiệm về nội dung biên bản.
          </span>
        </label>

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
          <ActionButton
            className={buttonStyles.dark}
            pending={finalize.pending}
            done={finalized.done}
            pendingLabel="Đang chốt và gửi thư…"
            doneLabel="Đã chốt"
            disabled={
              busy ||
              recipientCount === 0 ||
              claimsPending ||
              noAccepted ||
              !record.vaultLocked ||
              !legalBasisConfirmed ||
              !deviationReady
            }
            onClick={handleSend}
          >
            Chốt và gửi thư
          </ActionButton>
        </div>
        {claimsPending && (
          <p role="status" className="text-sm text-heritage-muted">
            Còn yêu cầu nhận chưa xét xong. Xét giấy tờ của mọi người nhận rồi mới chốt được.
          </p>
        )}
        {!record.vaultLocked && (
          <p role="status" className="text-sm text-heritage-muted">
            Kho chưa khóa: chấp nhận giấy tờ của ít nhất một yêu cầu trước khi chốt.
          </p>
        )}
        {!claimsPending && noAccepted && (
          <p role="status" className="text-sm text-heritage-muted">
            Chưa có yêu cầu nhận nào được chấp nhận nên chưa chốt được.
          </p>
        )}
        {Object.keys(draftErrors).length > 0 && (
          <p role="alert" className="text-sm text-destructive">
            Thông tin người nhận chưa đủ hoặc chưa hợp lệ. Kiểm lại các ô báo lỗi ở trên.
          </p>
        )}
        {(save.error || finalize.error) && (
          <p role="alert" className="text-sm text-destructive">
            {save.error || finalize.error}
          </p>
        )}
        <p className="text-sm text-heritage-muted">
          {`Bấm "Chốt và gửi thư": hệ thống lưu biên bản rồi gửi thư mời cho ${recipientCount} người nhận để họ nộp căn cước.`}
        </p>
      </div>
    </Panel>
  );
}
