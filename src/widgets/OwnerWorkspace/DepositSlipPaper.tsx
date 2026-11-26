import type { ReactNode } from "react";
import type { z } from "zod";
import { pickWillExecutor } from "@/features/plan-setup/lib/willView";
import type { planSetupSchema } from "@/features/plan-setup/model/planSetup.schema";
import { formatTimeThenDate } from "@/shared/lib/dateFormat";

type PlanSetup = z.infer<typeof planSetupSchema>;

const CELL = "border border-[#333] px-2.5 py-2 align-top";

/** Tên mọi tài sản đang gửi: đã gán (nhận chung chỉ ghi một lần) rồi tới chưa gán cho ai. */
function depositedAssetNames(setup: PlanSetup): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  if (setup.recipients !== undefined) {
    for (const recipient of setup.recipients) {
      for (const asset of recipient.assets) {
        if (!seen.has(asset.id)) {
          seen.add(asset.id);
          names.push(asset.name);
        }
      }
    }
  }
  for (const asset of setup.unassignedAssets) {
    if (!seen.has(asset.id)) {
      seen.add(asset.id);
      names.push(asset.name);
    }
  }
  return names;
}

/** Phiếu gửi của Chủ tài sản: gửi những tài sản nào, từ lúc nào, ai giữ. Giống vé gửi xe, không ghi nội dung tài sản. */
export function DepositSlipPaper({ setup }: { setup: PlanSetup }) {
  const executor = pickWillExecutor(setup);
  let executorName = "Chưa có";
  if (executor) {
    executorName = executor.email;
    if (executor.fullName) {
      executorName = executor.fullName;
    }
  }
  let ownerName = "…………………………";
  if (setup.ownerFullName) {
    ownerName = setup.ownerFullName;
  }
  let activatedText = "Chưa kích hoạt";
  if (setup.activatedAt) {
    activatedText = formatTimeThenDate(setup.activatedAt);
  }
  const rows: ReactNode[] = [];
  let order = 0;
  for (const name of depositedAssetNames(setup)) {
    order = order + 1;
    rows.push(
      <tr key={order}>
        <td className={`${CELL} text-center`}>{order}</td>
        <td className={CELL}>{name}</td>
      </tr>,
    );
  }
  return (
    <div className="text-[#111]" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
      <h2 className="text-center text-2xl font-bold tracking-[0.06em]">PHIẾU GỬI TÀI SẢN</h2>
      <p className="mt-1 text-center">LegacyVault giữ hộ tài sản theo phiếu này</p>
      <ol className="mt-6 list-none space-y-2 leading-7">
        <li>
          <span className="font-bold">Người gửi (Chủ tài sản): </span>
          {ownerName}
        </li>
        <li>
          <span className="font-bold">Gửi từ: </span>
          {activatedText}
        </li>
        <li>
          <span className="font-bold">Nhân viên phụ trách (Người thực thi): </span>
          {executorName}
        </li>
      </ol>
      <table className="mt-6 w-full border-collapse text-[15px]">
        <thead>
          <tr>
            <th scope="col" className={`${CELL} w-12 text-center`}>
              STT
            </th>
            <th scope="col" className={`${CELL} text-left`}>
              Tài sản
            </th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
      <p className="mt-6 text-justify leading-7">
        Quyền với tài sản vẫn thuộc Chủ tài sản; hệ thống chỉ giữ hộ và không xem nội dung. Người
        nhận muốn lấy phải gửi yêu cầu kèm giấy tờ; tài sản chỉ được giao theo biên bản bàn giao do
        luật sư ký.
      </p>
    </div>
  );
}
