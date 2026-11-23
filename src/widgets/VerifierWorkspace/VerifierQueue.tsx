import { useSearchParams } from "react-router-dom";
import {
  VerifierRecordDetail,
  VerifierRecordList,
  VerifierReportList,
} from "@/entities/handoverRecord";

/**
 * Nội dung trang Biên bản bàn giao của luật sư: chưa chọn biên bản thì hiện danh sách, chọn rồi (?recordId=)
 * thì hiện ba bước của biên bản. Vai trò luật sư do Backend xác minh từ DB.
 */
export function VerifierQueue({ scope = "open" }: { scope?: "open" | "closed" }) {
  const [params, setParams] = useSearchParams();
  const recordId = params.get("recordId");
  const select = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set("recordId", id);
    else next.delete("recordId");
    setParams(next);
  };
  if (!recordId)
    return (
      <div className="space-y-6">
        {scope === "open" && <VerifierReportList onOpenRecord={select} />}
        <VerifierRecordList scope={scope} onSelect={select} />
      </div>
    );
  return <VerifierRecordDetail key={recordId} recordId={recordId} onBack={() => select(null)} />;
}
