import { useEffect, useRef, useState, type ReactNode } from "react";
import type { WillGapTarget } from "@/entities/will/model/willDocument.types";
import { Button } from "@/shared/ui/button";
import { needsResign } from "../lib/willView";
import { usePlanSetup } from "../model/usePlanSetup";
import { HandoverProgressCard } from "./HandoverProgressCard";
import { handoverTaskElementId, type HandoverTaskId } from "../lib/handoverTasks";
import { HandoverTaskCards } from "./HandoverTaskCards";
import { UnsignedChangesBanner } from "./UnsignedChangesBanner";
import { WillPreviewDrawer } from "./WillPreviewDrawer";

/** Thẻ nháy sáng bao lâu (ms) sau khi Chủ kho bấm chỗ trống trong di chúc. */
const FLASH_MS = 1800;

/** Chỗ trống trong di chúc ứng với thẻ việc nào. */
function taskForGap(target: WillGapTarget): HandoverTaskId {
  if (target === "executor") {
    return "executor";
  }
  return "packages";
}

function findTaskElement(task: HandoverTaskId): HTMLElement | null {
  return document.getElementById(handoverTaskElementId(task));
}

/** Người dùng chọn giảm chuyển động thì cuộn tức thì thay vì cuộn mượt. */
function scrollBehavior(): ScrollBehavior {
  if (typeof window.matchMedia === "function") {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return "auto";
    }
  }
  return "smooth";
}

/**
 * Màn Bàn giao của Chủ kho: cột trái là các thẻ việc (cộng `belowCards` do widget ghép, ví dụ điểm danh và mã mở gói),
 * cột phải (dính khi cuộn trên máy tính, xuống dưới trên điện thoại) là tiến độ và nút mở khung xem trước di chúc.
 * Khung xem trước trượt từ phải; bấm chỗ trống đỏ trong di chúc thì đóng khung, cuộn tới và nháy sáng đúng thẻ cần điền.
 * Quyền, trạng thái và điều kiện ký luôn do Backend quyết định. Feature này không import feature khác nên các thẻ
 * ngoài plan-setup do widget truyền vào qua `belowCards` và `sideNote`.
 */
export function PlanSetupPanel({
  vaultId,
  belowCards,
  sideNote,
}: {
  vaultId: string;
  belowCards?: ReactNode;
  sideNote?: ReactNode;
}) {
  const query = usePlanSetup(vaultId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [flashTask, setFlashTask] = useState<HandoverTaskId | null>(null);
  // Thẻ cần đưa tới sau khi khung đóng hẳn; ref vì chỉ đọc lúc đóng, không cần vẽ lại.
  const pendingTask = useRef<HandoverTaskId | null>(null);

  useEffect(() => {
    if (flashTask === null) {
      return;
    }
    const timer = window.setTimeout(() => setFlashTask(null), FLASH_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [flashTask]);

  if (query.isPending) {
    return <p role="status">Đang kiểm tra điều kiện kích hoạt…</p>;
  }
  if (query.isError) {
    return (
      <div role="alert">
        <p>Không tải được điều kiện kích hoạt.</p>
        <Button onClick={() => void query.refetch()} disabled={query.isFetching}>
          Thử lại
        </Button>
      </div>
    );
  }
  const setup = query.data;

  function handleGapClick(target: WillGapTarget): void {
    pendingTask.current = taskForGap(target);
    setDrawerOpen(false);
  }

  function handleFinalFocus(): HTMLElement | null {
    if (pendingTask.current === null) {
      return null;
    }
    return findTaskElement(pendingTask.current);
  }

  function handleOpenChangeComplete(open: boolean): void {
    if (open || pendingTask.current === null) {
      return;
    }
    // Chưa xóa pendingTask: Base UI còn hỏi finalFocus để đưa focus về thẻ này; lần mở sau mới xóa.
    const task = pendingTask.current;
    const element = findTaskElement(task);
    if (element !== null && typeof element.scrollIntoView === "function") {
      element.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
    }
    setFlashTask(task);
  }

  function handleOpenChange(open: boolean): void {
    if (open) {
      pendingTask.current = null;
    }
    setDrawerOpen(open);
  }

  return (
    <>
      {needsResign(setup) && (
        <UnsignedChangesBanner
          changes={setup.unsignedChanges}
          onOpenPreview={() => handleOpenChange(true)}
        />
      )}
      <div className="grid max-w-[1180px] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <HandoverTaskCards
            vaultId={vaultId}
            setup={setup}
            flashTask={flashTask}
            readOnly={setup.planStatus !== "DRAFT"}
          />
          {belowCards}
        </div>
        <div className="min-w-0 space-y-5 lg:sticky lg:top-6">
          <HandoverProgressCard setup={setup} onOpenPreview={() => handleOpenChange(true)} />
          {sideNote}
        </div>
      </div>
      <WillPreviewDrawer
        open={drawerOpen}
        onOpenChange={handleOpenChange}
        onOpenChangeComplete={handleOpenChangeComplete}
        finalFocus={handleFinalFocus}
        vaultId={vaultId}
        setup={setup}
        onGapClick={handleGapClick}
      />
    </>
  );
}
