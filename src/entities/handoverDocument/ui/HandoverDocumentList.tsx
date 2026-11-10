import { useId, useState } from "react";
import { Chip } from "@/shared/ui/heritageKit";
import { formatDateTime } from "@/shared/lib/dateFormat";
import {
  DOCUMENT_KIND_LABELS,
  DOCUMENT_STATUS_LABELS,
  type HandoverDocument,
} from "../model/handoverDocument.schema";
import { HandoverDocumentText } from "./HandoverDocumentText";
import { SlidePanel, SlideToggle } from "./SlidePanel";

export type DocumentViewer = "recipient" | "executor" | "verifier";

/** Nhãn trạng thái: chỉ hai kiểu để nhìn là biết xong hay chưa. Chưa xong ghi rõ đang chờ ai. */
export function DocumentStatusChip({ document }: { document: HandoverDocument }) {
  if (document.status === "COMPLETED") return <Chip tone="success">Hoàn tất</Chip>;
  return <Chip tone="neutral">Chưa xong</Chip>;
}

function Step({ time, children }: { time: string | null; children: string }) {
  return (
    <li className="grid gap-1 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-3">
      <time className="text-xs text-heritage-muted">{time ? formatDateTime(time) : "—"}</time>
      <span>{children}</span>
    </li>
  );
}

/** Dòng thời gian ký của một biên bản và nút xem toàn văn. Dùng trong danh sách và trong thẻ biên bản đã ký. */
export function HandoverDocumentDetail({ document }: { document: HandoverDocument }) {
  const [full, setFull] = useState(false);
  const textId = useId();
  const { recipient, verifier } = document;
  const kind = document.kind === "ACCEPT" ? "Chấp nhận" : "Từ chối";
  return (
    <div className="space-y-3">
      <ul className="space-y-1.5 text-sm">
        <Step
          time={document.createdAt}
        >{`Người nhận chọn ${kind}. Thông tin về Chủ kho lấy từ hồ sơ chứng tử đã duyệt.`}</Step>
        <Step time={recipient.signedAt}>
          {recipient.signedAt
            ? "Người nhận điền thông tin của mình, ký và gửi."
            : "Chờ người nhận điền thông tin và ký."}
        </Step>
        <Step time={verifier.signedAt}>
          {verifier.signedAt
            ? `Người xét duyệt ${verifier.signedByName} kiểm tra thủ công và gửi. Hoàn tất.`
            : "Chờ Người xét duyệt kiểm tra thủ công."}
        </Step>
      </ul>
      {document.supplementReason && document.status === "WAIT_RECIPIENT" && (
        <p className="text-sm text-heritage-muted">
          Người xét duyệt đã trả về: {document.supplementReason}
        </p>
      )}
      <SlideToggle controls={textId} open={full} onToggle={() => setFull((value) => !value)}>
        {full ? "Ẩn toàn văn" : "Xem toàn văn biên bản"}
      </SlideToggle>
      <SlidePanel id={textId} open={full}>
        <div className="max-h-[60vh] overflow-y-auto pt-1">
          <HandoverDocumentText document={document} blank={document.status !== "COMPLETED"} />
        </div>
      </SlidePanel>
    </div>
  );
}

function subtitle(document: HandoverDocument, viewer: DocumentViewer): string {
  const parts = [document.code];
  if (viewer !== "recipient") {
    parts.push(`Người nhận ${document.recipient.fullName || "—"}`);
  }
  if (viewer !== "executor") {
    parts.push(`Kho ${document.owner.fullName || "—"}`);
  }
  parts.push(
    document.status === "COMPLETED"
      ? `hoàn tất ${formatDateTime(document.completedAt ?? document.createdAt)}`
      : DOCUMENT_STATUS_LABELS[document.status],
  );
  return parts.join(" · ");
}

/**
 * Mục Biên Bản: mọi biên bản của người xem, mới nhất trước, lưu không giới hạn thời gian để xem lại bất cứ lúc nào.
 * Biên bản xong ghi Hoàn tất; biên bản đang làm nền xám nhạt, viền đứt và ghi Chưa xong.
 */
export function HandoverDocumentList({
  documents,
  viewer,
  emptyText,
}: {
  documents: HandoverDocument[];
  viewer: DocumentViewer;
  emptyText: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  if (documents.length === 0) {
    return (
      <p
        role="status"
        className="rounded-xl border border-dashed border-heritage-border bg-white px-4 py-5 text-sm text-heritage-muted"
      >
        {emptyText}
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {documents.map((document) => {
        const open = openId === document.id;
        const done = document.status === "COMPLETED";
        return (
          <li
            key={document.id}
            className={`rounded-xl border ${
              done
                ? "border-heritage-border bg-white"
                : "border-dashed border-heritage-border bg-[#F3F1EC] text-[#6f7872]"
            }`}
          >
            <button
              type="button"
              aria-expanded={open}
              className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-heritage-gold"
              onClick={() => setOpenId(open ? null : document.id)}
            >
              <span className="min-w-0">
                <span className={`block font-semibold ${done ? "text-heritage-primary" : ""}`}>
                  {DOCUMENT_KIND_LABELS[document.kind]}
                  {document.containerName ? ` · ${document.containerName}` : ""}
                </span>
                <span className="block text-xs text-heritage-muted">
                  {subtitle(document, viewer)}
                </span>
              </span>
              <DocumentStatusChip document={document} />
            </button>
            {open && (
              <div className="border-t border-heritage-border bg-white px-4 py-4">
                <HandoverDocumentDetail document={document} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
