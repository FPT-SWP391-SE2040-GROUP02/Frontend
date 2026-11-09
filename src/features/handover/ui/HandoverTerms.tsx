import { CircleCheck, CircleX } from "lucide-react";

/**
 * Điều khoản của hai lựa chọn, đặt ngay trước nút quyết định (theo prototype): người nhận đọc rõ mình đồng ý với điều gì
 * rồi mới chọn. Chỉ là nội dung giải thích, không gửi gì lên máy chủ.
 */
export function HandoverTerms({ groupName }: { groupName: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" aria-label="Điều khoản của hai lựa chọn">
      <section className="rounded-2xl border border-[#2E9E6E]/40 bg-[#F3FAF6] p-4">
        <h4 className="flex items-center gap-2 font-semibold text-[#1F7A55]">
          <CircleCheck className="size-5" aria-hidden="true" />
          Chấp nhận
        </h4>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6">
          <li>Nhận các tài sản trong nhóm “{groupName}”.</li>
          <li>Tự làm thủ tục ngoài đời cho tài sản có giấy tờ.</li>
          <li>Thực hiện nghĩa vụ tài sản của người mất trong phạm vi di sản nhận được.</li>
          <li>Sau khi đồng ý thì không đổi sang từ chối trong hệ thống.</li>
        </ul>
        <p className="mt-2 text-xs text-heritage-muted">
          Bộ luật Dân sự 2015, Điều 614, 615 và 621.
        </p>
      </section>
      <section className="rounded-2xl border border-[#A32119]/30 bg-[#FDF3F1] p-4">
        <h4 className="flex items-center gap-2 font-semibold text-[#A32119]">
          <CircleX className="size-5" aria-hidden="true" />
          Từ chối
        </h4>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6">
          <li>Không nhận tài sản nào trong nhóm “{groupName}”.</li>
          <li>
            <b>Tài sản của nhóm này coi như biến mất, không giao cho ai.</b>
          </li>
          <li>Không được từ chối để trốn tránh nghĩa vụ tài sản.</li>
          <li>Sau khi từ chối thì không rút lại được.</li>
        </ul>
        <p className="mt-2 text-xs text-heritage-muted">Bộ luật Dân sự 2015, Điều 620.</p>
      </section>
    </div>
  );
}
