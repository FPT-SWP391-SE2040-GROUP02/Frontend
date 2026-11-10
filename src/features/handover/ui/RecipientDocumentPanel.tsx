import { useId, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CircleCheck, CircleX, TriangleAlert } from "lucide-react";
import {
  DocumentSignatureBox,
  HandoverDocumentDetail,
  HandoverDocumentText,
  SlidePanel,
  SlideToggle,
  formatDocumentDate,
  handoverDocumentKeys,
  handoverDocumentService,
  useTurnDocument,
  type DocumentKind,
  type HandoverDocument,
} from "@/entities/handoverDocument";
import { buttonStyles, Chip } from "@/shared/ui/heritageKit";
import { handoverService } from "../api/handoverService";
import {
  MAX_RESIDENCE_ADDRESS_LENGTH,
  submissionFormError,
  type SubmissionDraft,
} from "../model/submissionForm";
import { useHandoverAction } from "../model/useHandoverAction";
import { HandoverTerms } from "./HandoverTerms";
import { ImagePicker } from "./ImagePicker";

const FIELD =
  "h-11 w-full rounded-xl border border-[#E0C486] bg-[#FFF6D8] px-3 text-sm font-semibold text-heritage-primary outline-none focus-visible:ring-2 focus-visible:ring-heritage-gold/40";

function ChoiceButton({
  onClick,
  tone,
  icon,
  title,
  disabled,
}: {
  onClick: () => void;
  tone: "accept" | "decline";
  icon: ReactNode;
  title: string;
  disabled: boolean;
}) {
  const color =
    tone === "accept"
      ? "border-[#2E9E6E] text-[#1F7A55] hover:bg-[#F3FAF6]"
      : "border-[#A32119] text-[#A32119] hover:bg-[#FDF3F1]";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 bg-white px-4 text-base font-semibold transition-colors disabled:opacity-60 ${color}`}
    >
      {icon}
      {title}
    </button>
  );
}

function ErrorLine({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-xl bg-[#F8E1DE] px-4 py-3 text-sm text-[#A32119]">
      {message}
    </p>
  );
}

/**
 * Bước chọn: Chấp nhận hoặc Từ chối. Chọn xong biên bản được tạo ngay với Phần 1 chép sẵn từ hồ sơ chứng tử;
 * chưa nộp hồ sơ thì vẫn đổi lựa chọn được, nên chưa có gì không hoàn tác được ở bước này.
 */
function ChoiceStep({
  turnId,
  groupName,
  onCreated,
}: {
  turnId: string;
  groupName: string;
  onCreated: () => void;
}) {
  const action = useHandoverAction();
  const choose = (kind: DocumentKind) => {
    void action.execute(() => handoverDocumentService.create(turnId, kind), onCreated);
  };
  return (
    <div className="space-y-4">
      <HandoverTerms groupName={groupName} />
      <div className="grid gap-3 sm:grid-cols-2">
        <ChoiceButton
          tone="accept"
          title="Tôi chấp nhận"
          disabled={action.pending}
          icon={<CircleCheck className="size-5" aria-hidden="true" />}
          onClick={() => choose("ACCEPT")}
        />
        <ChoiceButton
          tone="decline"
          title="Tôi từ chối"
          disabled={action.pending}
          icon={<CircleX className="size-5" aria-hidden="true" />}
          onClick={() => choose("DECLINE")}
        />
      </div>
      <p className="text-sm text-heritage-muted">
        Chọn xong bạn xem thông tin về Chủ kho (đã có sẵn từ hồ sơ chứng tử), rồi điền thông tin của
        mình và ký. Chưa gửi gì tới khi bạn bấm ký; bạn vẫn đổi được lựa chọn.
      </p>
      {action.error && !action.pending && <ErrorLine message={action.error} />}
    </div>
  );
}

function dateText(value: string | null): string {
  return value ? formatDocumentDate(value) : "";
}

function Part1Summary({ document }: { document: HandoverDocument }) {
  const { owner } = document;
  const missing = "Chưa có trong hồ sơ chứng tử";
  // Nơi thường trú lấy từ danh tính eKYC của Chủ kho, không từ hồ sơ chứng tử, nên khi trống nói đúng nguồn.
  const rows: Array<[string, string, string]> = [
    ["Họ tên Chủ kho", owner.fullName, missing],
    ["Nơi thường trú", owner.residenceAddress, "Chủ kho chưa xác minh danh tính"],
    ["Gói di sản", `${document.containerName} (gồm ${document.itemCount} mục)`, missing],
    ["Ngày mất", dateText(owner.dateOfDeath), missing],
    ["Số giấy chứng tử", owner.certificateNumber, missing],
    ["Ngày cấp, đăng ký khai tử", dateText(owner.certificateIssuedOn), missing],
  ];
  return (
    <dl className="border-t border-heritage-border">
      {rows.map(([label, value, empty]) => (
        <div
          key={label}
          className="grid gap-1 border-b border-heritage-border py-2 text-sm sm:grid-cols-[minmax(8rem,12rem)_minmax(0,1fr)] sm:gap-4"
        >
          <dt className="text-heritage-muted">{label}</dt>
          <dd className={value ? "font-semibold" : "text-heritage-muted"}>{value || empty}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Dòng nhắc lựa chọn hiện tại và nút đổi sang lựa chọn kia, chỉ khi người nhận chưa nộp hồ sơ lần nào. */
function KindBar({
  turnId,
  kind,
  canSwitch,
  onSwitched,
}: {
  turnId: string;
  kind: DocumentKind;
  canSwitch: boolean;
  onSwitched: () => void;
}) {
  const action = useHandoverAction();
  const other: DocumentKind = kind === "ACCEPT" ? "DECLINE" : "ACCEPT";
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-heritage-border bg-white px-4 py-3 text-sm">
        <p>
          Bạn đang chọn <b>{kind === "ACCEPT" ? "chấp nhận" : "từ chối"}</b> phần di sản này.
        </p>
        {canSwitch && (
          <button
            type="button"
            className={buttonStyles.outline}
            disabled={action.pending}
            onClick={() =>
              void action.execute(() => handoverDocumentService.create(turnId, other), onSwitched)
            }
          >
            {action.pending
              ? "Đang đổi…"
              : `Đổi sang ${other === "ACCEPT" ? "chấp nhận" : "từ chối"}`}
          </button>
        )}
      </div>
      {action.error && !action.pending && <ErrorLine message={action.error} />}
    </div>
  );
}

/** Đến lượt người nhận: xem Phần 1 đã chép sẵn, điền Phần 2, nộp ảnh căn cước rồi ký. Họ tên điền sẵn theo tài khoản. */
function RecipientPartForm({
  turnId,
  document,
  onDone,
}: {
  turnId: string;
  document: HandoverDocument;
  onDone: () => void;
}) {
  const decline = document.kind === "DECLINE";
  const action = useHandoverAction();
  const textId = useId();
  const [fullText, setFullText] = useState(false);
  const [draft, setDraft] = useState<SubmissionDraft>({
    kind: document.kind,
    fullName: document.recipient.fullName,
    citizenId: "",
    dateOfBirth: "",
    residenceAddress: document.recipient.residenceAddress,
    front: null,
    back: null,
    acknowledged: false,
    voluntaryDecline: false,
  });
  const [touched, setTouched] = useState(false);
  const set = <K extends keyof SubmissionDraft>(key: K, value: SubmissionDraft[K]) =>
    setDraft((previous) => ({ ...previous, [key]: value }));
  // Ô tick ký cũng là lời xác nhận tự nguyện từ chối, vì câu ký đã nêu rõ không nhằm trốn tránh nghĩa vụ tài sản.
  const toSend: SubmissionDraft = {
    ...draft,
    kind: document.kind,
    voluntaryDecline: decline && draft.acknowledged,
  };
  const error = submissionFormError(toSend);
  const submit = () => {
    setTouched(true);
    if (error) return;
    void action.execute(() => handoverService.submitSubmission(turnId, toSend), onDone);
  };
  return (
    <div className="space-y-4">
      {document.supplementReason && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-[#F8E1DE] px-4 py-3 text-sm text-[#A32119]"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            <b>Người xét duyệt yêu cầu bổ sung:</b> {document.supplementReason}. Hãy sửa rồi ký lại.
          </span>
        </div>
      )}
      <KindBar
        turnId={turnId}
        kind={document.kind}
        canSwitch={!document.supplementReason}
        onSwitched={onDone}
      />
      <section className="space-y-2">
        <h3 className="font-semibold text-heritage-primary">
          Phần 1 · Thông tin người để lại di sản
        </h3>
        <p className="text-sm text-heritage-muted">
          Lấy từ hồ sơ chứng tử mà Người xét duyệt đã duyệt, bạn không sửa được.
        </p>
        <Part1Summary document={document} />
      </section>
      <section className="space-y-3">
        <h3 className="font-semibold text-heritage-primary">Phần 2 · Thông tin của bạn</h3>
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
            <span className="block text-xs font-normal text-heritage-muted">Chỉ lưu năm sinh</span>
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
            <span className="block text-xs font-normal text-heritage-muted">Chỉ lưu 4 số cuối</span>
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
          <span className="block text-xs font-normal text-heritage-muted">
            Ghi đúng như trên căn cước; Người xét duyệt sẽ đối chiếu với ảnh căn cước
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
        <p className="text-xs text-heritage-muted">
          Ảnh căn cước chỉ để đối chiếu, xóa ngay khi biên bản hoàn tất.
        </p>
      </section>
      <section className="space-y-2">
        <SlideToggle controls={textId} open={fullText} onToggle={() => setFullText((v) => !v)}>
          {fullText ? "Ẩn toàn văn biên bản" : "Đọc toàn văn biên bản trước khi ký"}
        </SlideToggle>
        <SlidePanel id={textId} open={fullText}>
          <div className="max-h-[50vh] overflow-y-auto pt-1">
            <HandoverDocumentText document={document} blank />
          </div>
        </SlidePanel>
      </section>
      <section className="space-y-3">
        <h3 className="font-semibold text-heritage-primary">Ký và gửi</h3>
        <DocumentSignatureBox
          role="recipient"
          kind={document.kind}
          idPrefix="recipient-sign"
          checked={draft.acknowledged}
          onCheckedChange={(checked) => set("acknowledged", checked)}
          error={touched ? error : null}
          pending={action.pending}
          buttonLabel="Ký và gửi cho Người xét duyệt"
          onSubmit={submit}
        />
        {action.error && !action.pending && <ErrorLine message={action.error} />}
      </section>
    </div>
  );
}

function Waiting({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-2xl border border-heritage-border bg-white p-5">
      <p className="flex flex-wrap items-center gap-2 font-semibold text-heritage-primary">
        {title}
        <Chip tone="neutral">Chưa xong</Chip>
      </p>
      <div className="space-y-3 text-sm leading-6 text-heritage-muted">{children}</div>
    </div>
  );
}

/**
 * Bước biên bản của người nhận (lượt ở bước xác minh danh tính): chọn Chấp nhận hoặc Từ chối, xem Phần 1 về Chủ kho (đã chép
 * sẵn từ hồ sơ chứng tử), điền Phần 2 và ký, rồi chờ Người xét duyệt kiểm tra thủ công. Không có hạn chót ở bước nào: mỗi bước
 * chờ tới khi người của bước đó làm xong. Người xét duyệt gửi xong thì lượt kết thúc và cổng chuyển sang màn tải tài sản.
 */
export function RecipientDocumentPanel({
  turnId,
  groupName,
  onChanged,
}: {
  turnId: string;
  groupName: string;
  /** Gọi sau mỗi bước đã gửi để cổng tải lại lượt. */
  onChanged: () => void;
}) {
  const client = useQueryClient();
  const query = useTurnDocument(turnId);

  if (query.isPending) return <p role="status">Đang tải biên bản của bạn…</p>;
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p className="text-sm text-[#A32119]">Không tải được biên bản của bạn.</p>
        <button type="button" className={buttonStyles.outline} onClick={() => void query.refetch()}>
          Thử lại
        </button>
      </div>
    );
  }
  const refresh = () => {
    void client.invalidateQueries({ queryKey: handoverDocumentKeys.all });
    onChanged();
  };
  const document = query.data;

  if (document === null) {
    return <ChoiceStep turnId={turnId} groupName={groupName} onCreated={refresh} />;
  }
  if (document.status === "WAIT_RECIPIENT") {
    return (
      <RecipientPartForm key={document.kind} turnId={turnId} document={document} onDone={refresh} />
    );
  }
  return (
    <Waiting title="Đã gửi cho Người xét duyệt">
      <p>
        Bạn đã ký, Người xét duyệt đang kiểm tra thủ công.{" "}
        {document.kind === "ACCEPT"
          ? "Xong sẽ mở tải tài sản và báo qua email."
          : "Xong sẽ ghi nhận việc từ chối và báo qua email."}
      </p>
      <HandoverDocumentDetail document={document} />
    </Waiting>
  );
}
