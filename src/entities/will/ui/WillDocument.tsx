import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { formatIsoDate, formatLongDate, formatTimeOnDate } from "../lib/willDates";
import type {
  WillExecutorView,
  WillGapTarget,
  WillIdentityStatus,
  WillOwnerIdentityView,
  WillPackageView,
  WillRecipientView,
  WillVersionView,
} from "../model/willDocument.types";

export interface WillDocumentProps {
  /** Họ tên Chủ kho (Chủ kho). */
  ownerName: string;
  /** Email tài khoản LegacyVault của Chủ kho; bỏ trống thì mục I không nêu tài khoản. */
  ownerEmail?: string;
  /** Lúc Chủ kho ký (kích hoạt kế hoạch). Chưa có nghĩa là Chủ kho chưa ký. */
  signedAt?: string | null;
  /** Người thực thi hiện hành; null hoặc bỏ trống nghĩa là chưa có. */
  executor?: WillExecutorView | null;
  /**
   * Người nhận theo từng người. Bỏ trống khi nơi xem không có dữ liệu này (ví dụ Người thực thi xem lời mời):
   * mục II khi đó dùng câu chung.
   */
  recipients?: WillRecipientView[];
  /** Các gói chưa có người nhận; chỉ hiện khi biết `recipients`. */
  unassignedPackages?: WillPackageView[];
  /** Số tài sản chưa nằm trong gói nào (sẽ không được bàn giao). */
  assetsOutsideCount?: number;
  /**
   * "owner": Chủ kho đang soạn, chỗ trống đỏ bấm được (khi có `onGapClick`).
   * "reader": chỉ đọc (Người thực thi xem trước, bản in), chỗ trống chỉ là chữ đỏ.
   */
  viewer?: "owner" | "reader";
  /** Chủ kho bấm vào một chỗ trống: nơi gọi đóng khung xem trước rồi đưa tới thẻ cần điền. */
  onGapClick?: (target: WillGapTarget) => void;
  /**
   * Tình trạng tải danh tính đầy đủ (ngày sinh, CCCD, thường trú). Mặc định "none": không hiện các dòng này
   * (Người thực thi xem lời mời không có dữ liệu này). "loading" hiện "Đang tải…", "error" ẩn các dòng.
   */
  identityStatus?: WillIdentityStatus;
  /** Danh tính Chủ kho khi `identityStatus` = "ready"; null nghĩa là chưa có danh tính eKYC gắn với kho. */
  ownerIdentity?: WillOwnerIdentityView | null;
  /** Phiên bản đã ký gần nhất; bỏ trống thì không in dòng phiên bản. */
  version?: WillVersionView | null;
}

const SECTION = "mt-7";
const HEADING = "mb-2 text-base font-semibold text-heritage-primary";
const BODY = "max-w-[68ch] leading-7";

/** Một dòng của bảng mục II: một gói kèm những người được nhận gói đó (rỗng nghĩa là gói chưa có người nhận). */
interface PackageRow {
  id: string;
  name: string;
  assetCount: number;
  recipients: WillRecipientView[];
}

/** Đổi dữ liệu "người nhận → các gói" thành "gói → các người nhận"; gói chưa có người nhận xếp sau cùng. */
function buildPackageRows(
  recipients: WillRecipientView[],
  unassignedPackages: WillPackageView[],
): PackageRow[] {
  const rows: PackageRow[] = [];
  for (const recipient of recipients) {
    for (const item of recipient.packages) {
      let found: PackageRow | null = null;
      for (const row of rows) {
        if (row.id === item.id) {
          found = row;
        }
      }
      if (found === null) {
        rows.push({
          id: item.id,
          name: item.name,
          assetCount: item.assetCount,
          recipients: [recipient],
        });
      } else {
        found.recipients.push(recipient);
      }
    }
  }
  for (const item of unassignedPackages) {
    rows.push({ id: item.id, name: item.name, assetCount: item.assetCount, recipients: [] });
  }
  return rows;
}

/**
 * Chỗ còn thiếu: chữ đỏ. Chủ kho đang soạn (có `onGapClick`) thì là nút bấm được, kèm lời nhắc "bấm để điền".
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
      <div key={label} className="grid gap-x-4 sm:grid-cols-[150px_minmax(0,1fr)]">
        <dt className="text-sm text-heritage-muted">{label}</dt>
        <dd className="mb-2 break-words font-medium sm:mb-1.5">{value}</dd>
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

/** Mục I: Chủ kho. Thêm ngày sinh, CCCD và thường trú khi đã tải danh tính đầy đủ. */
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
          Chưa có thông tin CCCD và nơi thường trú của Chủ kho (chưa có danh tính eKYC).
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
      <h3 className={HEADING}>I. Chủ kho</h3>
      <InfoRows rows={rows} />
      {missingNote}
      <p className={`${BODY} mt-2`}>
        Nay trong trạng thái tinh thần hoàn toàn minh mẫn, sáng suốt, không bị bất kỳ sự lừa dối, đe
        dọa hoặc cưỡng ép nào, tôi lập biên bản phân chia này để định đoạt các gói tài sản số trong kho
        của tôi tại LegacyVault sau khi tôi qua đời như sau:
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
    return <small className="block text-heritage-muted">Đang tải…</small>;
  }
  if (identityStatus !== "ready") {
    return null;
  }
  const birthText = formatIsoDate(recipient.dateOfBirth);
  if (birthText === null || !recipient.citizenId) {
    return <small className="block text-heritage-muted">Chưa có thông tin ngày sinh và CCCD</small>;
  }
  return (
    <small className="block text-heritage-muted">
      Sinh {birthText} · CCCD {recipient.citizenId}
    </small>
  );
}

/** Mục II: bảng gói tài sản và người nhận. Chỉ ghi tên gói và số tài sản, không ghi tên từng tài sản. */
function AssetsSectionBlock({
  recipients,
  unassignedPackages,
  assetsOutsideCount,
  clickable,
  onGapClick,
  identityStatus,
}: {
  recipients: WillRecipientView[] | undefined;
  unassignedPackages: WillPackageView[];
  assetsOutsideCount: number;
  clickable: boolean;
  onGapClick: ((target: WillGapTarget) => void) | undefined;
  identityStatus: WillIdentityStatus;
}) {
  const heading = <h3 className={HEADING}>II. Tài sản và định đoạt tài sản</h3>;
  if (recipients === undefined) {
    return (
      <section id="muc-2" className={SECTION}>
        {heading}
        <p className={BODY}>
          Các gói tài sản trong kho được để lại cho những người nhận mà tôi đã chỉ định cho từng gói
          trong kế hoạch bàn giao. Biên bản phân chia chỉ ghi tên gói, không ghi tên hay nội dung tài
          sản.
        </p>
      </section>
    );
  }
  const packageRows = buildPackageRows(recipients, unassignedPackages);
  if (packageRows.length === 0) {
    return (
      <section id="muc-2" className={SECTION}>
        {heading}
        <p>
          <Gap
            text="Chưa có gói và người nhận"
            target="packages"
            clickable={clickable}
            onGapClick={onGapClick}
          />
        </p>
      </section>
    );
  }
  const rowNodes: ReactNode[] = [];
  let order = 0;
  for (const row of packageRows) {
    order = order + 1;
    let recipientCell: ReactNode;
    if (row.recipients.length === 0) {
      recipientCell = (
        <Gap
          text="Chưa có người nhận"
          target="packages"
          clickable={clickable}
          onGapClick={onGapClick}
        />
      );
    } else {
      const people: ReactNode[] = [];
      for (const person of row.recipients) {
        people.push(
          <div key={person.id} className="mb-1.5 last:mb-0">
            <span className="font-semibold">{person.fullName}</span>
            <RecipientIdentityLine recipient={person} identityStatus={identityStatus} />
          </div>,
        );
      }
      recipientCell = <div>{people}</div>;
    }
    rowNodes.push(
      <tr key={row.id}>
        <td className="border border-heritage-border px-2.5 py-2 align-top">{order}</td>
        <td className="border border-heritage-border px-2.5 py-2 align-top">
          {row.name}
          <br />
          <small className="text-heritage-muted">{row.assetCount} tài sản</small>
        </td>
        <td className="border border-heritage-border px-2.5 py-2 align-top">{recipientCell}</td>
      </tr>,
    );
  }
  let outsideNote: ReactNode = null;
  if (assetsOutsideCount > 0) {
    outsideNote = (
      <p className="mt-2 text-sm text-heritage-muted">
        Còn {assetsOutsideCount} tài sản chưa nằm trong gói nào nên sẽ không được bàn giao.
      </p>
    );
  }
  return (
    <section id="muc-2" className={SECTION}>
      {heading}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[15px]">
          <thead>
            <tr>
              <th scope="col" className="w-12 border border-heritage-border px-2.5 py-2 text-left">
                STT
              </th>
              <th scope="col" className="border border-heritage-border px-2.5 py-2 text-left">
                Gói tài sản
              </th>
              <th scope="col" className="border border-heritage-border px-2.5 py-2 text-left">
                Người nhận
              </th>
            </tr>
          </thead>
          <tbody>{rowNodes}</tbody>
        </table>
      </div>
      <p className={`${BODY} mt-2.5`}>
        Ngoài những người nêu trên, tôi không để lại các gói tài sản này cho bất cứ ai khác.
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
        Tôi đề cử {who} làm Người thực thi. Đây chỉ là đề cử: sau khi tôi qua đời, người này mở bàn
        giao trên hệ thống, giữ hộ tài sản, ký biên bản bàn giao do luật sư lập và gửi mã nhận cho
        người nhận khi biên bản đủ chữ ký. Người này không được xem nội dung kho, không tự chia, bán
        hay cho tài sản, không tự đổi người nhận hay phần được nhận.
      </p>
    </section>
  );
}

/** Một ô chữ ký: tên chức danh, tên người ký và dòng trạng thái. */
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
  let boxStyle = "border-dashed border-heritage-border";
  let statusStyle = "text-heritage-muted";
  let mark: ReactNode = null;
  if (signed) {
    boxStyle = "border-solid border-heritage-success bg-heritage-success-bg";
    statusStyle = "text-heritage-success font-semibold";
    mark = <Check className="mr-1 inline size-4 align-text-bottom" aria-hidden="true" />;
  }
  return (
    <div className={`rounded-[10px] border px-3.5 py-3 text-sm ${boxStyle}`}>
      <p className="font-bold">{title}</p>
      <p className="mt-1 break-words text-[17px] font-semibold text-heritage-primary">{name}</p>
      <p className={`mt-1 ${statusStyle}`}>
        {mark}
        {statusText}
      </p>
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
  let ownerStatus = "Chờ Chủ kho ký";
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
    <div className="mt-9 grid grid-cols-2 items-start gap-3 border-t border-heritage-border pt-6 max-[480px]:grid-cols-1">
      <SignatureBox
        title="Chủ kho"
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
        <p className="mt-2 text-[13px] leading-5">
          Tôi, {confirmName}, xác nhận đã nhận vai trò và phạm vi nhiệm vụ nêu tại mục III.
        </p>
      </div>
    </div>
  );
}

/**
 * Biên bản phân chia số của một kho, sinh từ dữ liệu kế hoạch bàn giao: quốc hiệu, tiêu đề, bốn mục I đến IV, hai ô chữ ký
 * ngang hàng và câu lưu ý. Chỉ có tên và số đếm, không có tên hay nội dung tài sản, không có lời nhắn.
 *
 * Dùng chung cho khung xem trước của Chủ kho (viewer "owner", chỗ trống đỏ bấm được), bản Người thực thi xem khi nhận
 * lời mời và bản in (viewer "reader"). Hai chữ ký lấy từ dữ liệu thật: Chủ kho ký khi kích hoạt kế hoạch, Người thực
 * thi ký khi nhận lời mời; component không tự suy ra chữ ký.
 */
export function WillDocument({
  ownerName,
  ownerEmail,
  signedAt = null,
  executor = null,
  recipients,
  unassignedPackages = [],
  assetsOutsideCount = 0,
  viewer = "reader",
  onGapClick,
  identityStatus = "none",
  ownerIdentity = null,
  version = null,
}: WillDocumentProps) {
  const clickable = viewer === "owner";

  const signedDate = formatLongDate(signedAt);
  let dateText = "… tháng … năm … (điền tự động khi Chủ kho ký)";
  if (viewer === "owner") {
    dateText = "… tháng … năm … (điền tự động khi bạn ký)";
  }
  if (signedDate !== null) {
    dateText = signedDate;
  }

  let versionLine: ReactNode = null;
  if (version !== null) {
    let versionText = `Phiên bản ${version.number}`;
    const versionWhen = formatTimeOnDate(version.signedAt);
    if (versionWhen !== null) {
      versionText = `Phiên bản ${version.number} · ký lúc ${versionWhen}`;
    }
    versionLine = <p className="mt-1 text-center text-sm text-heritage-muted">{versionText}</p>;
  }

  return (
    // Văn bản pháp lý dùng Times New Roman như biên bản bàn giao; áp cho cả khung xem trước và bản in.
    <div className="text-heritage-text" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
      <header className="text-center text-sm leading-6">
        <p className="font-bold tracking-[0.02em]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
        <p className="inline-block border-b border-heritage-text pb-1 font-semibold">
          Độc lập – Tự do – Hạnh phúc
        </p>
      </header>
      <h2 className="mt-6 text-center text-[26px] font-bold leading-[1.3] tracking-[0.08em] text-heritage-primary">
        BIÊN BẢN PHÂN CHIA
      </h2>
      <p className="mt-3 text-center leading-7">Hôm nay, ngày {dateText}, tại LegacyVault.</p>
      {versionLine}

      <OwnerSectionBlock
        ownerName={ownerName}
        ownerEmail={ownerEmail}
        identityStatus={identityStatus}
        ownerIdentity={ownerIdentity}
      />
      <AssetsSectionBlock
        recipients={recipients}
        unassignedPackages={unassignedPackages}
        assetsOutsideCount={assetsOutsideCount}
        clickable={clickable}
        onGapClick={onGapClick}
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
      <p className="mt-5 text-[13px] italic leading-5 text-heritage-muted">
        Chữ ký điện tử được xác thực qua tài khoản LegacyVault; chi tiết trong nhật ký ký. Đây là
        chỉ dẫn bàn giao dữ liệu số, không thay thế di chúc theo quy định của pháp luật dân sự.
      </p>
    </div>
  );
}
