import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { executorWillService, type ExecutorWillSource } from "../api/executorWillService";
import { pickOwnerIdentity, pickWillRecipients } from "../lib/willPeople";
import { WillDocument } from "../ui/WillDocument";
import type { WillExecutorView } from "./willDocument.types";

/**
 * Tờ biên bản phân chia đầy đủ phía Người thực thi, dùng đúng WillDocument của Chủ tài sản. Chỉ tải khi khung mở và bỏ
 * ngay khi đóng (có CCCD). `onRead` chỉ gọi khi đã hiện đúng phiên bản `versionNo`, để không ai ký khi chưa thấy tờ.
 */
export function useExecutorWillPaper({
  source,
  versionNo,
  executor,
  onRead,
}: {
  source: ExecutorWillSource;
  /** Phiên bản nơi gọi đang chờ ký hoặc đang hiện; null khi Chủ tài sản chưa ký. */
  versionNo: number | null;
  executor: WillExecutorView;
  onRead?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: ["executor-will", source.kind, source.id, versionNo],
    queryFn: ({ signal }) => executorWillService.get(source, signal),
    enabled: open && versionNo !== null,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const data = query.data;
  const shown = open && data !== undefined && data.versionNo === versionNo;
  const latestRead = useRef(onRead);
  useEffect(() => {
    latestRead.current = onRead;
  });
  useEffect(() => {
    if (shown) latestRead.current?.();
  }, [shown]);

  let paper = <p className="text-center text-sm text-heritage-muted">Đang tải biên bản…</p>;
  if (versionNo === null) {
    paper = (
      <p className="text-center text-sm text-heritage-muted">
        Chủ tài sản chưa ký biên bản phân chia.
      </p>
    );
  } else if (data !== undefined) {
    paper = (
      <WillDocument
        ownerName={data.ownerName}
        ownerEmail={data.ownerEmail}
        signedAt={data.signedAt}
        executor={executor}
        recipients={pickWillRecipients(data, data.identity)}
        unassignedAssetCount={data.unassignedAssetCount}
        identityStatus="ready"
        ownerIdentity={pickOwnerIdentity(data.identity)}
      />
    );
  } else if (query.isError && !query.isFetching) {
    paper = (
      <div className="space-y-3 text-center text-sm">
        <p role="alert" className="text-heritage-danger">
          Không tải được biên bản phân chia.
        </p>
        <button type="button" className={buttonStyles.outline} onClick={() => void query.refetch()}>
          Thử lại
        </button>
      </div>
    );
  }

  return {
    paper,
    ready: data !== undefined,
    onOpen: () => setOpen(true),
    onClose: () => setOpen(false),
  };
}
