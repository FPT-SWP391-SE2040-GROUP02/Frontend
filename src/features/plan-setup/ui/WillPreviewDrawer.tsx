import { useState, type ReactNode } from "react";
import { useSelector } from "react-redux";
import { X } from "lucide-react";
import type { z } from "zod";
import type { AuthState } from "@/entities/user/model/authSlice";
import type { WillGapTarget, WillIdentityStatus } from "@/entities/will/model/willDocument.types";
import { PrintWillButton } from "@/entities/will/ui/PrintWillButton";
import { Button } from "@/shared/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/shared/ui/sheet";
import { StatusBanner } from "@/shared/ui/status-banner";
import { needsResign, pickOwnerSignedAt, pickWillExecutor } from "../lib/willView";
import type { planSetupSchema } from "../model/planSetup.schema";
import { useWillIdentity } from "../model/useWillIdentity";
import { PlanWillDocument } from "./PlanWillDocument";
import { WillSignFooter, type WillSignNotice } from "./WillSignFooter";

type PlanSetup = z.infer<typeof planSetupSchema>;

/** Tên khung theo trạng thái: nháp (xem trước), đang chạy có thay đổi chưa ký (ký phiên bản mới), còn lại (đã ký). */
function drawerTitle(setup: PlanSetup): string {
  if (setup.planStatus === "DRAFT") {
    return "Xem trước di chúc";
  }
  if (needsResign(setup)) {
    return "Ký phiên bản mới của di chúc";
  }
  return "Di chúc đã ký";
}

/**
 * Câu dưới nút "Xuất file PDF": nói vì sao nút khóa hoặc xác nhận đã đủ điều kiện. Chủ kho ký lúc kích hoạt kế hoạch,
 * Người thực thi ký khi nhận vai; cả hai lấy từ dữ liệu thật của Backend. Tờ in phải có đủ danh tính và khớp bản ký.
 */
function exportHint(
  ownerSigned: boolean,
  executorSigned: boolean,
  resignNeeded: boolean,
  identityStatus: WillIdentityStatus,
): string {
  if (!ownerSigned) {
    return "Xuất được sau khi 2 bên đã ký";
  }
  if (!executorSigned) {
    return "Chờ Người thực thi ký";
  }
  if (resignNeeded) {
    return "Ký phiên bản mới trước khi xuất";
  }
  if (identityStatus === "loading") {
    return "Đang tải thông tin danh tính…";
  }
  if (identityStatus === "error") {
    return "Cần tải được thông tin danh tính";
  }
  return "Đã đủ 2 chữ ký";
}

/** Dòng báo tình trạng tải danh tính phía trên tờ di chúc; không hiện khi đã tải xong. */
function IdentityNotice({ status, onRetry }: { status: WillIdentityStatus; onRetry: () => void }) {
  if (status === "loading") {
    return (
      <p role="status" className="mb-4 text-[13px] text-heritage-muted">
        Đang tải thông tin danh tính (ngày sinh, CCCD, thường trú) để điền vào di chúc…
      </p>
    );
  }
  if (status === "error") {
    return (
      <div
        role="alert"
        className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] font-medium text-[#a32119]"
      >
        <p>Chưa tải được thông tin danh tính nên chưa xuất được file PDF.</p>
        <Button variant="outline" onClick={onRetry}>
          Thử lại
        </Button>
      </div>
    );
  }
  return null;
}

/**
 * Toàn bộ nội dung khung. Tách riêng để dữ liệu danh tính (CCCD đầy đủ) chỉ tồn tại khi khung đang mở: Sheet gỡ nội
 * dung khi đóng nên truy vấn (gcTime 0) và thông báo ký bị xóa theo.
 */
function WillDrawerBody({
  open,
  onOpenChange,
  vaultId,
  setup,
  onGapClick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaultId: string;
  setup: PlanSetup;
  onGapClick: (target: WillGapTarget) => void;
}) {
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  const identityQuery = useWillIdentity(vaultId, open);
  const [notice, setNotice] = useState<WillSignNotice | null>(null);

  let ownerFallback = { fullName: "", email: "" };
  if (user) {
    ownerFallback = { fullName: user.fullName, email: user.email };
  }
  let identityStatus: WillIdentityStatus = "loading";
  if (identityQuery.data !== undefined) {
    identityStatus = "ready";
  } else if (identityQuery.isError && !identityQuery.isFetching) {
    identityStatus = "error";
  }

  const ownerSigned = pickOwnerSignedAt(setup) !== null;
  const executor = pickWillExecutor(setup.executors);
  let executorSigned = false;
  if (executor !== null && executor.signedAt) {
    executorSigned = true;
  }
  const isDraft = setup.planStatus === "DRAFT";
  const resignNeeded = needsResign(setup);
  const canExport = ownerSigned && executorSigned && !resignNeeded && identityStatus === "ready";

  function renderDocument(
    viewer: "owner" | "reader",
    gapHandler?: (target: WillGapTarget) => void,
  ): ReactNode {
    return (
      <PlanWillDocument
        setup={setup}
        ownerFallback={ownerFallback}
        viewer={viewer}
        onGapClick={gapHandler}
        identityStatus={identityStatus}
        identity={identityQuery.data}
      />
    );
  }

  let noticeBlock: ReactNode = null;
  if (notice !== null) {
    noticeBlock = (
      <div className="shrink-0 border-t border-heritage-border bg-heritage-canvas px-5 py-3">
        <StatusBanner tone={notice.tone}>
          <p>{notice.text}</p>
        </StatusBanner>
      </div>
    );
  }

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-x-3 gap-y-2 border-b border-heritage-border px-5 py-3.5">
        <div className="min-w-0">
          <SheetTitle className="text-[17px] font-semibold">{drawerTitle(setup)}</SheetTitle>
          <SheetDescription className="sr-only">
            Tờ di chúc điền sẵn từ kế hoạch bàn giao của kho.
          </SheetDescription>
        </div>
        <div className="ml-auto flex items-start gap-3">
          <div className="text-right">
            <PrintWillButton
              label="Xuất file PDF"
              disabled={!canExport}
              describedBy="will-export-hint"
              content={renderDocument("reader")}
            />
            <p id="will-export-hint" className="mt-1 text-xs text-heritage-muted">
              {exportHint(ownerSigned, executorSigned, resignNeeded, identityStatus)}
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={() => onOpenChange(false)}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-heritage-text hover:bg-heritage-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
          >
            <X className="size-6" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
        <IdentityNotice status={identityStatus} onRetry={() => void identityQuery.refetch()} />
        <article aria-label="Di chúc" className="min-w-0">
          {renderDocument("owner", onGapClick)}
        </article>
      </div>
      {noticeBlock}
      {(isDraft || resignNeeded) && (
        <WillSignFooter
          key={`${vaultId}:${setup.configVersion}:${setup.policyVersion}:${setup.planStatus}`}
          vaultId={vaultId}
          setup={setup}
          onNotice={setNotice}
        />
      )}
    </>
  );
}

/**
 * Khung xem trước di chúc trượt ra từ bên phải (Base UI Dialog: giữ focus trong khung, Esc đóng, có aria-label).
 * Chân khung là phần ký bằng mã PIN: "Ký và kích hoạt" khi kế hoạch còn nháp, "Ký phiên bản mới" khi kế hoạch đang chạy
 * mà có thay đổi chưa ký; kế hoạch đang chạy không có thay đổi thì khung chỉ để xem và xuất. Danh tính đầy đủ (CCCD, ngày
 * sinh, thường trú) tải khi khung mở; chưa có thì nút xuất khóa. Chỗ trống đỏ trong di chúc gọi `onGapClick` để nơi dùng
 * đóng khung và đưa tới đúng thẻ cần điền. `finalFocus` cho nơi dùng chọn phần tử nhận focus khi khung đóng.
 */
export function WillPreviewDrawer({
  open,
  onOpenChange,
  onOpenChangeComplete,
  finalFocus,
  vaultId,
  setup,
  onGapClick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenChangeComplete: (open: boolean) => void;
  finalFocus: () => HTMLElement | null;
  vaultId: string;
  setup: PlanSetup;
  onGapClick: (target: WillGapTarget) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
      <SheetContent
        side="right"
        showCloseButton={false}
        aria-label={drawerTitle(setup)}
        finalFocus={(): HTMLElement | boolean => {
          const target = finalFocus();
          if (target !== null) {
            return target;
          }
          return true;
        }}
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[640px] motion-reduce:transition-none"
      >
        <WillDrawerBody
          open={open}
          onOpenChange={onOpenChange}
          vaultId={vaultId}
          setup={setup}
          onGapClick={onGapClick}
        />
      </SheetContent>
    </Sheet>
  );
}
