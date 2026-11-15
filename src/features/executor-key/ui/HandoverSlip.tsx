import { Fragment, type ReactNode } from "react";

/** Thông tin in trên giấy ủy quyền quản lý tài sản (kèm mã mở gói). */
export interface HandoverSlipProps {
  ownerName: string;
  vaultName: string;
  /** Email Người thực thi, là Bên nhận ủy quyền. */
  executorEmail: string;
  issuedAt: string | null | undefined;
  version: number;
  /** Mã gốc, giữ nguyên chuỗi Backend trả (các cụm nối bằng dấu gạch). */
  shard: string;
}

/** Phần của giấy do nơi dùng cung cấp (không đến từ lần cấp mã). */
export type HandoverSlipContext = Pick<
  HandoverSlipProps,
  "ownerName" | "vaultName" | "executorEmail"
>;

/** Xuống dòng được ở dấu gạch nhưng văn bản vẫn là một chuỗi liền, chép ra không bị tách ô. */
function renderShard(shard: string): ReactNode {
  const parts: string[] = shard.split("-");
  const nodes: ReactNode[] = [];
  for (let index = 0; index < parts.length; index = index + 1) {
    let suffix = "";
    if (index < parts.length - 1) {
      suffix = "-";
    }
    nodes.push(
      <Fragment key={index}>
        {parts[index]}
        {suffix}
        <wbr />
      </Fragment>,
    );
  }
  return nodes;
}

/** "ngày 15 tháng 11 năm 2026"; chưa có ngày thì để chỗ trống cho người ký tự điền. */
function formatLetterDate(value: string | null | undefined): string {
  const blank = "ngày …… tháng …… năm 20……";
  if (!value) {
    return blank;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return blank;
  }
  return `ngày ${date.getDate()} tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`;
}

/** Dòng giấy tờ để trống, người ký tự viết tay (hệ thống không giữ các thông tin này). */
function BlankLine({ label }: { label: string }) {
  return (
    <p className="text-sm leading-7">
      {label}:{" "}
      <span className="inline-block min-w-48 border-b border-dotted border-[#111]">&nbsp;</span>
    </p>
  );
}

function Party({ heading, name, nameLabel }: { heading: string; name: string; nameLabel: string }) {
  return (
    <div className="mt-4">
      <h4 className="text-sm font-bold">{heading}</h4>
      <p className="mt-1 break-words text-sm leading-7">
        {nameLabel}: <strong>{name}</strong>
      </p>
      <BlankLine label="CMND/CCCD số" />
      <BlankLine label="Cấp tại, cấp ngày" />
      <BlankLine label="Hộ khẩu thường trú" />
      <BlankLine label="Chỗ ở hiện tại" />
    </div>
  );
}

/**
 * Giấy ủy quyền quản lý tài sản: Chủ kho (Bên ủy quyền) ủy quyền cho Người thực thi (Bên nhận ủy quyền).
 * Ủy quyền một phần: nội dung chỉ gồm việc giấy tờ (báo tin, nộp giấy chứng tử). Mã mở gói in ở tờ đính kèm
 * riêng (sang trang mới khi in). Nền trắng, chữ gần đen để in rõ; cùng một nội dung cho bản hiện và bản in.
 */
export function HandoverSlip({
  ownerName,
  vaultName,
  executorEmail,
  issuedAt,
  version,
  shard,
}: HandoverSlipProps) {
  return (
    <section
      aria-label="Giấy ủy quyền quản lý tài sản"
      className="w-full max-w-full bg-white p-6 text-[#111] sm:p-8"
    >
      <header className="text-center">
        <p className="text-sm font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
        <p className="text-sm font-semibold">Độc lập – Tự do – Hạnh phúc</p>
        <p className="text-sm">—————</p>
      </header>
      <p className="mt-3 text-right text-sm italic">{formatLetterDate(issuedAt)}</p>

      <h3 className="mt-4 text-center text-2xl font-bold">GIẤY ỦY QUYỀN QUẢN LÝ TÀI SẢN</h3>
      <p className="mt-1 text-center text-xs text-[#555]">
        Kho: <strong>{vaultName}</strong>
      </p>

      <Party heading="1. BÊN ỦY QUYỀN (Chủ kho)" name={ownerName} nameLabel="Ông (bà)" />
      <p className="mt-3 text-sm font-semibold">Ủy quyền cho:</p>
      <Party
        heading="2. BÊN NHẬN ỦY QUYỀN (Người thực thi)"
        name={executorEmail}
        nameLabel="Ông (bà), email tài khoản LegacyVault"
      />

      <h4 className="mt-6 text-sm font-bold">NỘI DUNG ỦY QUYỀN</h4>
      <p className="mt-2 text-sm leading-6">
        <strong>1. Nội dung ủy quyền:</strong> Bằng giấy ủy quyền này, Bên ủy quyền đồng ý ủy quyền
        cho Bên nhận ủy quyền được thay mặt thực hiện các công việc sau đây thuộc thẩm quyền của bên
        ủy quyền:
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-6 text-sm leading-6">
        <li>Báo tin cho hệ thống khi Bên ủy quyền qua đời.</li>
        <li>Nộp giấy chứng tử và các giấy tờ liên quan để hệ thống mở hồ sơ.</li>
      </ul>
      <p className="mt-2 text-sm leading-6">
        Đây là ủy quyền một phần, chỉ gồm việc giấy tờ nêu trên. Bên nhận ủy quyền không được đọc
        nội dung kho, không tự duyệt hồ sơ và không nhận tài sản trong kho này (trừ khi đồng thời là
        người nhận được chỉ định). Mã mở gói in ở tờ đính kèm riêng, không thuộc nội dung ủy quyền.
      </p>

      <p className="mt-4 text-sm leading-6">
        <strong>2. Thời hạn ủy quyền:</strong> Giấy ủy quyền này có hiệu lực kể từ ngày ký đến khi
        Bên nhận ủy quyền thực hiện xong nội dung ủy quyền nêu trên.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-6 text-center">
        <div>
          <p className="text-sm font-bold">BÊN ỦY QUYỀN</p>
          <p className="text-xs">(Ký, ghi rõ họ tên, đóng dấu)</p>
          <div className="h-20" />
        </div>
        <div>
          <p className="text-sm font-bold">BÊN NHẬN ỦY QUYỀN</p>
          <p className="text-xs">(Ký, ghi rõ họ tên)</p>
          <div className="h-20" />
        </div>
      </div>

      <div className="mt-10 break-before-page border-t-2 border-dashed border-[#111] pt-6">
        <h4 className="text-base font-bold">TỜ ĐÍNH KÈM: MÃ MỞ GÓI</h4>
        <p className="mt-1 text-xs text-[#555]">
          Không thuộc nội dung ủy quyền. Cất ở nơi an toàn, chưa đưa mã cho ai.
        </p>
        <div className="mt-4 border-2 border-[#111] p-5">
          <p className="text-sm font-bold">Mã mở gói</p>
          <p className="text-xs text-[#555]">Bản {version} · một mã duy nhất cho mọi gói của kho</p>
          <p className="mt-3 break-words font-mono text-lg font-bold leading-8 tracking-wider">
            {renderShard(shard)}
          </p>
        </div>
        <p className="mt-2 text-xs leading-5 text-[#555]">
          Mã không có chữ I, L, O, U. Số 0 là số không, số 1 là số một. Gõ hoa hay thường, có gạch
          hay không đều được. Sau khi hồ sơ được duyệt, trao mã cho người nhận theo hướng dẫn ở mục
          Bàn giao.
        </p>
      </div>

      <footer className="mt-6 border-t border-[#999] pt-3 text-xs leading-5 text-[#555]">
        TÀI LIỆU MẬT · CHỈ DÀNH CHO NGƯỜI THỰC THI. LegacyVault không lưu mã gốc. Mất giấy thì báo
        Chủ kho đổi mã mới; mã cũ hết dùng được ngay.
      </footer>
    </section>
  );
}
