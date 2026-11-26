import { compactButton, SectionCard } from "@/shared/ui/SectionCard";
import { useMemo, useState, type ReactNode } from "react";
import { Check, Plus, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles, Notice } from "@/shared/ui/heritageKit";
import { caseCode } from "@/shared/lib/caseCode";
import { handoverRecordService } from "../api/handoverRecordService";
import type { HandoverRecord, RecordLine, SplitDifference } from "../model/handoverRecord.schema";
import {
  draftsFromReports,
  emptyRecipientDraft,
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
import { divisionAssets, pairKey } from "../model/divisionView";
import { DivisionDraftSheet } from "./DivisionDraftSheet";
import { NewRecipientCards } from "./NewRecipientCards";
import { PaperPreviewButton } from "./PaperPreviewButton";
import { RecipientSplitPanel } from "./RecipientSplitPanel";
import { SplitDeviationPanel } from "./SplitDeviationPanel";
import { ActionButton } from "@/shared/ui/ActionButton";
import { useSuccessHold } from "@/shared/lib/useSuccessHold";

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
 * giao cho nhiều người (đồng thừa kế). Có thể lấy biên bản phân chia của Chủ kho làm bản đầu rồi sửa.
 * Người nhận chưa có trong kho thì nhập ngay tại đây. Một nút "Chốt và gửi thư" lưu người nhận, lưu biên bản, chốt và
 * gửi thư mời; lỗi giữa chừng thì phần đã lưu được giữ, bấm lại để làm tiếp. Đã chốt thì phải mở lại biên bản mới sửa.
 */
export function RecordLinesEditor({
  record,
  before,
  after,
  aside,
}: {
  record: HandoverRecord;
  /** Việc làm trước khi chia (hồ sơ, giấy tờ), nằm đầu cột trái. */
  before?: ReactNode;
  /** Phần đính kèm, nằm cuối cột trái. */
  after?: ReactNode;
  /** Việc phụ (hủy biên bản), nằm dưới khung Chốt ở cột phải. */
  aside?: ReactNode;
}) {
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

  // Làm tuần tự: giấy tờ ở mục A xét xong, có người được chấp nhận và kho đã khóa thì mới mở mục B, C và Chốt.
  const unlocked = !claimsPending && !noAccepted && record.vaultLocked;
  const columns = (main: ReactNode, side?: ReactNode) => (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
      <div className="min-w-0 space-y-5">
        {before}
        {main}
        {unlocked && after}
      </div>
      <div className="min-w-0 space-y-4 xl:sticky xl:top-6">
        {side}
        {aside}
      </div>
    </div>
  );

  if (record.availableAssets.length === 0) {
    return columns(
      <Notice tone="warning" title="Kho chưa có đủ dữ liệu để lập biên bản">
        Kho không có tài sản nào.
      </Notice>,
    );
  }

  if (!unlocked) {
    const reasons: string[] = [];
    if (claimsPending) {
      reasons.push(
        "Còn yêu cầu nhận chưa xét xong. Xét giấy tờ của mọi người nhận rồi mới chốt được.",
      );
    }
    if (!record.vaultLocked) {
      reasons.push("Kho chưa khóa: chấp nhận giấy tờ của ít nhất một yêu cầu trước khi chốt.");
    }
    if (!claimsPending && noAccepted) {
      reasons.push("Chưa có yêu cầu nhận nào được chấp nhận nên chưa chốt được.");
    }
    return columns(
      <Notice tone="neutral" title="Xét giấy tờ ở mục A để mở bước tiếp theo">
        <ul className="list-disc space-y-1 pl-5">
          {reasons.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      </Notice>,
    );
  }

  const assets = divisionAssets(record, selected, drafts);
  const dividedCount = assets.filter((asset) => asset.people.length > 0).length;

  const splitPanel = (
    <SectionCard
      title="B. Chia tài sản cho từng người"
      subtitle="Chia theo kết quả bạn đã xử lý ở ngoài hệ thống. Một tài sản có thể giao cho nhiều người."
      labelledBy="record-lines"
      action={
        <div className="flex flex-wrap gap-2">
          {record.ownerSplit.length > 0 && (
            <button
              type="button"
              className={compactButton.outline}
              disabled={busy}
              onClick={() =>
                void split.execute(() => handoverRecordService.useOwnerSplit(record.id), apply)
              }
            >
              {split.pending ? "Đang lấy…" : "Lấy theo Chủ kho"}
            </button>
          )}
          <button
            type="button"
            className={compactButton.dark}
            disabled={busy}
            onClick={() => changeDrafts([...drafts, emptyRecipientDraft()])}
          >
            <Plus className="size-4" aria-hidden="true" />
            Thêm người nhận
          </button>
        </div>
      }
    >
      <div className="space-y-4 p-5">
        {record.ownerSplit.length === 0 && (
          <p className="text-sm text-heritage-muted">
            Chủ kho chưa lập biên bản phân chia. Bạn tự lập biên bản.
          </p>
        )}
        {split.error && (
          <p role="alert" className="text-sm text-destructive">
            {split.error}
          </p>
        )}
        <RecipientSplitPanel
          record={record}
          selected={selected}
          rejected={rejected}
          disabled={busy}
          onToggle={toggle}
        />
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
        <SplitDeviationPanel differences={differences} />
      </div>
    </SectionCard>
  );

  const confirmBox =
    "flex cursor-pointer items-start gap-2.5 rounded-[10px] border p-3 text-sm leading-6";
  const checkbox = "mt-1 size-4 shrink-0 cursor-pointer accent-heritage-primary";

  const finalizePanel = (
    <SectionCard
      title="Chốt biên bản"
      labelledBy="record-finalize"
      action={<span className="text-sm text-heritage-muted">{`Mã: #${caseCode(record.id)}`}</span>}
    >
      <div className="space-y-4 p-5">
        {recipientCount === 0 ? (
          <p role="status" className="flex gap-2 text-sm text-heritage-danger">
            <X className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Chọn ít nhất một người nhận ở mục B.
          </p>
        ) : (
          <p className="flex gap-2 text-sm text-heritage-success">
            <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Đã chọn người nhận. Đánh dấu xác nhận bên dưới rồi chốt.
          </p>
        )}

        <dl className="space-y-1 rounded-[10px] bg-heritage-sunken p-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-heritage-muted">Tài sản đã chia:</dt>
            <dd className="font-semibold">{`${dividedCount} / ${assets.length}`}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-heritage-muted">Sẽ gửi thư mời nộp căn cước cho:</dt>
            <dd className="font-semibold">{`${recipientCount} người`}</dd>
          </div>
        </dl>

        {hasDeviation && (
          <label className={`${confirmBox} border-heritage-warning-border bg-heritage-warning-bg`}>
            <input
              type="checkbox"
              className={checkbox}
              checked={splitDeviationConfirmed}
              disabled={busy}
              onChange={(event) => setSplitDeviationConfirmed(event.target.checked)}
            />
            <span>{SPLIT_DEVIATION_LABEL}</span>
          </label>
        )}
        <label className={`${confirmBox} border-heritage-border bg-heritage-sunken`}>
          <input
            type="checkbox"
            className={checkbox}
            checked={legalBasisConfirmed}
            disabled={busy}
            onChange={(event) => setLegalBasisConfirmed(event.target.checked)}
          />
          <span>
            Tôi đã kiểm tra di chúc (bản sau cùng, hợp pháp) và lập biên bản này theo đúng quy định.
            Tôi chịu trách nhiệm về nội dung biên bản.
          </span>
        </label>

        <div className="flex flex-col gap-2">
          {/* Xem trước đúng cách đang chia (kể cả chưa lưu) trước khi chốt. */}
          <div className="flex flex-col [&>button]:w-full [&>button]:justify-center">
            <PaperPreviewButton
              label="Xem trước biên bản"
              title="Bản nháp biên bản bàn giao"
              fileName={`ban-nhap-bien-ban-ban-giao-${caseCode(record.id)}`}
              paper={<DivisionDraftSheet record={record} assets={assets} />}
            />
          </div>
          <ActionButton
            className={`${buttonStyles.dark} w-full`}
            pending={finalize.pending}
            done={finalized.done}
            pendingLabel="Đang chốt và gửi thư…"
            doneLabel="Đã chốt"
            disabled={busy || recipientCount === 0 || !legalBasisConfirmed || !deviationReady}
            onClick={handleSend}
          >
            Chốt và gửi thư
          </ActionButton>
          <button
            type="button"
            className={compactButton.outline}
            disabled={busy || !dirty || selected.size === 0}
            onClick={() =>
              void save.execute(() => handoverRecordService.setLines(record.id, lines), apply)
            }
          >
            {save.pending ? "Đang lưu…" : "Lưu biên bản"}
          </button>
        </div>
        <p className="text-sm text-heritage-muted">
          {`Bấm "Chốt và gửi thư": hệ thống lưu và khóa nội dung biên bản, gửi thư mời cho ${recipientCount} người nhận để họ nộp căn cước, rồi mở bước ký.`}
        </p>
        {Object.keys(draftErrors).length > 0 && (
          <p role="alert" className="text-sm text-destructive">
            Thông tin người nhận chưa đủ hoặc chưa hợp lệ. Kiểm lại các ô báo lỗi ở mục B.
          </p>
        )}
        {(save.error || finalize.error) && (
          <p role="alert" className="text-sm text-destructive">
            {save.error || finalize.error}
          </p>
        )}
      </div>
    </SectionCard>
  );

  return columns(splitPanel, finalizePanel);
}
