import { caseCode } from "@/shared/lib/caseCode";
import { formatDateTime } from "@/shared/ui/heritageKit";
import { divisionPeople, type DivisionAsset } from "../model/divisionView";
import type { HandoverRecord } from "../model/handoverRecord.schema";

const CELL = "border border-slate-300 px-2 py-1.5 align-top";
const HEAD = `${CELL} bg-slate-800 text-left font-bold text-white [-webkit-print-color-adjust:exact] [print-color-adjust:exact]`;
const HEADING = "mb-2 text-xs font-bold uppercase tracking-wider";

function noteText(asset: DivisionAsset, hasOwnerSplit: boolean): string {
  if (asset.people.length === 0) {
    return asset.differsFromOwner ? "Chưa chia (khác Chủ tài sản)" : "Chưa chia";
  }
  if (!hasOwnerSplit) return "—";
  return asset.differsFromOwner ? "Khác Chủ tài sản" : "Khớp Chủ tài sản";
}

/** Bản nháp biên bản bàn giao để luật sư soát và in ra trước khi chốt. Không phải biên bản đã ký. */
export function DivisionDraftSheet({
  record,
  assets,
}: {
  record: HandoverRecord;
  assets: DivisionAsset[];
}) {
  const people = divisionPeople(assets);
  const hasOwnerSplit = record.ownerSplit.length > 0;
  const divided = assets.filter((asset) => asset.people.length > 0).length;
  const differing = assets.filter((asset) => asset.differsFromOwner).length;
  let ownerText = "Chủ tài sản chưa lập cách chia";
  if (hasOwnerSplit) {
    ownerText =
      differing > 0
        ? `Có ${differing} tài sản khác dự kiến của Chủ tài sản`
        : "Khớp dự kiến của Chủ tài sản";
  }
  const info: [string, string][] = [
    ["Chủ tài sản", record.ownerName || "—"],
    ["Luật sư lập biên bản", record.verifierName || "—"],
    [
      "Tổng số tài sản",
      `${assets.length} (đã chia ${divided}, chưa chia ${assets.length - divided})`,
    ],
    ["Số người được chia", `${people.length}`],
    ["Đối chiếu", ownerText],
  ];
  return (
    <div className="space-y-5 font-serif text-[13px] leading-relaxed text-slate-900">
      <header className="flex items-start justify-between gap-4 border-b-2 border-slate-900 pb-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Hệ thống bàn giao tài sản LegacyVault
          </p>
          <h1 className="mt-1 text-xl font-bold">BIÊN BẢN BÀN GIAO TÀI SẢN</h1>
          <p className="text-xs font-semibold text-amber-800">
            BẢN NHÁP để kiểm tra, chưa có giá trị bàn giao
          </p>
        </div>
        <div className="shrink-0 text-right text-xs">
          <p>
            Mã biên bản: <strong>#{caseCode(record.id)}</strong>
          </p>
          <p>Ngày xem: {formatDateTime(new Date().toISOString())}</p>
        </div>
      </header>

      <section>
        <h2 className={HEADING}>I. Thông tin hồ sơ</h2>
        <dl className="space-y-1">
          {info.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-b border-slate-200 pb-1">
              <dt className="text-slate-500">{label}</dt>
              <dd className="text-right font-bold">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2 className={HEADING}>II. Chia theo từng tài sản</h2>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className={HEAD}>STT</th>
              <th className={HEAD}>Tên tài sản</th>
              <th className={HEAD}>Dự kiến của Chủ tài sản</th>
              <th className={HEAD}>Người nhận theo biên bản</th>
              <th className={HEAD}>Đối chiếu</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, index) => (
              <tr key={asset.assetId} className="break-inside-avoid">
                <td className={`${CELL} text-center`}>{index + 1}</td>
                <td className={`${CELL} font-bold`}>{asset.name}</td>
                <td className={CELL}>
                  {asset.ownerPeople.map((person) => person.fullName).join(", ") || "Chưa chia"}
                </td>
                <td className={CELL}>
                  {asset.people.length === 0 && "Chưa chia"}
                  {asset.people.map((person) => (
                    <p key={person.id}>{`${person.fullName} (${person.citizenId})`}</p>
                  ))}
                </td>
                <td className={CELL}>{noteText(asset, hasOwnerSplit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className={HEADING}>III. Tổng hợp theo người nhận</h2>
        {people.length === 0 ? (
          <p>Chưa có người nhận nào được chia tài sản.</p>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className={HEAD}>STT</th>
                <th className={HEAD}>Họ và tên</th>
                <th className={HEAD}>Số CCCD</th>
                <th className={HEAD}>Số tài sản</th>
                <th className={HEAD}>Tài sản được nhận</th>
              </tr>
            </thead>
            <tbody>
              {people.map((person, index) => (
                <tr key={person.id} className="break-inside-avoid">
                  <td className={`${CELL} text-center`}>{index + 1}</td>
                  <td className={`${CELL} font-bold`}>{person.fullName}</td>
                  <td className={CELL}>{person.citizenId}</td>
                  <td className={`${CELL} text-center`}>{person.assetNames.length}</td>
                  <td className={CELL}>{person.assetNames.join("; ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="flex break-inside-avoid justify-end pt-2">
        <div className="w-64 text-center">
          <p className="font-bold uppercase">Luật sư lập biên bản</p>
          <p className="text-xs italic text-slate-500">(Ký, ghi rõ họ tên)</p>
          <div className="h-20" />
          <p className="font-bold">{record.verifierName}</p>
        </div>
      </section>
    </div>
  );
}
