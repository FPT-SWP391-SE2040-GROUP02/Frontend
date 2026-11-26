import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { formatIsoDate, formatLongDate, formatTimeOnDate } from "../lib/willDates";
import type {
  WillExecutorView,
  WillGapTarget,
  WillIdentityStatus,
  WillOwnerIdentityView,
  WillRecipientView,
} from "../model/willDocument.types";

export interface WillDocumentProps {
  /** Họ tên Chủ tài sản (Chủ tài sản). */
  ownerName: string;
  /** Email tài khoản LegacyVault của Chủ tài sản; bỏ trống thì mục I không nêu tài khoản. */
  ownerEmail?: string;
  /** Lúc Chủ tài sản ký (kích hoạt kế hoạch). Chưa có nghĩa là Chủ tài sản chưa ký. */
  signedAt?: string | null;
  /** Người thực thi hiện hành; null hoặc bỏ trống nghĩa là chưa có. */
  executor?: WillExecutorView | null;
  /**
   * Người nhận theo từng người. Bỏ trống khi Backend chưa trả: mục II khi đó dùng câu chung.
   */
  recipients?: WillRecipientView[];
  /** Số tài sản chưa gán cho ai (sẽ không được bàn giao); chỉ hiện khi biết `recipients`. */
  unassignedAssetCount?: number;
  /**
   * "owner": Chủ tài sản đang soạn, chỗ trống đỏ bấm được (khi có `onGapClick`).
   * "reader": chỉ đọc (Người thực thi xem trước, bản in), chỗ trống chỉ là chữ đỏ.
   */
  viewer?: "owner" | "reader";
  /** Chủ tài sản bấm vào một chỗ trống: nơi gọi đóng khung xem trước rồi đưa tới thẻ cần điền. */
  onGapClick?: (target: WillGapTarget) => void;
  /**
   * Tình trạng tải danh tính đầy đủ (ngày sinh, CCCD, thường trú). Mặc định "none": không hiện các dòng này
   * (Người thực thi xem lời mời không có dữ liệu này). "loading" hiện "Đang tải…", "error" ẩn các dòng.
   */
  identityStatus?: WillIdentityStatus;
  /** Danh tính Chủ tài sản khi `identityStatus` = "ready"; null nghĩa là chưa có danh tính eKYC gắn với kho. */
  ownerIdentity?: WillOwnerIdentityView | null;
}

const SECTION = "mt-7";
const HEADING = "mb-2 break-after-avoid text-[17px] font-bold";
const BODY = "text-justify leading-7";
const CELL = "border border-heritage-text/60 px-2.5 py-2 text-left align-top";
const CELL_NOTE = "block text-[15px] leading-6 text-heritage-muted";

/** Một dòng của bảng mục II: một tài sản kèm những người nhận tài sản đó (nhiều người là nhận chung). */
interface AssetRow {
  id: string;
  name: string;
  recipients: WillRecipientView[];
}

/** Đổi dữ liệu "người nhận → các tài sản" thành "tài sản → các người nhận", theo thứ tự xuất hiện. */
function buildAssetRows(recipients: WillRecipientView[]): AssetRow[] {
  const rows: AssetRow[] = [];
  for (const recipient of recipients) {
    for (const item of recipient.assets) {
      let found: AssetRow | null = null;
      for (const row of rows) {
        if (row.id === item.id) {
          found = row;
        }
      }
      if (found === null) {
        rows.push({ id: item.id, name: item.name, recipients: [recipient] });
      } else {
        found.recipients.push(recipient);
      }
    }
  }
  return rows;
}

/**
 * Chỗ còn thiếu: chữ đỏ. Chủ tài sản đang soạn (có `onGapClick`) thì là nút bấm được, kèm lời nhắc "bấm để điền".
 * Bản chỉ đọc và bản in chỉ hiện chữ đỏ.
 */
function Gap({
  text,
  target,
  clickable,
  onGapClick,
}: {
  text: string;
  target: WillGapTarget;
  clickable: boolean;
  onGapClick: ((target: WillGapTarget) => void) | undefined;
}) {
  if (!clickable || onGapClick === undefined) {
    return <span className="font-semibold text-heritage-danger">{text}</span>;
  }
  return (
    <button
      type="button"
      data-will-gap={target}
      onClick={() => onGapClick(target)}
      className="inline-flex min-h-8 cursor-pointer items-center rounded-md border border-dashed border-heritage-danger bg-heritage-danger-bg px-2.5 py-0.5 text-left text-sm font-semibold text-heritage-danger hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
    >
      {text} — bấm để điền
    </button>
  );
}

function InfoRows({ rows }: { rows: Array<[string, string]> }) {
  const nodes: ReactNode[] = [];
  for (const [label, value] of rows) {
    nodes.push(
      <div key={label} className="grid gap-x-4 leading-7 sm:grid-cols-[190px_minmax(0,1fr)]">
        <dt>{label}</dt>
        <dd className="break-words font-semibold">{value}</dd>
      </div>,
    );
  }
  return <dl>{nodes}</dl>;
}

function executorDisplayName(executor: WillExecutorView): string {
  if (executor.fullName) {
    return executor.fullName;
  }
  return executor.email;
}

/** Mục I: Chủ tài sản. Thêm ngày sinh, CCCD và thường trú khi đã tải danh tính đầy đủ. */
function OwnerSectionBlock({
  ownerName,
  ownerEmail,
  identityStatus,
  ownerIdentity,
}: {
  ownerName: string;
  ownerEmail?: string;
  identityStatus: WillIdentityStatus;
  ownerIdentity: WillOwnerIdentityView | null;
}) {
  const rows: Array<[string, string]> = [["Họ và tên", ownerName]];
  let missingNote: ReactNode = null;
  if (identityStatus === "loading") {
    rows.push(["Ngày sinh", "Đang tải…"]);
    rows.push(["Số CCCD", "Đang tải…"]);
    rows.push(["Nơi thường trú", "Đang tải…"]);
  }
  if (identityStatus === "ready") {
    if (ownerIdentity === null) {
      // Không bịa: chưa có eKYC thì không có CCCD hay thường trú để in.
      missingNote = (
        <p className="mb-2 text-sm font-semibold text-heritage-danger">
          Chưa có thông tin CCCD và nơi thường trú của Chủ tài sản (chưa có danh tính eKYC).
        </p>
      );
    } else {
      let birthText = formatIsoDate(ownerIdentity.dateOfBirth);
      if (birthText === null) {
        birthText = ownerIdentity.dateOfBirth;
      }
      rows.push(["Ngày sinh", birthText]);
      rows.push(["Số CCCD", ownerIdentity.citizenId]);
      rows.push(["Nơi thường trú", ownerIdentity.residenceAddress]);
    }
  }
  if (ownerEmail) {
    rows.push(["Tài khoản LegacyVault", ownerEmail]);
  }
  return (
    <section id="muc-1" className={SECTION}>
      <h3 className={HEADING}>I. Chủ tài sản</h3>
      <InfoRows rows={rows} />
      {missingNote}
      <p className={`${BODY} mt-2`}>
        Nay trong trạng thái tinh thần hoàn toàn minh mẫn, sáng suốt, không bị bất kỳ sự lừa dối, đe
        dọa hoặc cưỡng ép nào, tôi lập biên bản phân chia này để định đoạt các tài sản số của tôi
        tại LegacyVault sau khi tôi qua đời như sau:
      </p>
    </section>
  );
}

/** Dòng "Sinh dd/mm/yyyy · CCCD số" dưới tên một người nhận; rỗng khi không dùng danh tính hoặc tải lỗi. */
function RecipientIdentityLine({
  recipient,
  identityStatus,
}: {
  recipient: WillRecipientView;
  identityStatus: WillIdentityStatus;
}) {
  if (identityStatus === "loading") {
    return <small className={CELL_NOTE}>Đang tải…</small>;
  }
  if (identityStatus !== "ready") {
    return null;
  }
  const birthText = formatIsoDate(recipient.dateOfBirth);
  if (birthText === null || !recipient.citizenId) {
    return <small className={CELL_NOTE}>Chưa có thông tin ngày sinh và CCCD</small>;
  }
  return (
    <small className={CELL_NOTE}>
      Sinh {birthText} · CCCD {recipient.citizenId}
    </small>
  );
}

/** Mục II: bảng tài sản và người nhận. Ghi tên từng tài sản, không ghi nội dung. Tài sản nhận chung có nhiều người. */
function AssetsSectionBlock({
  recipients,
  unassignedAssetCount,
  identityStatus,
}: {
  recipients: WillRecipientView[] | undefined;
  unassignedAssetCount: number;
  identityStatus: WillIdentityStatus;
}) {
  const heading = <h3 className={HEADING}>II. Tài sản và định đoạt tài sản</h3>;
  if (recipients === undefined) {
    return (
      <section id="muc-2" className={SECTION}>
        {heading}
        <p className={BODY}>
          Các tài sản được để lại cho những người nhận tôi đã chọn, nếu có. Phần chưa chọn người
          nhận do luật sư xác định khi bàn giao. Biên bản phân chia không ghi nội dung tài sản.
        </p>
      </section>
    );
  }
  const assetRows = buildAssetRows(recipients);
  if (assetRows.length === 0) {
    return (
      <section id="muc-2" className={SECTION}>
        {heading}
        <p className={BODY}>
          Tôi chưa chọn người nhận cho tài sản nào. Người nhận do luật sư xác định khi bàn giao,
          theo giấy tờ hợp lệ.
        </p>
      </section>
    );
  }
  const rowNodes: ReactNode[] = [];
  let order = 0;
  for (const row of assetRows) {
    order = order + 1;
    const people: ReactNode[] = [];
    for (const person of row.recipients) {
      people.push(
        <div key={person.id} className="mb-1.5 last:mb-0">
          <span className="font-semibold">{person.fullName}</span>
          <RecipientIdentityLine recipient={person} identityStatus={identityStatus} />
        </div>,
      );
    }
    const recipientCell = <div>{people}</div>;
    let sharedNote: ReactNode = null;
    if (row.recipients.length > 1) {
      sharedNote = <small className={CELL_NOTE}>Nhận chung, {row.recipients.length} người</small>;
    }
    rowNodes.push(
      <tr key={row.id} className="break-inside-avoid">
        <td className={CELL}>{order}</td>
        <td className={CELL}>
          {row.name}
          {sharedNote}
        </td>
        <td className={CELL}>{recipientCell}</td>
      </tr>,
    );
  }
  let outsideNote: ReactNode = null;
  if (unassignedAssetCount > 0) {
    outsideNote = (
      <p className="mt-2 text-[15px] text-heritage-muted">
        Còn {unassignedAssetCount} tài sản chưa chọn người nhận; luật sư xác định người nhận khi bàn
        giao.
      </p>
    );
  }
  return (
    <section id="muc-2" className={SECTION}>
      {heading}
      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th scope="col" className={`w-14 ${CELL}`}>
                STT
              </th>
              <th scope="col" className={CELL}>
                Tài sản
              </th>
              <th scope="col" className={CELL}>
                Người nhận
              </th>
            </tr>
          </thead>
          <tbody>{rowNodes}</tbody>
        </table>
      </div>
      <p className={`${BODY} mt-2.5`}>
        Ngoài những người nêu trên, tôi không để lại các tài sản này cho bất cứ ai khác.
      </p>
      {outsideNote}
    </section>
  );
}

/** Mục III: Người thực thi. */
function ExecutorSectionBlock({
  executor,
  clickable,
  onGapClick,
}: {
  executor: WillExecutorView | null;
  clickable: boolean;
  onGapClick: ((target: WillGapTarget) => void) | undefined;
}) {
  let who: ReactNode;
  if (executor === null) {
    who = (
      <Gap
        text="Chưa chọn Người thực thi"
        target="executor"
        clickable={clickable}
        onGapClick={onGapClick}
      />
    );
  } else {
    let identity: ReactNode = <strong>{executor.email}</strong>;
    if (executor.fullName) {
      identity = (
        <>
          <strong>{executor.fullName}</strong>, email <strong>{executor.email}</strong>
        </>
      );
    }
    let pendingNote: ReactNode = null;
    if (!executor.signedAt) {
      pendingNote = <i className="text-sm text-heritage-muted"> (chờ chấp nhận)</i>;
    }
    who = (
      <>
        {identity}
        {pendingNote}
      </>
    );
  }
  return (
    <section id="muc-3" className={SECTION}>
      <h3 className={HEADING}>III. Người thực thi</h3>
      <p className={BODY}>
        Tôi chọn {who}, nhân viên LegacyVault, làm Người thực thi. Sau khi tôi qua đời, người này
        giữ hộ tài sản, ký biên bản bàn giao do luật sư lập, gửi mã nhận cho từng người nhận khi
        phần của người đó đủ chữ ký và ký phiếu giao nhận. Người này không được xem nội dung tài
        sản, không tự chia, bán hay cho tài sản, không tự đổi người nhận hay phần được nhận.
      </p>
      <p className={`${BODY} mt-2`}>
        Người thực thi được xem biên bản này trước khi ký, được từ chối nhận vai và được đồng ý hoặc
        không đồng ý mỗi khi tôi ký phiên bản mới. Người thực thi không chịu trách nhiệm về tranh
        chấp giữa những người nhận và không phải ứng tiền riêng cho việc bàn giao.
      </p>
    </section>
  );
}

/** Một ô chữ ký như trên giấy: chức danh, dòng trạng thái ký rồi tên người ký. */
function SignatureBox({
  title,
  name,
  statusText,
  signed,
}: {
  title: string;
  name: string;
  statusText: string;
  signed: boolean;
}) {
  let statusStyle = "text-heritage-muted";
  let mark: ReactNode = null;
  if (signed) {
    statusStyle = "text-heritage-success font-semibold";
    mark = <Check className="mr-1 inline size-4 align-text-bottom" aria-hidden="true" />;
  }
  return (
    <div className="text-center">
      <p className="font-bold">{title}</p>
      <p className={`flex min-h-20 items-center justify-center py-3 text-[15px] ${statusStyle}`}>
        <span>
          {mark}
          {statusText}
        </span>
      </p>
      <p className="break-words font-bold">{name}</p>
    </div>
  );
}

function SignatureBlock({
  ownerName,
  signedAt,
  executor,
}: {
  ownerName: string;
  signedAt: string | null;
  executor: WillExecutorView | null;
}) {
  const ownerWhen = formatTimeOnDate(signedAt);
  let ownerStatus = "Chờ Chủ tài sản ký";
  if (ownerWhen !== null) {
    ownerStatus = `Đã ký điện tử · ${ownerWhen}`;
  }

  let executorName = "…";
  let executorStatus = "Chờ Người thực thi nhận vai";
  let executorSigned = false;
  let confirmName = "Người thực thi";
  if (executor !== null) {
    executorName = executorDisplayName(executor);
    confirmName = executorName;
    const executorWhen = formatTimeOnDate(executor.signedAt);
    if (executorWhen !== null) {
      executorStatus = `Đã ký điện tử · ${executorWhen}`;
      executorSigned = true;
    }
  }

  return (
    <div className="mt-10 grid break-inside-avoid grid-cols-2 items-start gap-8 max-[480px]:grid-cols-1">
      <SignatureBox
        title="Chủ tài sản"
        name={ownerName}
        statusText={ownerStatus}
        signed={ownerWhen !== null}
      />
      <div>
        <SignatureBox
          title="Người thực thi"
          name={executorName}
          statusText={executorStatus}
          signed={executorSigned}
        />
        <p className="mt-2 text-center text-[15px] leading-6">
          Tôi, {confirmName}, xác nhận đã nhận vai trò và phạm vi nhiệm vụ nêu tại mục III.
        </p>
      </div>
    </div>
  );
}

/**
 * Biên bản phân chia số của một kho, sinh từ dữ liệu kế hoạch bàn giao: quốc hiệu, tiêu đề, bốn mục I đến IV, hai ô chữ ký
 * ngang hàng và câu lưu ý. Có tên tài sản và người nhận, không có nội dung tài sản hay lời nhắn.
 *
 * Dùng chung cho khung xem trước của Chủ tài sản (viewer "owner", chỗ trống đỏ bấm được), bản Người thực thi xem và bản
 * in (viewer "reader"). Hai chữ ký lấy từ dữ liệu thật: Chủ tài sản ký khi kích hoạt kế hoạch, Người thực
 * thi ký khi nhận lời mời; component không tự suy ra chữ ký.
 */
export function WillDocument({
  ownerName,
  ownerEmail,
  signedAt = null,
  executor = null,
  recipients,
  unassignedAssetCount = 0,
  viewer = "reader",
  onGapClick,
  identityStatus = "none",
  ownerIdentity = null,
}: WillDocumentProps) {
  const clickable = viewer === "owner";

  const signedDate = formatLongDate(signedAt);
  let dateText = "… tháng … năm … (điền tự động khi Chủ tài sản ký)";
  if (viewer === "owner") {
    dateText = "… tháng … năm … (điền tự động khi bạn ký)";
  }
  if (signedDate !== null) {
    dateText = signedDate;
  }

  return (
    // Văn bản pháp lý dùng Times New Roman như biên bản bàn giao; áp cho cả khung xem trước và bản in.
    <div
      className="text-[17px] text-heritage-text"
      style={{ fontFamily: '"Times New Roman", Times, serif' }}
    >
      <header className="text-center leading-7">
        <p className="font-bold tracking-[0.02em]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
        <p className="inline-block border-b border-heritage-text pb-1 font-semibold">
          Độc lập – Tự do – Hạnh phúc
        </p>
      </header>
      <h2 className="mt-6 text-center text-[26px] font-bold leading-[1.3] tracking-[0.08em]">
        BIÊN BẢN PHÂN CHIA
      </h2>
      <p className="mt-3 text-center leading-7">Hôm nay, ngày {dateText}, tại LegacyVault.</p>

      <OwnerSectionBlock
        ownerName={ownerName}
        ownerEmail={ownerEmail}
        identityStatus={identityStatus}
        ownerIdentity={ownerIdentity}
      />
      <AssetsSectionBlock
        recipients={recipients}
        unassignedAssetCount={unassignedAssetCount}
        identityStatus={identityStatus}
      />
      <ExecutorSectionBlock executor={executor} clickable={clickable} onGapClick={onGapClick} />

      <section id="muc-4" className={SECTION}>
        <h3 className={HEADING}>IV. Hiệu lực, sửa đổi và thu hồi</h3>
        <p className={BODY}>
          Biên bản phân chia này chỉ ghi lại mong muốn của tôi, không phải giấy tờ pháp lý. Việc bàn
          giao chỉ làm theo biên bản bàn giao do luật sư lập và ba bên ký. Khi còn sống, tôi có
          quyền sửa đổi, đổi Người thực thi hoặc thu hồi biên bản phân chia này bất cứ lúc nào.
        </p>
      </section>

      <SignatureBlock ownerName={ownerName} signedAt={signedAt} executor={executor} />
      <p className="mt-8 border-t border-heritage-border pt-3 text-[15px] italic leading-6 text-heritage-muted">
        Chữ ký điện tử được xác thực qua tài khoản LegacyVault; chi tiết trong nhật ký ký. Đây là
        chỉ dẫn bàn giao dữ liệu số, không thay thế di chúc theo quy định của pháp luật dân sự.
      </p>
    </div>
  );
}
