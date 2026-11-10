import { Fragment, type ReactNode } from "react";
import { formatDateTime } from "@/shared/lib/dateFormat";

/** Thông tin in trên phiếu bàn giao mã mở gói. */
export interface HandoverSlipProps {
  ownerName: string;
  vaultName: string;
  /** Email Người thực thi giữ phiếu. */
  executorEmail: string;
  issuedAt: string | null | undefined;
  version: number;
  /** Mã gốc, giữ nguyên chuỗi Backend trả (các cụm nối bằng dấu gạch). */
  shard: string;
}

/** Phần của phiếu do nơi dùng cung cấp (không đến từ lần cấp mã). */
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-[#555]">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-semibold">{value}</dd>
    </div>
  );
}

/**
 * Tờ phiếu giao mã mở gói cho Người thực thi. Nền trắng, chữ gần đen để in rõ; không có phần chữ ký.
 * Dùng cho bản hiện trên màn hình và bản in (cùng một nội dung).
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
      aria-label="Phiếu bàn giao mã mở gói"
      className="w-full max-w-full bg-white p-6 text-[#111] sm:p-8"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#111] pb-3">
        <p className="text-base font-bold tracking-wide">LegacyVault</p>
        <p className="text-xs font-semibold tracking-wider">
          TÀI LIỆU MẬT · CHỈ DÀNH CHO NGƯỜI THỰC THI
        </p>
      </header>

      <h3 className="mt-6 text-2xl font-bold">Phiếu bàn giao mã mở gói</h3>

      <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
        <Field label="Chủ kho" value={ownerName} />
        <Field label="Người thực thi giữ phiếu" value={executorEmail} />
        <Field label="Kho" value={vaultName} />
        <Field label="Tạo lúc" value={formatDateTime(issuedAt)} />
      </dl>

      <div className="mt-6 border-2 border-[#111] p-5">
        <p className="text-sm font-bold">Mã mở gói</p>
        <p className="text-xs text-[#555]">Bản {version} · một mã duy nhất cho mọi gói của kho</p>
        <p className="mt-3 break-words font-mono text-lg font-bold leading-8 tracking-wider">
          {renderShard(shard)}
        </p>
      </div>
      <p className="mt-2 text-xs leading-5 text-[#555]">
        Mã không có chữ I, L, O, U. Số 0 là số không, số 1 là số một. Gõ hoa hay thường, có gạch hay
        không đều được.
      </p>

      <h4 className="mt-6 text-sm font-bold">Việc của Người thực thi</h4>
      <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6">
        <li>
          <strong>Bây giờ:</strong> cất phiếu ở nơi an toàn, chưa đưa mã cho ai.
        </li>
        <li>
          <strong>Khi có biến cố:</strong> đăng nhập LegacyVault, nộp giấy chứng tử ở mục Báo tin.
        </li>
        <li>
          <strong>Sau khi hồ sơ được duyệt:</strong> trao mã cho người nhận theo hướng dẫn ở mục Bàn
          giao.
        </li>
      </ol>

      <footer className="mt-6 border-t border-[#999] pt-3 text-xs leading-5 text-[#555]">
        LegacyVault không lưu mã gốc. Mất phiếu thì báo Chủ kho đổi mã mới; mã cũ hết dùng được
        ngay.
      </footer>
    </section>
  );
}
