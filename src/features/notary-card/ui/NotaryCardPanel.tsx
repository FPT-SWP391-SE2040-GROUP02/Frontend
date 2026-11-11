import { BadgeCheck, IdCard } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Chip, Notice, Panel, formatDateTime } from "@/shared/ui/heritageKit";
import { useNotaryCardImage, useNotaryCardStatus } from "../model/useNotaryCard";

/**
 * Mục Thẻ công chứng viên ở trang Cài đặt của Người xét duyệt: chỉ xem ảnh thẻ do quản trị viên nộp.
 * Muốn nộp hoặc đổi ảnh thì liên hệ quản trị viên. Chưa có thẻ thì Backend chặn duyệt hồ sơ và gửi biên bản
 * (reason NOTARY_CARD_REQUIRED).
 */
export function NotaryCardPanel() {
  const status = useNotaryCardStatus();
  const hasCard = status.data?.hasCard === true;
  const image = useNotaryCardImage(hasCard, status.data?.uploadedAt);

  let chip = <Chip tone="neutral">Đang tải</Chip>;
  if (status.isError) chip = <Chip tone="danger">Không tải được</Chip>;
  else if (status.data) {
    chip = hasCard ? (
      <Chip tone="success" className="gap-1">
        <BadgeCheck className="size-3.5" aria-hidden="true" />
        Đã có thẻ
      </Chip>
    ) : (
      <Chip tone="warning">Chưa có thẻ</Chip>
    );
  }

  let caption = "Đang tải ảnh thẻ";
  if (image.failed) caption = "Chưa tải được ảnh thẻ. Tải lại trang để thử lại.";
  else if (image.url && status.data?.uploadedAt)
    caption = `Quản trị viên nộp lúc ${formatDateTime(status.data.uploadedAt)}`;
  else if (image.url) caption = "Ảnh thẻ do quản trị viên nộp";

  return (
    <Panel title="Thẻ công chứng viên" labelledBy="notary-card-title" action={chip}>
      <p className="-mt-2 mb-5 max-w-2xl text-sm leading-6 text-heritage-muted">
        Ảnh thẻ dùng để xác nhận bạn là công chứng viên khi duyệt hồ sơ chứng tử và ký biên bản bàn
        giao. Ảnh do quản trị viên nộp và lưu mã hóa; bạn chỉ xem. Muốn nộp hoặc đổi ảnh, hãy liên
        hệ quản trị viên.
      </p>

      {status.isError && (
        <Notice
          tone="danger"
          role="alert"
          action={
            <Button variant="outline" onClick={() => void status.refetch()}>
              Thử lại
            </Button>
          }
        >
          Chưa tải được tình trạng thẻ.
        </Notice>
      )}

      {status.data && !hasCard && (
        <Notice tone="warning" role="status" title="Tài khoản của bạn chưa có ảnh thẻ">
          Chưa có ảnh thẻ thì bạn chưa duyệt được hồ sơ và chưa gửi được biên bản. Hãy liên hệ quản
          trị viên để nộp thẻ.
        </Notice>
      )}

      {hasCard && (
        <figure className="max-w-xl min-w-0">
          <div className="flex aspect-[1.6/1] w-full items-center justify-center overflow-hidden rounded-2xl border border-heritage-border bg-[#F4F1E6]">
            {image.url ? (
              <img
                src={image.url}
                alt="Ảnh thẻ công chứng viên của bạn"
                className="size-full object-contain"
              />
            ) : (
              <IdCard className="size-10 text-heritage-muted" aria-hidden="true" />
            )}
          </div>
          <figcaption className="mt-2 text-xs text-heritage-muted">{caption}</figcaption>
        </figure>
      )}
    </Panel>
  );
}
