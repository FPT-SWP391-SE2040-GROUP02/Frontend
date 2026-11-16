import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { ROUTES } from "@/shared/config/routes.config";
import { DEFAULT_POLICY_WINDOWS } from "@/shared/settings/usePolicyWindows";
import { formatLongDate, formatShortDate, formatTimeOnDate } from "../lib/willDates";
import type {
  WillExecutorView,
  WillPackageView,
  WillPolicyView,
  WillRecipientView,
} from "../model/willDocument.types";

/** Hạn điểm danh mặc định (ngày); chưa có tham số cấu hình riêng nên in mức gốc của hệ thống. */
const DEFAULT_CHECK_IN_DAYS = 30;

export interface WillDocumentProps {
  /** Họ tên Chủ kho (người lập di chúc). */
  ownerName: string;
  /** Email tài khoản LegacyVault của Chủ kho; bỏ trống thì câu mở đầu không nêu tài khoản. */
  ownerEmail?: string;
  /** Lúc Chủ kho ký (kích hoạt kế hoạch). Chưa có nghĩa là Chủ kho chưa ký. */
  signedAt?: string | null;
  /** Người thực thi hiện hành; null hoặc bỏ trống nghĩa là chưa có. */
  executor?: WillExecutorView | null;
  /**
   * Người nhận theo từng người. Bỏ trống khi nơi xem không có dữ liệu này (ví dụ Người thực thi xem lời mời):
   * Điều 2 khi đó dùng câu chung.
   */
  recipients?: WillRecipientView[];
  /** Các gói chưa có người nhận; chỉ hiện khi biết `recipients`. */
  unassignedPackages?: WillPackageView[];
  /** Số tài sản chưa nằm trong gói nào (sẽ không được bàn giao). */
  assetsOutsideCount?: number;
  /** Các hạn in ở Điều 4. */
  policy?: Partial<WillPolicyView>;
  /**
   * "owner": Chủ kho đang soạn, chỗ trống có nút dẫn tới nơi điền.
   * "reader": chỉ đọc (Người thực thi xem trước, bản in), không có nút nào.
   */
  viewer?: "owner" | "reader";
}

const SECTION = "mt-9 scroll-mt-24";
const HEADING = "mb-2.5 text-base font-semibold text-heritage-primary";
const BODY = "max-w-[68ch]";
const LINK =
  "font-semibold text-heritage-gold-hover underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-heritage-gold";
const GAP_BUTTON =
  "inline-flex min-h-10 items-center justify-center rounded-[20px] bg-heritage-primary px-4 text-sm font-semibold text-white hover:bg-heritage-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold";

/** Chỗ còn thiếu: khung nét đứt vàng kèm nút dẫn tới nơi điền (chỉ khi Chủ kho đang soạn). */
function Gap({ text, action }: { text: string; action: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-xl border-[1.5px] border-dashed border-[#c9b27f] bg-heritage-gold-light px-4 py-3.5">
      <p className="min-w-[220px] flex-1 font-medium text-[#7a5b25]">
        {text}{" "}
        <span className="tracking-[2px] text-heritage-muted" aria-hidden="true">
          ………
        </span>
      </p>
      {action}
    </div>
  );
}

function InfoRows({ rows }: { rows: Array<[string, string]> }) {
  const nodes: ReactNode[] = [];
  for (const [label, value] of rows) {
    nodes.push(
      <div key={label} className="grid gap-x-4 sm:grid-cols-[180px_minmax(0,1fr)]">
        <dt className="text-sm text-heritage-muted">{label}</dt>
        <dd className="mb-2.5 break-words font-medium sm:mb-1.5">{value}</dd>
      </div>,
    );
  }
  return <dl>{nodes}</dl>;
}

/** Dấu "đã ký điện tử" hoặc nhãn "chưa ký" trong ô chữ ký. */
function Stamp({ signed, waitText }: { signed: boolean; waitText: string }) {
  if (signed) {
    return (
      <span className="inline-flex flex-col items-center gap-0.5 rounded-[10px] border-[1.5px] border-[#1f7a55] px-[18px] py-2.5 text-xs font-bold tracking-[0.06em] text-[#1f7a55]">
        <Check className="size-5" strokeWidth={2.2} aria-hidden="true" />
        ĐÃ KÝ ĐIỆN TỬ
      </span>
    );
  }
  return (
    <span className="inline-flex flex-col items-center gap-0.5 rounded-[10px] border-[1.5px] border-dashed border-[#c9b27f] bg-heritage-gold-light px-[18px] py-2.5 text-[13px] font-semibold text-[#7a5b25]">
      {waitText}
    </span>
  );
}

/** Điền mức gốc của hệ thống vào những hạn nơi dùng không truyền. */
function resolvePolicy(policy: Partial<WillPolicyView> | undefined): WillPolicyView {
  const result: WillPolicyView = {
    checkInDays: DEFAULT_CHECK_IN_DAYS,
    responseDays: DEFAULT_POLICY_WINDOWS.responseDays,
    decisionDays: DEFAULT_POLICY_WINDOWS.decisionDays,
    grantDays: DEFAULT_POLICY_WINDOWS.grantDays,
  };
  if (policy === undefined) {
    return result;
  }
  if (policy.checkInDays !== undefined) {
    result.checkInDays = policy.checkInDays;
  }
  if (policy.responseDays !== undefined) {
    result.responseDays = policy.responseDays;
  }
  if (policy.decisionDays !== undefined) {
    result.decisionDays = policy.decisionDays;
  }
  if (policy.grantDays !== undefined) {
    result.grantDays = policy.grantDays;
  }
  return result;
}

function executorDisplayName(executor: WillExecutorView): string {
  if (executor.fullName) {
    return executor.fullName;
  }
  return executor.email;
}

/** Điều 1: Người thực thi. */
function ExecutorArticle({
  executor,
  viewer,
}: {
  executor: WillExecutorView | null;
  viewer: "owner" | "reader";
}) {
  let body: ReactNode;
  if (executor === null) {
    let action: ReactNode = null;
    if (viewer === "owner") {
      action = (
        <Link className={GAP_BUTTON} to={ROUTES.DASHBOARD.TRUSTED_PEOPLE}>
          Chọn Người thực thi
        </Link>
      );
    }
    body = <Gap text="Chưa chọn Người thực thi" action={action} />;
  } else {
    const signedDate = formatShortDate(executor.signedAt);
    if (signedDate === null && viewer === "reader") {
      // Người thực thi đọc lời mời (hoặc bản in): hiện thông tin của họ và nói rõ chưa ký.
      const rows: Array<[string, string]> = [];
      if (executor.fullName) {
        rows.push(["Họ và tên", executor.fullName]);
      }
      rows.push(["Tài khoản", `${executor.email} (Người thực thi của LegacyVault)`]);
      rows.push(["Trạng thái", "Chưa ký nhận vai"]);
      body = <InfoRows rows={rows} />;
    } else if (signedDate === null) {
      // Chủ kho đã mời nhưng người này chưa ký nhận vai: giữ chỗ trống, di chúc chưa hoàn chỉnh.
      let action: ReactNode = null;
      if (viewer === "owner") {
        action = (
          <Link className={GAP_BUTTON} to={ROUTES.DASHBOARD.TRUSTED_PEOPLE}>
            Xem lời mời
          </Link>
        );
      }
      body = (
        <Gap
          text={`Đã mời ${executorDisplayName(executor)}, chờ người này ký nhận vai`}
          action={action}
        />
      );
    } else {
      const rows: Array<[string, string]> = [];
      if (executor.fullName) {
        rows.push(["Họ và tên", executor.fullName]);
      }
      rows.push(["Tài khoản", `${executor.email} (Người thực thi của LegacyVault)`]);
      rows.push(["Trạng thái", `Đã ký nhận vai ngày ${signedDate}`]);
      body = <InfoRows rows={rows} />;
    }
  }
  return (
    <section id="dieu-1" className={SECTION}>
      <h3 className={HEADING}>Điều 1. Người thực thi</h3>
      {body}
      <p
        className={`${BODY} mt-3 rounded-r-[10px] border-l-[3px] border-heritage-gold bg-heritage-gold-light px-4 py-3.5`}
      >
        Sau khi tôi qua đời, Người thực thi nêu trên được làm các thủ tục theo quy định của pháp
        luật để thực hiện di chúc này, gồm: báo tin, nộp giấy chứng tử và các giấy tờ liên quan để
        mở hồ sơ, giữ mã mở gói và trao mã cho người nhận sau khi hồ sơ được duyệt. Người này không
        được xem nội dung kho, không tự đổi người nhận hay phần được nhận, không bán, tặng cho hay
        định đoạt tài sản, và không nhận tài sản.
      </p>
    </section>
  );
}

function packageLabel(item: WillPackageView): string {
  return `${item.name} · ${item.assetCount} tài sản`;
}

function RecipientCard({
  recipient,
  viewer,
}: {
  recipient: WillRecipientView;
  viewer: "owner" | "reader";
}) {
  const pills: ReactNode[] = [];
  for (const item of recipient.packages) {
    pills.push(
      <span
        key={item.id}
        className="inline-flex rounded-full bg-heritage-primary-light px-3 py-[3px] text-sm font-medium text-heritage-primary"
      >
        {packageLabel(item)}
      </span>,
    );
  }
  let message: ReactNode = <dd>Đã viết, gửi kèm thư mời khi bàn giao</dd>;
  if (!recipient.hasMessage) {
    let writeLink: ReactNode = null;
    if (viewer === "owner") {
      writeLink = (
        <>
          {" "}
          <Link className={LINK} to={ROUTES.DASHBOARD.BENEFICIARIES}>
            Viết lời nhắn
          </Link>
        </>
      );
    }
    message = (
      <dd className="text-heritage-muted">
        Chưa viết
        {writeLink}
      </dd>
    );
  }
  return (
    <div className="rounded-xl border border-heritage-border px-[18px] py-4">
      <p className="mb-2 text-base font-semibold text-heritage-primary">{recipient.fullName}</p>
      <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[110px_minmax(0,1fr)]">
        <dt className="pt-0.5 text-sm text-heritage-muted">Được nhận</dt>
        <dd className="flex flex-wrap items-center gap-x-2 gap-y-1.5">{pills}</dd>
        <dt className="pt-0.5 text-sm text-heritage-muted">Lời nhắn</dt>
        {message}
      </dl>
    </div>
  );
}

/** Điều 2: Người nhận và phần được nhận. */
function RecipientsArticle({
  recipients,
  unassignedPackages,
  assetsOutsideCount,
  viewer,
}: {
  recipients: WillRecipientView[] | undefined;
  unassignedPackages: WillPackageView[];
  assetsOutsideCount: number;
  viewer: "owner" | "reader";
}) {
  if (recipients === undefined) {
    return (
      <section id="dieu-2" className={SECTION}>
        <h3 className={HEADING}>Điều 2. Người nhận và phần được nhận</h3>
        <p className={BODY}>
          Các gói tài sản trong kho được để lại cho những người nhận mà tôi đã chỉ định cho từng gói
          trong kế hoạch bàn giao. Di chúc chỉ ghi tên gói, không ghi nội dung tài sản hay nội dung
          lời nhắn.
        </p>
      </section>
    );
  }
  const cards: ReactNode[] = [];
  for (const recipient of recipients) {
    cards.push(<RecipientCard key={recipient.id} recipient={recipient} viewer={viewer} />);
  }
  for (const item of unassignedPackages) {
    let action: ReactNode = null;
    if (viewer === "owner") {
      action = (
        <Link className={GAP_BUTTON} to={ROUTES.DASHBOARD.GROUP_DETAIL(item.id)}>
          Chọn người nhận
        </Link>
      );
    }
    cards.push(
      <Gap
        key={`gap-${item.id}`}
        text={`Gói "${item.name}" (${item.assetCount} tài sản) chưa có người nhận`}
        action={action}
      />,
    );
  }
  if (cards.length === 0) {
    let action: ReactNode = null;
    if (viewer === "owner") {
      action = (
        <Link className={GAP_BUTTON} to={ROUTES.DASHBOARD.ASSETS}>
          Tạo gói và chọn người nhận
        </Link>
      );
    }
    cards.push(<Gap key="empty" text="Chưa có gói nào được giao cho người nhận" action={action} />);
  }
  let outsideNote = "";
  if (assetsOutsideCount > 0) {
    outsideNote = ` Còn ${assetsOutsideCount} tài sản chưa nằm trong gói nào nên sẽ không được bàn giao.`;
  }
  return (
    <section id="dieu-2" className={SECTION}>
      <h3 className={HEADING}>Điều 2. Người nhận và phần được nhận</h3>
      <div className="grid gap-3">{cards}</div>
      <p className="mt-2.5 text-sm text-heritage-muted">
        Một gói có thể giao cho nhiều người, mỗi người nhận một bản. Di chúc chỉ ghi tên gói, không
        ghi nội dung tài sản hay nội dung lời nhắn.{outsideNote}
      </p>
    </section>
  );
}

function SignatureBlock({
  ownerName,
  signedAt,
  executor,
  viewer,
}: {
  ownerName: string;
  signedAt: string | null;
  executor: WillExecutorView | null;
  viewer: "owner" | "reader";
}) {
  const ownerWhen = formatTimeOnDate(signedAt);
  let ownerNote = "Chủ kho ký khi kích hoạt kế hoạch";
  if (viewer === "owner") {
    ownerNote = "Ký ở khung bên phải sau khi điền đủ";
  }
  if (ownerWhen !== null) {
    ownerNote = `Lúc ${ownerWhen}`;
  }

  let executorStamp = <Stamp signed={false} waitText="Chưa có Người thực thi" />;
  let executorName: ReactNode = null;
  let executorNote = "Người thực thi ký khi nhận lời mời";
  if (executor !== null) {
    const executorWhen = formatTimeOnDate(executor.signedAt);
    executorName = (
      <p className="mt-3 break-words text-[17px] font-semibold text-heritage-primary">
        {executorDisplayName(executor)}
      </p>
    );
    if (executorWhen !== null) {
      executorStamp = <Stamp signed waitText="" />;
      executorNote = `Lúc ${executorWhen}`;
    } else {
      executorStamp = <Stamp signed={false} waitText="Chưa ký" />;
    }
  }

  return (
    <div className="mt-11 grid gap-6 border-t border-heritage-border pt-7 text-center sm:grid-cols-2">
      <div>
        <h4 className="text-sm font-bold tracking-[0.04em]">NGƯỜI LẬP DI CHÚC</h4>
        <p className="mb-3.5 mt-0.5 text-[13px] italic text-heritage-muted">
          (Ký bằng mã PIN của kho)
        </p>
        <Stamp signed={ownerWhen !== null} waitText="Chưa ký" />
        <p className="mt-3 break-words text-[17px] font-semibold text-heritage-primary">
          {ownerName}
        </p>
        <p className="text-[13px] text-heritage-muted">{ownerNote}</p>
      </div>
      <div>
        <h4 className="text-sm font-bold tracking-[0.04em]">NGƯỜI THỰC THI DI CHÚC</h4>
        <p className="mb-3.5 mt-0.5 text-[13px] italic text-heritage-muted">
          (Ký xác nhận đồng ý nhận vai trò)
        </p>
        {executorStamp}
        {executorName}
        <p className="text-[13px] text-heritage-muted">{executorNote}</p>
      </div>
    </div>
  );
}

/**
 * Di chúc số của một kho, sinh từ dữ liệu kế hoạch bàn giao: quốc hiệu, Điều 1 đến Điều 6, hai
 * ô chữ ký và câu lưu ý. Chỉ có tên và số đếm, không có nội dung tài sản hay lời nhắn của người nhận.
 *
 * Dùng chung cho trang Bàn giao của Chủ kho (viewer "owner", chỗ trống có nút dẫn tới nơi điền), bản Người thực thi xem
 * khi nhận lời mời và bản in (viewer "reader"). Hai chữ ký lấy từ dữ liệu thật: Chủ kho ký khi kích hoạt kế hoạch,
 * Người thực thi ký khi nhận lời mời; component không tự suy ra chữ ký.
 */
export function WillDocument({
  ownerName,
  ownerEmail,
  signedAt = null,
  executor = null,
  recipients,
  unassignedPackages = [],
  assetsOutsideCount = 0,
  policy,
  viewer = "reader",
}: WillDocumentProps) {
  const days = resolvePolicy(policy);
  const { checkInDays, responseDays, decisionDays, grantDays } = days;

  const signedDate = formatLongDate(signedAt);
  let dateLine = "Ngày lập: điền tự động khi Chủ kho ký";
  if (viewer === "owner") {
    dateLine = "Ngày lập: điền tự động khi bạn ký";
  }
  if (signedDate !== null) {
    dateLine = `Lập ngày ${signedDate}`;
  }

  let ownerAccount: ReactNode = null;
  if (ownerEmail) {
    ownerAccount = (
      <>
        , chủ tài khoản <strong>{ownerEmail}</strong> trên LegacyVault, đã xác minh danh tính
      </>
    );
  }

  return (
    <div className="text-heritage-text">
      <header className="text-center text-sm leading-6">
        <p className="font-bold tracking-[0.02em]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
        <p className="inline-block border-b border-heritage-text pb-1 font-semibold">
          Độc lập – Tự do – Hạnh phúc
        </p>
      </header>
      <h2 className="mt-7 text-center text-[26px] font-bold leading-[1.3] tracking-[0.08em] text-heritage-primary">
        DI CHÚC
      </h2>
      <p className="mt-1 text-center text-sm italic text-heritage-muted">{dateLine}</p>

      <p className={`${BODY} mt-7`}>
        Tôi là <strong>{ownerName}</strong>
        {ownerAccount}. Nay trong trạng thái tinh thần hoàn toàn minh mẫn, sáng suốt, không bị bất
        kỳ sự lừa dối, đe dọa hoặc cưỡng ép nào, tôi lập di chúc này để định đoạt các gói tài sản
        trong kho của tôi tại LegacyVault như sau:
      </p>

      <ExecutorArticle executor={executor} viewer={viewer} />
      <RecipientsArticle
        recipients={recipients}
        unassignedPackages={unassignedPackages}
        assetsOutsideCount={assetsOutsideCount}
        viewer={viewer}
      />

      <section id="dieu-3" className={SECTION}>
        <h3 className={HEADING}>Điều 3. Điều kiện bàn giao</h3>
        <ol className={`${BODY} list-decimal space-y-1.5 pl-[22px]`}>
          <li>
            Tôi ngừng điểm danh quá hạn. Hệ thống không tự mở kho mà giao Người thực thi liên hệ
            kiểm tra.
          </li>
          <li>Người thực thi báo tin và nộp giấy chứng tử.</li>
          <li>Người xét duyệt kiểm tra và duyệt hồ sơ.</li>
          <li>
            Từng người nhận nộp ảnh căn cước, ký biên bản nhận, rồi nhập mã mở gói để xem và tải
            phần của mình.
          </li>
        </ol>
      </section>

      <section id="dieu-4" className={SECTION}>
        <h3 className={HEADING}>Điều 4. Thời hạn</h3>
        <InfoRows
          rows={[
            ["Điểm danh", `Mỗi ${checkInDays} ngày`],
            ["Người nhận phản hồi lời mời", `Trong ${responseDays} ngày`],
            ["Người nhận quyết định", `Trong ${decisionDays} ngày kể từ khi đủ điều kiện`],
            ["Xem và tải", `Trong ${grantDays} ngày kể từ lúc đồng ý`],
          ]}
        />
        <p className="mt-2.5 text-sm text-heritage-muted">
          Mọi hạn tính theo giờ của hệ thống. Người nhận không thao tác đúng hạn có thể mất quyền
          nhận.
        </p>
      </section>

      <section id="dieu-5" className={SECTION}>
        <h3 className={HEADING}>Điều 5. Lưu và xóa dữ liệu</h3>
        <p className={BODY}>
          Phần của người nhận từ chối sẽ bị xóa khỏi hệ thống. Dữ liệu còn lại chỉ bị xóa sau khi
          hết thời hạn lưu giữ, không xóa ngay khi một lời mời hết hạn.
        </p>
      </section>

      <section id="dieu-6" className={SECTION}>
        <h3 className={HEADING}>Điều 6. Hiệu lực, sửa đổi và thu hồi</h3>
        <p className={BODY}>
          Di chúc này có hiệu lực từ khi tôi qua đời. Khi còn sống, tôi có quyền sửa đổi, đổi người
          thực thi hoặc thu hồi di chúc này bất cứ lúc nào.
        </p>
        <p className={`${BODY} mt-2`}>
          Mỗi lần sửa gói, người nhận hoặc Người thực thi cần nhập mã PIN, và di chúc này luôn hiển
          thị nội dung đang áp dụng. Nếu tôi gỡ hết gói sẵn sàng, kế hoạch tự dừng: điểm danh tạm
          ngưng, Người thực thi bị tạm ngưng, và tôi phải ký kích hoạt lại.
        </p>
      </section>

      <SignatureBlock
        ownerName={ownerName}
        signedAt={signedAt}
        executor={executor}
        viewer={viewer}
      />
      <p className="mt-[18px] text-[13px] italic text-heritage-muted">
        Bản di chúc số phục vụ việc bàn giao dữ liệu trên LegacyVault, chưa thay thế di chúc có
        người làm chứng hoặc công chứng.
      </p>
    </div>
  );
}
