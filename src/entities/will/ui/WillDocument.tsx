import type { ReactNode } from "react";

export interface WillDocumentProps {
  /** Họ tên Chủ kho (người lập di chúc). */
  ownerName: string;
  /** Tên kho; chưa biết thì để trống chỗ này. */
  vaultName?: string;
  /** Email tài khoản LegacyVault của Người thực thi. */
  executorEmail: string;
  /** Ngày lập; chưa có thì để chỗ trống cho người ký tự điền. */
  issuedAt?: string | null;
  /** Điều khoản Chủ kho tự thêm, in thành "Điều khoản bổ sung" sau phần Định đoạt tài sản. */
  clauses?: string[];
}

/** Di chúc là văn bản hành chính nên dùng Times New Roman, cả khi xem và khi in. */
const WILL_FONT = '"Times New Roman", Times, "Liberation Serif", serif';

/** "ngày 15 tháng 11 năm 2026"; chưa có ngày thì để chỗ trống. */
function formatLetterDate(value: string | null | undefined): string {
  const blank = "ngày … tháng … năm …";
  if (!value) {
    return blank;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return blank;
  }
  return `ngày ${date.getDate()} tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`;
}

/** Chỗ trống có gạch chấm để người lập tự viết tay (hệ thống không giữ các thông tin này). */
function Dots({ width = "min-w-40" }: { width?: string }) {
  return (
    <span className={`inline-block border-b border-dotted border-[#111] ${width}`}>&nbsp;</span>
  );
}

/** Dòng đánh số "1/ ……;" của phần Tài sản và Định đoạt tài sản. */
function NumberedLine({ index, children }: { index: number; children?: ReactNode }) {
  let content: ReactNode = <Dots width="min-w-64" />;
  if (children) {
    content = children;
  }
  return (
    <p className="text-base leading-7">
      {index}/ {content};
    </p>
  );
}

/**
 * Nội dung Di chúc theo mẫu di chúc thông dụng: quốc hiệu, thông tin người lập, Tài sản, Định đoạt tài sản,
 * người làm thủ tục sau khi qua đời. Người làm thủ tục là Người thực thi: chỉ làm thủ tục giấy tờ, không
 * xem nội dung kho và không nhận tài sản. Việc chia cho từng người nhận lấy theo kế hoạch bàn giao trong kho.
 * Dùng chung cho bản in (kèm tờ mã mở gói), bản Chủ kho xem trước khi kích hoạt và bản Người thực thi xem trước khi ký.
 */
export function WillDocument({
  ownerName,
  vaultName,
  executorEmail,
  issuedAt,
  clauses = [],
}: WillDocumentProps) {
  let vaultText: ReactNode = "của tôi";
  if (vaultName) {
    vaultText = <strong>{vaultName}</strong>;
  }
  return (
    <div className="text-[#111]" style={{ fontFamily: WILL_FONT }}>
      <header className="text-center">
        <p className="text-base font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
        <p className="mt-1 text-base font-semibold">Độc lập – Tự do – Hạnh phúc</p>
      </header>
      <h3 className="mt-4 text-center text-2xl font-bold">DI CHÚC</h3>

      <p className="mt-4 text-base leading-7">
        Hôm nay, {formatLetterDate(issuedAt)}, tại <Dots />
      </p>
      <p className="mt-2 break-words text-base leading-7">
        Tôi là: <strong>{ownerName}</strong>
      </p>
      <p className="text-base leading-7">
        Ngày sinh: <Dots />
      </p>
      <p className="text-base leading-7">
        CMND/CCCD/Hộ chiếu số: <Dots /> cấp ngày <Dots width="min-w-24" /> tại <Dots />
      </p>
      <p className="text-base leading-7">
        Nơi đăng ký hộ khẩu thường trú: <Dots width="min-w-56" />
      </p>

      <p className="mt-3 text-base leading-7">
        Nay trong trạng thái tinh thần hoàn toàn minh mẫn, sáng suốt, không bị bất kỳ một sự lừa
        dối, đe dọa hoặc cưỡng ép nào, tôi lập di chúc này để định đoạt tài sản của tôi sau khi chết
        đi như sau:
      </p>

      <h4 className="mt-3 text-base font-bold">Tài sản</h4>
      <p className="text-base leading-7">
        Tài sản của tôi được định đoạt trong di chúc này bao gồm:
      </p>
      <NumberedLine index={1}>
        Toàn bộ tài sản và thông tin lưu trong kho {vaultText} trên hệ thống LegacyVault, gồm các
        gói đã liệt kê trong kế hoạch bàn giao
      </NumberedLine>
      <NumberedLine index={2} />
      <NumberedLine index={3} />

      <h4 className="mt-3 text-base font-bold">Định đoạt tài sản</h4>
      <p className="text-base leading-7">
        Sau khi tôi chết, toàn bộ tài sản nêu trên của tôi được để lại cho:
      </p>
      <NumberedLine index={1}>
        Những người nhận mà tôi đã chỉ định cho từng gói trong kế hoạch bàn giao của kho
      </NumberedLine>
      <NumberedLine index={2} />
      <NumberedLine index={3} />

      <p className="mt-3 text-base leading-7">
        Ngoài những người nhận nêu trên, tôi không để lại tài sản nêu trên của mình cho bất cứ ai
        khác.
      </p>
      {clauses.length > 0 && (
        <div className="mt-3">
          <h4 className="text-base font-bold">Điều khoản bổ sung</h4>
          {clauses.map((clause, index) => (
            <p key={`${index}:${clause}`} className="break-words text-base leading-7">
              {index + 1}/ {clause}
            </p>
          ))}
        </div>
      )}
      <p className="mt-3 break-words text-base leading-7">
        Sau khi tôi qua đời, ông/bà <strong>{executorEmail}</strong> (Người thực thi, tài khoản
        LegacyVault) được làm các thủ tục theo quy định của pháp luật để thực hiện di chúc này, gồm:
        báo tin, nộp giấy chứng tử và các giấy tờ liên quan để mở hồ sơ, giữ mã mở gói và trao mã
        cho người nhận sau khi hồ sơ được duyệt. Người này không được xem nội dung kho, không tự đổi
        người nhận hay phần được nhận, không bán, tặng cho hay định đoạt tài sản, và không nhận tài
        sản trừ khi được tôi chỉ định là người nhận.
      </p>
      <p className="mt-3 text-base leading-7">
        Di chúc này có hiệu lực từ khi tôi qua đời. Khi còn sống, tôi có quyền sửa đổi, đổi người
        thực thi hoặc thu hồi di chúc này bất cứ lúc nào.
      </p>
      <p className="mt-3 text-base leading-7">
        Di chúc này thể hiện đầy đủ, dứt khoát ý chí của tôi, được lập thành{" "}
        <Dots width="min-w-8" /> (…) bản, mỗi bản gồm <Dots width="min-w-8" /> (…) trang{" "}
        <Dots width="min-w-8" /> (…) tờ.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-6 text-center">
        <div>
          <p className="text-base font-bold">NGƯỜI LẬP DI CHÚC</p>
          <p className="text-sm">(Ký và ghi rõ họ tên)</p>
          <div className="h-20" />
        </div>
        <div>
          <p className="text-base font-bold">NGƯỜI THỰC THI DI CHÚC</p>
          <p className="text-sm">(Ký xác nhận đồng ý nhận vai trò)</p>
          <div className="h-20" />
        </div>
      </div>
      <p className="mt-2 text-sm italic text-[#555]">
        Bản số phục vụ đồ án, chưa thay thế di chúc có người làm chứng hoặc công chứng.
      </p>
    </div>
  );
}
