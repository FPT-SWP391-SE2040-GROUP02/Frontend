import type { ReactNode } from "react";
import { formatDateTime } from "@/shared/ui/heritageKit";
import { orBlank } from "../model/paperFormat";

/** Một ô ký: chức danh, tên, và dòng "Đã ký điện tử lúc …" hoặc chỗ trống chờ ký. */
export function SignatureSlot({
  role,
  name,
  signedAt,
  action,
}: {
  role: string;
  name: string;
  signedAt: string | null;
  /** Nút ký đặt ngay dưới ô này, chỉ hiện trên màn hình (không in ra giấy). */
  action?: ReactNode;
}) {
  let status: ReactNode = <p className="mt-10 text-sm italic text-[#666]">(Chưa ký)</p>;
  if (signedAt) {
    status = (
      <p className="pm-stamp mt-3 rounded border border-[#2f6b4f] px-2 py-3 text-sm font-semibold text-[#2f6b4f]">
        Đã ký điện tử
        <br />
        <span className="font-normal">{formatDateTime(signedAt)}</span>
      </p>
    );
  }
  return (
    <div className="break-inside-avoid text-center">
      <p className="font-bold uppercase">{role}</p>
      <p className="text-sm italic">(Ký, ghi rõ họ tên)</p>
      {status}
      {action && <div className="mt-3 flex flex-col items-center gap-2 print:hidden">{action}</div>}
      <p className="mt-3 font-bold">{orBlank(name)}</p>
    </div>
  );
}

/** Khung tờ giấy: quốc hiệu, tiêu đề rồi nội dung. */
export function PaperFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="text-[#111]" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
      <header className="text-center leading-6">
        <p className="font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
        <p className="inline-block border-b border-[#111] pb-1 font-bold">
          Độc lập – Tự do – Hạnh phúc
        </p>
      </header>
      <h2 className="mt-7 text-center text-2xl font-bold tracking-[0.06em]">{title}</h2>
      <p className="mt-1 text-center">{subtitle}</p>
      {children}
      <p className="mt-8 text-[13px] italic leading-5 text-[#555]">
        Chữ ký điện tử là bấm xác nhận bằng tài khoản LegacyVault; hệ thống lưu người ký và thời
        điểm.
      </p>
    </div>
  );
}
