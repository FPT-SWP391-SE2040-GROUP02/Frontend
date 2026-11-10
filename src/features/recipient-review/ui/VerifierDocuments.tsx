import { Link } from "react-router-dom";
import { HandoverDocumentList, useVerifierDocuments } from "@/entities/handoverDocument";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles } from "@/shared/ui/heritageKit";

/**
 * Mục Biên Bản của Người xét duyệt: mọi biên bản của các kho mình đã duyệt hồ sơ chứng tử, mới nhất trước, lưu không giới hạn.
 * Biên bản đang chờ mình kiểm tra có nút mở hồ sơ để kiểm tra thủ công; biên bản xong ghi Hoàn tất.
 */
export function VerifierDocuments() {
  const query = useVerifierDocuments();
  if (query.isPending) return <p role="status">Đang tải các biên bản…</p>;
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p className="text-sm text-[#A32119]">
          Không tải được các biên bản. Bạn cần là Người xét duyệt đang hoạt động.
        </p>
        <button type="button" className={buttonStyles.outline} onClick={() => void query.refetch()}>
          Thử lại
        </button>
      </div>
    );
  }
  const waiting = query.data.filter(
    (document) => document.status === "WAIT_VERIFIER" && document.submissionId,
  );
  return (
    <div className="space-y-6">
      {waiting.length > 0 && (
        <section
          aria-label="Biên bản chờ bạn kiểm tra"
          className="space-y-2 rounded-xl border border-heritage-gold bg-heritage-gold-light p-4"
        >
          <h2 className="font-semibold text-heritage-primary">
            {waiting.length} biên bản người nhận đã ký chờ bạn kiểm tra
          </h2>
          <ul className="space-y-2 text-sm">
            {waiting.map((document) => (
              <li key={document.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {document.code} · Người nhận {document.recipient.fullName}
                </span>
                <Link
                  className={buttonStyles.gold}
                  to={`${ROUTES.NOTARY.RECIPIENTS}?submissionId=${document.submissionId}`}
                >
                  Mở để kiểm tra
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <HandoverDocumentList
        documents={query.data}
        viewer="verifier"
        emptyText="Chưa có biên bản nào trong các kho bạn đã duyệt hồ sơ chứng tử."
      />
    </div>
  );
}
