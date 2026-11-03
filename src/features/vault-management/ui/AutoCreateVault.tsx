import { useEffect, useRef } from "react";
import { Button } from "@/shared/ui/button";
import { Notice } from "@/shared/ui/heritageKit";
import { useCreateOwnerVault } from "../model/useOwnerVault";

/**
 * Chưa có kho thì tự tạo đúng một lần, không hỏi tên (POST trả lại kho cũ nếu đã có).
 * Tạo xong, cache kho được làm mới nên màn bao ngoài tự hiện nội dung thật.
 */
export function AutoCreateVault() {
  const create = useCreateOwnerVault();
  const started = useRef(false);
  const { mutate } = create;
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    mutate();
  }, [mutate]);
  if (create.isError) {
    return (
      <Notice
        tone="danger"
        role="alert"
        title="Chưa chuẩn bị được kho"
        action={
          <Button disabled={create.isPending} onClick={() => mutate()}>
            Thử lại
          </Button>
        }
      >
        Kiểm tra mạng rồi bấm Thử lại.
      </Notice>
    );
  }
  return (
    <p role="status" className="text-sm text-heritage-muted">
      Đang chuẩn bị kho…
    </p>
  );
}
