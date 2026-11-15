import { Fragment, type ReactNode } from "react";

/** Thông tin in trên di chúc (kèm mã mở gói). */
export interface HandoverSlipProps {
  ownerName: string;
  vaultName: string;
  /** Email Người thực thi, là người quản lý di sản. */
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
 * Di chúc: Chủ kho (người lập) chỉ định Người thực thi làm người thực hiện di chúc, có hiệu lực từ khi
 * Chủ kho qua đời (không dùng "ủy quyền" vì ủy quyền chấm dứt khi người ủy quyền mất). Việc chia di sản
 * theo kế hoạch trong kho; mã mở gói in ở tờ đính kèm riêng (sang trang mới khi in).
 * Nền trắng, chữ gần đen để in rõ; cùng một nội dung cho bản hiện và bản in.
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
    <section aria-label="Di chúc" className="w-full max-w-full bg-white p-6 text-[#111] sm:p-8">
      <header className="text-center">
        <p className="text-sm font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
        <p className="text-sm font-semibold">Độc lập – Tự do – Hạnh phúc</p>
        <p className="text-sm">—————</p>
      </header>
      <p className="mt-3 text-right text-sm italic">{formatLetterDate(issuedAt)}</p>

      <h3 className="mt-4 text-center text-2xl font-bold">DI CHÚC</h3>
      <p className="mt-1 text-center text-xs text-[#555]">
        Lập trên hệ thống LegacyVault, kho: <strong>{vaultName}</strong>
      </p>

      <Party heading="NGƯỜI LẬP DI CHÚC (Chủ kho)" name={ownerName} nameLabel="Ông (bà)" />
      <p className="mt-3 text-sm leading-6">
        Tôi đang minh mẫn, sáng suốt, không bị ai ép buộc hay lừa dối, tự nguyện lập di chúc này.
      </p>

      <p className="mt-3 text-sm leading-6">
        <strong>Điều 1. Di sản.</strong> Toàn bộ tài sản và thông tin lưu trong kho "{vaultName}"
        trên hệ thống LegacyVault, gồm các gói đã liệt kê trong kế hoạch bàn giao. Nơi có di sản: hệ
        thống LegacyVault.
      </p>
      <p className="mt-3 text-sm leading-6">
        <strong>Điều 2. Người hưởng di sản.</strong> Mỗi gói được trao cho người nhận mà tôi đã chỉ
        định trong kế hoạch bàn giao của kho. Kế hoạch này là phần không tách rời của di chúc.
      </p>

      <p className="mt-3 text-sm leading-6">
        <strong>Điều 3. Người thực hiện di chúc (người quản lý di sản).</strong> Tôi chỉ định:
      </p>
      <Party
        heading="NGƯỜI THỰC HIỆN DI CHÚC (Người thực thi)"
        name={executorEmail}
        nameLabel="Ông (bà), email tài khoản LegacyVault"
      />
      <p className="mt-2 text-sm leading-6">Người này có các việc sau:</p>
      <ul className="mt-1 list-disc space-y-1 pl-6 text-sm leading-6">
        <li>Báo tin cho hệ thống và nộp giấy chứng tử cùng các giấy tờ liên quan để mở hồ sơ.</li>
        <li>Giữ gìn mã mở gói (tờ đính kèm) cho đến khi hồ sơ được duyệt.</li>
        <li>Trao mã cho người nhận đúng theo Điều 2, sau khi hồ sơ được duyệt.</li>
      </ul>
      <p className="mt-2 text-sm leading-6">
        Người thực hiện di chúc không được xem nội dung kho, không tự đổi người hưởng hay phần được
        hưởng, không bán, tặng cho hay định đoạt di sản khi chưa có văn bản đồng ý của những người
        thừa kế, và không nhận di sản trừ khi được chỉ định ở Điều 2.
      </p>

      <p className="mt-3 text-sm leading-6">
        <strong>Điều 4. Hiệu lực.</strong> Di chúc có hiệu lực từ khi tôi qua đời và hệ thống tiếp
        nhận hồ sơ. Khi còn sống, tôi có quyền sửa đổi, thay người thực hiện hoặc hủy di chúc bất cứ
        lúc nào.
      </p>
      <p className="mt-3 text-sm leading-6">
        <strong>Điều 5. Cam đoan.</strong> Tôi đã đọc lại, hiểu và đồng ý toàn bộ nội dung trên.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-6 text-center">
        <div>
          <p className="text-sm font-bold">NGƯỜI LẬP DI CHÚC</p>
          <p className="text-xs">(Ký, ghi rõ họ tên)</p>
          <div className="h-20" />
        </div>
        <div>
          <p className="text-sm font-bold">NGƯỜI THỰC HIỆN DI CHÚC</p>
          <p className="text-xs">(Ký xác nhận đồng ý nhận vai trò)</p>
          <div className="h-20" />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-bold">NGƯỜI LÀM CHỨNG</p>
        <p className="text-xs text-[#555]">
          Hai người, không thuộc diện được hưởng di sản. Tự điền khi in.
        </p>
        <BlankLine label="1. Họ tên, CCCD, chữ ký" />
        <BlankLine label="2. Họ tên, CCCD, chữ ký" />
      </div>
      <p className="mt-3 text-xs italic text-[#555]">
        Bản số phục vụ đồ án, chưa thay thế di chúc có người làm chứng hoặc công chứng.
      </p>

      <div className="mt-10 break-before-page border-t-2 border-dashed border-[#111] pt-6">
        <h4 className="text-base font-bold">TỜ ĐÍNH KÈM: MÃ MỞ GÓI</h4>
        <p className="mt-1 text-xs text-[#555]">Cất ở nơi an toàn, chưa đưa mã cho ai.</p>
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
