import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSelector } from "react-redux";
import { X } from "lucide-react";
import type { z } from "zod";
import type { AuthState } from "@/entities/user/model/authSlice";
import type { WillGapTarget, WillIdentityStatus } from "@/entities/will/model/willDocument.types";
import { PrintWillButton } from "@/entities/will/ui/PrintWillButton";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";
import { StatusBanner } from "@/shared/ui/status-banner";
import { needsResign, pickOwnerSignedAt, pickWillExecutor } from "../lib/willView";
import type { planSetupSchema } from "../model/planSetup.schema";
import { useWillIdentity, WillPinNotConfirmedError } from "../model/useWillIdentity";
import { PlanWillDocument } from "./PlanWillDocument";
import { WillSignFooter, type WillSignNotice } from "./WillSignFooter";

type PlanSetup = z.infer<typeof planSetupSchema>;

/** Tên khung theo trạng thái: nháp (xem trước), đang chạy có thay đổi chưa ký (ký phiên bản mới), còn lại (đã ký). */
function drawerTitle(setup: PlanSetup): string {
  if (setup.planStatus === "DRAFT" && !setup.willAwaitingExecutor) {
    return "Xem trước biên bản phân chia";
  }
  if (needsResign(setup)) {
    return "Ký phiên bản mới của biên bản phân chia";
  }
  return "Biên bản phân chia đã ký";
}

/**
 * Câu dưới nút "Xuất file PDF": nói vì sao nút khóa hoặc xác nhận đã đủ điều kiện. Chủ tài sản ký lúc kích hoạt kế hoạch,
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

/** Dòng báo tình trạng tải danh tính phía trên tờ biên bản phân chia; không hiện khi đã tải xong. */
function IdentityNotice({ status, onRetry }: { status: WillIdentityStatus; onRetry: () => void }) {
  if (status === "loading") {
    return (
      <p role="status" className="mb-4 text-[13px] text-heritage-muted">
        Đang tải thông tin danh tính (ngày sinh, CCCD, thường trú) để điền vào biên bản phân chia…
      </p>
    );
  }
  if (status === "error") {
    return (
      <div
        role="alert"
        className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] font-medium text-heritage-danger"
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
 * Toàn bộ nội dung khung. Tách riêng để dữ liệu danh tính (CCCD đầy đủ) chỉ tồn tại khi khung đang mở: Dialog gỡ nội
 * dung khi đóng nên truy vấn (gcTime 0) và thông báo ký bị xóa theo.
 */
function WillDrawerBody({
  onOpenChange,
  vaultId,
  setup,
  onGapClick,
  identityQuery,
}: {
  onOpenChange: (open: boolean) => void;
  vaultId: string;
  setup: PlanSetup;
  onGapClick: (target: WillGapTarget) => void;
  identityQuery: ReturnType<typeof useWillIdentity>;
}) {
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  // Đã ký, chờ Người thực thi: khung chỉ để xem như bản đã ký.
  const isDraft = setup.planStatus === "DRAFT" && !setup.willAwaitingExecutor;
  const resignNeeded = needsResign(setup);
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
  const executor = pickWillExecutor(setup);
  let executorSigned = false;
  if (executor !== null && executor.signedAt) {
    executorSigned = true;
  }
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
      <div className="border-t border-heritage-border bg-heritage-canvas px-5 py-3">
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
          <DialogTitle className="text-lg font-semibold">{drawerTitle(setup)}</DialogTitle>
          <DialogDescription className="sr-only">
            Tờ biên bản phân chia điền sẵn từ kế hoạch bàn giao của tài sản.
          </DialogDescription>
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
      <div className="min-h-0 flex-1 overflow-y-auto bg-heritage-border">
        <div className="px-3 py-5 sm:px-8 sm:py-8">
          <IdentityNotice status={identityStatus} onRetry={() => void identityQuery.refetch()} />
          {/* Tờ giấy khổ A4 trên nền xám, giống khi mở file PDF. */}
          <article
            aria-label="Biên bản phân chia"
            className="mx-auto w-full max-w-[210mm] bg-white px-5 py-8 shadow-md sm:min-h-[297mm] sm:px-[20mm] sm:py-[18mm]"
          >
            {renderDocument("owner", onGapClick)}
          </article>
        </div>
        {/* Màn hẹp: phần ký nằm cuối biên bản, đọc hết mới tới. Từ màn rộng: dính đáy khung để ký ngay. */}
        {(isDraft || resignNeeded) && (
          <div className="sm:sticky sm:bottom-0">
            {noticeBlock}
            <WillSignFooter
              key={`${vaultId}:${setup.configVersion}:${setup.policyVersion}:${setup.planStatus}`}
              vaultId={vaultId}
              setup={setup}
              onNotice={setNotice}
            />
          </div>
        )}
      </div>
      {!(isDraft || resignNeeded) && noticeBlock}
    </>
  );
}

/**
 * Một lượt mở khung. Hỏi mã PIN trước (hộp PIN chung); chỉ khi PIN đúng khung mới hiện, đóng hộp PIN hoặc PIN bị khóa
 * thì đóng luôn. Lỗi khác (mạng) vẫn hiện khung kèm nút Thử lại. Danh tính (CCCD đầy đủ) chỉ tồn tại trong lượt mở
 * này: lượt kết thúc thì truy vấn (gcTime 0) bị xóa.
 */
function WillDrawerSession({
  open,
  onOpenChange,
  onOpenChangeComplete,
  onClosed,
  finalFocus,
  vaultId,
  setup,
  onGapClick,
}: WillPreviewDrawerProps & { onClosed: () => void }) {
  // PIN vừa xác nhận, chỉ giữ trong RAM để tải lại danh tính sau khi ký mà không hỏi lần nữa.
  const pinRef = useRef("");
  const identityQuery = useWillIdentity(vaultId, open, {
    getPin: () => pinRef.current,
    remember: (pin) => {
      pinRef.current = pin;
    },
  });
  const hasData = identityQuery.data !== undefined;
  const refused = !hasData && identityQuery.error instanceof WillPinNotConfirmedError;
  // Đã hiện rồi thì giữ nguyên khung trong lúc tải lại (nút Thử lại).
  const [shown, setShown] = useState(false);
  if (!shown && !refused && (hasData || identityQuery.isError)) {
    setShown(true);
  }

  useEffect(() => {
    if (refused) {
      onOpenChange(false);
    }
    // Chưa từng hiện khung thì không có hoạt ảnh đóng để chờ.
    if (refused || (!open && !shown)) {
      onClosed();
    }
  }, [refused, open, shown, onOpenChange, onClosed]);

  return (
    <Dialog
      open={open && shown && !refused}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={(isOpen) => {
        onOpenChangeComplete(isOpen);
        if (!isOpen && !open) {
          onClosed();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        aria-label={drawerTitle(setup)}
        finalFocus={(): HTMLElement | boolean => {
          const target = finalFocus();
          if (target !== null) {
            return target;
          }
          return true;
        }}
        className="flex h-[calc(100vh-2rem)] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[960px] motion-reduce:animate-none"
      >
        <WillDrawerBody
          onOpenChange={onOpenChange}
          vaultId={vaultId}
          setup={setup}
          onGapClick={onGapClick}
          identityQuery={identityQuery}
        />
      </DialogContent>
    </Dialog>
  );
}

interface WillPreviewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenChangeComplete: (open: boolean) => void;
  finalFocus: () => HTMLElement | null;
  vaultId: string;
  setup: PlanSetup;
  onGapClick: (target: WillGapTarget) => void;
}

/**
 * Khung xem trước biên bản phân chia hiện giữa màn hình, phóng to gần hết chiều cao (Base UI Dialog: giữ focus trong khung, Esc đóng, có aria-label).
 * Phải nhập đúng mã PIN của kho mới xem được. Chân khung là phần ký bằng mã PIN: "Ký và gửi Người thực thi" khi kế
 * hoạch còn nháp, "Ký phiên bản mới" khi kế hoạch đang chạy mà có thay đổi chưa ký; kế hoạch đang chạy không có thay đổi
 * thì khung chỉ để xem và xuất. Chỗ trống đỏ trong biên bản phân chia gọi `onGapClick` để nơi dùng đóng khung và đưa tới
 * đúng thẻ cần điền. `finalFocus` cho nơi dùng chọn phần tử nhận focus khi khung đóng.
 */
export function WillPreviewDrawer(props: WillPreviewDrawerProps) {
  // Giữ lượt mở tới khi khung đóng hẳn để còn hoạt ảnh đóng.
  const [alive, setAlive] = useState(false);
  if (props.open && !alive) {
    setAlive(true);
  }
  const [endSession] = useState(() => () => setAlive(false));
  if (!alive) {
    return null;
  }
  return <WillDrawerSession {...props} onClosed={endSession} />;
}
