import type { ReactNode } from "react";
import { Notice } from "@/shared/ui/heritageKit";
import type { SplitDifference } from "../model/handoverRecord.schema";
import { splitDifferenceText } from "../model/splitDifference";

/**
 * Khung cảnh báo cho luật sư: biên bản đang lập khác cách chia ban đầu của Chủ kho. Chỉ liệt kê; ô xác nhận bắt buộc
 * nằm cạnh nút Chốt. Không có khác biệt thì không hiện gì.
 */
export function SplitDeviationPanel({ differences }: { differences: SplitDifference[] }) {
  if (differences.length === 0) {
    return null;
  }
  const items: ReactNode[] = [];
  for (let index = 0; index < differences.length; index = index + 1) {
    items.push(<li key={index}>{splitDifferenceText(differences[index])}</li>);
  }
  return (
    <Notice tone="warning" title="Biên bản khác cách chia ban đầu của Chủ kho" role="status">
      <ul className="list-disc space-y-1 pl-5">{items}</ul>
    </Notice>
  );
}
