import { compactButton, SectionCard } from "@/shared/ui/SectionCard";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Plus, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles, Notice } from "@/shared/ui/heritageKit";
import { caseCode } from "@/shared/lib/caseCode";
import { handoverRecordService } from "../api/handoverRecordService";
import type { HandoverRecord } from "../model/handoverRecord.schema";
import type { RecipientChange } from "../model/recipientChanges";
import {
  draftFromPerson,
  draftsFromReports,
  emptyRecipientDraft,
  skippedDeclarations,
  type RecipientDraft,
} from "../model/recipientDraft";
import { screenDifferences, SPLIT_DEVIATION_LABEL } from "../model/splitDifference";
import { handoverRecordKeys } from "../model/useHandoverRecord";
import { divisionAssets, pairsToLines, savedPairs } from "../model/divisionView";
import { DivisionDraftSheet } from "./DivisionDraftSheet";
import { PaperPreviewButton } from "./PaperPreviewButton";
import { RecipientDialog, type RecipientDialogState } from "./RecipientDialog";
import { RecipientSplitPanel } from "./RecipientSplitPanel";
import { SplitDeviationPanel } from "./SplitDeviationPanel";
import { SuggestedRecipients } from "./SuggestedRecipients";
import { ActionButton } from "@/shared/ui/ActionButton";
import { useSuccessHold } from "@/shared/lib/useSuccessHold";

/**
 * Bước 1 của luật sư: chọn ai nhận tài sản nào. Mỗi ô là một cặp người nhận - tài sản; một tài sản có thể
 * giao cho nhiều người (đồng thừa kế). Có thể lấy biên bản phân chia của Chủ tài sản làm bản đầu rồi sửa.
 * Người nhận chưa có trong danh sách thì thêm trong cửa sổ riêng (lưu ngay, sửa và xóa được trước khi phát hành).
 * Cách chia giữ trên màn hình tới khi bấm "Lưu nháp"; "Phát hành biên bản" lưu phần còn lại, chốt và gửi thư mời. Đã
 * chốt thì phải mở lại biên bản mới sửa.
 */
export function RecordLinesEditor({
  record,
  before,
  after,
}: {
  record: HandoverRecord;
  /** Việc làm trước khi chia (hồ sơ, giấy tờ), nằm đầu cột trái. */
  before?: ReactNode;
  /** Phần đính kèm, nằm cuối cột trái. */
  after?: ReactNode;
}) {
  const client = useQueryClient();
  const save = usePrivateAction();
  const split = usePrivateAction();
  const finalize = usePrivateAction();
  const finalized = useSuccessHold();
  const saved = useMemo(() => savedPairs(record), [record]);
  const [selected, setSelected] = useState<Set<string>>(saved);
  const dirty = selected.size !== saved.size || [...selected].some((key) => !saved.has(key));
  // Luật sư phải tick xác nhận căn cứ pháp lý mỗi lần chốt; state nằm trong component được remount theo revisionNo nên reopen sẽ bỏ tick.
  const [legalBasisConfirmed, setLegalBasisConfirmed] = useState(false);
  // Biên bản khác cách chia của Chủ tài sản thì phải tick thêm ô này; cũng bỏ tick mỗi khi nội dung đổi.
  const [splitDeviationConfirmed, setSplitDeviationConfirmed] = useState(false);
  // Người khai trong hồ sơ báo tin mà chưa có trong danh sách: phải thêm hoặc bỏ rồi mới phát hành.
  const [suggestions, setSuggestions] = useState<RecipientDraft[]>(() => draftsFromReports(record));
  const [dialog, setDialog] = useState<RecipientDialogState | null>(null);
  const [recipientNotice, setRecipientNotice] = useState("");
  // Đang có thay đổi chưa lưu thì so theo đúng màn hình; đã khớp bản lưu thì dùng kết quả Backend trả.
  let differences = record.splitDifferences;
  if (dirty) {
    differences = screenDifferences(record, selected);
  }
  const hasDeviation = differences.length > 0;
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

  // Đóng hoặc tải lại trang khi còn thay đổi chưa lưu thì trình duyệt hỏi lại.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const apply = (next: HandoverRecord) => {
    client.setQueryData(handoverRecordKeys.verifier(next.id), next);
    setSelected(savedPairs(next));
    setLegalBasisConfirmed(false);
    setSplitDeviationConfirmed(false);
    setRecipientNotice("");
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
  /** Thêm, sửa, xóa người nhận đã lưu trên máy chủ; giữ nguyên các thay đổi cách chia đang chờ lưu. */
  const applyRecipientChange = (change: RecipientChange) => {
    client.setQueryData(handoverRecordKeys.verifier(record.id), change.record);
    setSelected((current) => {
      const next = new Set<string>();
      for (const key of current) {
        if (key.split(":")[0] !== change.removedId) next.add(key);
      }
      for (const key of change.addedPairs) next.add(key);
      return next;
    });
    if (change.addedEmail !== "") {
      setSuggestions((current) =>
        current.filter((item) => item.email.trim().toLowerCase() !== change.addedEmail),
      );
    }
    let notice = "";
    if (change.linesUnsaved) {
      notice = "Đã thêm người nhận nhưng chưa lưu được tài sản được chia. Bấm “Lưu nháp” để lưu.";
    }
    setRecipientNotice(notice);
    setDialog(null);
    setLegalBasisConfirmed(false);
    setSplitDeviationConfirmed(false);
    void client.invalidateQueries({ queryKey: handoverRecordKeys.root });
  };
  const openPerson = (mode: "edit" | "remove", beneficiaryId: string) => {
    const person = record.availableRecipients.find((item) => item.beneficiaryId === beneficiaryId);
    if (person) setDialog({ mode, beneficiaryId, initial: draftFromPerson(person) });
  };
  /** Lưu phần chia còn dang dở rồi chốt; chốt xong Backend gửi thư mời. */
  const sendAll = async (): Promise<HandoverRecord> => {
    if (dirty) {
      const next = await handoverRecordService.setLines(record.id, pairsToLines(selected));
      client.setQueryData(handoverRecordKeys.verifier(record.id), next);
    }
    return handoverRecordService.finalize(record.id, splitDeviationConfirmed);
  };
  const handleSend = () => {
    void finalize.execute(() => finalized.hold(sendAll), apply);
  };
  const recipientCount = new Set([...selected].map((key) => key.split(":")[0])).size;

  // Làm tuần tự: giấy tờ ở mục A xét xong, có người được chấp nhận và kho đã khóa thì mới mở mục B, C và Chốt.
  const unlocked = !claimsPending && !noAccepted && record.vaultLocked;
  const columns = (main: ReactNode, side?: ReactNode) => (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
      <div className="min-w-0 space-y-5">
        {before}
        {main}
        {unlocked && after}
      </div>
      <div className="min-w-0 space-y-4 xl:sticky xl:top-6">{side}</div>
    </div>
  );

  if (record.availableAssets.length === 0) {
    return columns(
      <Notice tone="warning" title="Chưa đủ dữ liệu để lập biên bản">
        Không có tài sản nào.
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
      reasons.push("Tài sản chưa khóa: chấp nhận giấy tờ của ít nhất một yêu cầu trước khi chốt.");
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

  const assets = divisionAssets(record, selected);
  const dividedCount = assets.filter((asset) => asset.people.length > 0).length;

  const splitPanel = (
    <SectionCard
      title="B. Chia tài sản cho từng người"
      subtitle="Chia theo kết quả bạn đã xử lý ở ngoài hệ thống. Một tài sản có thể giao cho nhiều người."
      labelledBy="record-lines"
      collapsible
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
              {split.pending ? "Đang lấy…" : "Lấy theo Chủ tài sản"}
            </button>
          )}
          <button
            type="button"
            className={compactButton.dark}
            disabled={busy}
            onClick={() => setDialog({ mode: "add", initial: emptyRecipientDraft() })}
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
            Chủ tài sản chưa lập biên bản phân chia. Bạn tự lập biên bản.
          </p>
        )}
        {split.error && (
          <p role="alert" className="text-sm text-destructive">
            {split.error}
          </p>
        )}
        <SuggestedRecipients
          suggestions={suggestions}
          skipped={skippedDeclarations(record)}
          disabled={busy}
          onContinue={(suggestion) => setDialog({ mode: "add", initial: suggestion })}
          onDismiss={(key) =>
            setSuggestions((current) => current.filter((item) => item.key !== key))
          }
        />
        {recipientNotice !== "" && (
          <p role="alert" className="text-sm text-destructive">
            {recipientNotice}
          </p>
        )}
        <RecipientSplitPanel
          record={record}
          selected={selected}
          rejected={rejected}
          disabled={busy}
          onToggle={toggle}
          onEditPerson={(beneficiaryId) => openPerson("edit", beneficiaryId)}
          onRemovePerson={(beneficiaryId) => openPerson("remove", beneficiaryId)}
        />
        <SplitDeviationPanel differences={differences} />
        {dialog && (
          <RecipientDialog
            // Đổi từ sửa sang xóa hoặc mở người khác thì dựng lại cửa sổ, không giữ lỗi cũ.
            key={
              dialog.mode === "add" ? dialog.initial.key : `${dialog.mode}-${dialog.beneficiaryId}`
            }
            record={record}
            state={dialog}
            onAskRemove={() => {
              if (dialog.mode === "edit") openPerson("remove", dialog.beneficiaryId);
            }}
            onDone={applyRecipientChange}
            onClose={() => setDialog(null)}
          />
        )}
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
        {suggestions.length > 0 && (
          <p role="status" className="flex gap-2 text-sm text-heritage-danger">
            <X className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {`Còn ${suggestions.length} người trong hồ sơ báo tin chưa xử lý ở mục B: bấm “Nhập tiếp” hoặc “Bỏ”.`}
          </p>
        )}
        {recipientCount === 0 && (
          <p role="status" className="flex gap-2 text-sm text-heritage-danger">
            <X className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Chọn ít nhất một người nhận ở mục B.
          </p>
        )}
        {recipientCount > 0 && suggestions.length === 0 && (
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
            pendingLabel="Đang phát hành biên bản…"
            doneLabel="Đã phát hành"
            disabled={
              busy ||
              recipientCount === 0 ||
              suggestions.length > 0 ||
              !legalBasisConfirmed ||
              !deviationReady
            }
            onClick={handleSend}
          >
            Phát hành biên bản
          </ActionButton>
          <button
            type="button"
            className={compactButton.outline}
            disabled={busy || !dirty || selected.size === 0}
            onClick={() =>
              void save.execute(
                () => handoverRecordService.setLines(record.id, pairsToLines(selected)),
                apply,
              )
            }
          >
            {save.pending ? "Đang lưu…" : "Lưu nháp"}
          </button>
          {dirty && (
            <p role="status" className="text-center text-sm text-heritage-warning">
              Có thay đổi chưa lưu.
            </p>
          )}
        </div>
        <p className="text-sm text-heritage-muted">
          {`Bấm "Phát hành biên bản": hệ thống lưu và khóa nội dung biên bản, gửi thư mời cho ${recipientCount} người nhận để họ nộp căn cước, rồi mở bước ký.`}
        </p>
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
