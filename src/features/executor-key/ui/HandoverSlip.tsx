import { Fragment, type ReactNode } from "react";
import { WillDocument } from "@/entities/will/ui/WillDocument";

/** Thông tin in trên di chúc (kèm mã mở gói). */
export interface HandoverSlipProps {
  ownerName: string;
  vaultName: string;
  /** Email Người thực thi, là người quản lý di sản. */
  executorEmail: string;
  issuedAt: string | null | undefined;
  /** Điều khoản Chủ kho thêm vào di chúc. */
  willClauses?: string[];
  version: number;
  /** Mã gốc, giữ nguyên chuỗi Backend trả (các cụm nối bằng dấu gạch). */
  shard: string;
}

/** Phần của giấy do nơi dùng cung cấp (không đến từ lần cấp mã). */
export type HandoverSlipContext = Pick<
  HandoverSlipProps,
  "ownerName" | "vaultName" | "executorEmail" | "willClauses"
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

/**
 * Di chúc in kèm mã mở gói: nội dung di chúc lấy từ WillDocument (dùng chung với bản xem trước), tiếp theo là tờ
 * đính kèm mã mở gói, sang trang mới khi in. Nền trắng, chữ gần đen để in rõ; cùng một nội dung cho bản hiện và bản in.
 */
export function HandoverSlip({
  ownerName,
  vaultName,
  executorEmail,
  issuedAt,
  willClauses,
  version,
  shard,
}: HandoverSlipProps) {
  return (
    <section aria-label="Di chúc" className="w-full max-w-full bg-white p-6 text-[#111] sm:p-8">
      <WillDocument
        ownerName={ownerName}
        vaultName={vaultName}
        executorEmail={executorEmail}
        issuedAt={issuedAt}
        clauses={willClauses}
      />

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
