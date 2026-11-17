import { useSelector } from "react-redux";
import { X } from "lucide-react";
import type { z } from "zod";
import type { AuthState } from "@/entities/user/model/authSlice";
import type { WillGapTarget } from "@/entities/will/model/willDocument.types";
import { PrintWillButton } from "@/entities/will/ui/PrintWillButton";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/shared/ui/sheet";
import { pickOwnerSignedAt, pickWillExecutor } from "../lib/willView";
import type { planSetupSchema } from "../model/planSetup.schema";
import { PlanWillDocument } from "./PlanWillDocument";
import { WillSignFooter } from "./WillSignFooter";

type PlanSetup = z.infer<typeof planSetupSchema>;

/**
 * Câu dưới nút "Xuất file PDF": nói vì sao nút khóa hoặc xác nhận đã đủ hai chữ ký. Chủ kho ký lúc kích hoạt kế hoạch,
 * Người thực thi ký khi nhận vai; cả hai lấy từ dữ liệu thật của Backend.
 */
function exportHint(ownerSigned: boolean, executorSigned: boolean): string {
  if (ownerSigned && executorSigned) {
    return "Đã đủ 2 chữ ký";
  }
  if (ownerSigned) {
    return "Chờ Người thực thi ký";
  }
  return "Xuất được sau khi 2 bên đã ký";
}

/**
 * Khung xem trước di chúc trượt ra từ bên phải (Base UI Dialog: giữ focus trong khung, Esc đóng, có aria-label).
 * Chân khung là phần ký bằng mã PIN khi kế hoạch còn nháp. Chỗ trống đỏ trong di chúc gọi `onGapClick` để nơi dùng
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
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  let ownerFallback = { fullName: "", email: "" };
  if (user) {
    ownerFallback = { fullName: user.fullName, email: user.email };
  }
  const ownerSigned = pickOwnerSignedAt(setup) !== null;
  const executor = pickWillExecutor(setup.executors);
  let executorSigned = false;
  if (executor !== null && executor.signedAt) {
    executorSigned = true;
  }
  const canExport = ownerSigned && executorSigned;
  const isDraft = setup.planStatus === "DRAFT";
  let title = "Di chúc đã ký";
  if (isDraft) {
    title = "Xem trước di chúc";
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
      <SheetContent
        side="right"
        showCloseButton={false}
        aria-label={title}
        finalFocus={(): HTMLElement | boolean => {
          const target = finalFocus();
          if (target !== null) {
            return target;
          }
          return true;
        }}
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[640px] motion-reduce:transition-none"
      >
        <div className="flex shrink-0 flex-wrap items-start justify-between gap-x-3 gap-y-2 border-b border-heritage-border px-5 py-3.5">
          <div className="min-w-0">
            <SheetTitle className="text-[17px] font-semibold">{title}</SheetTitle>
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
                content={
                  <PlanWillDocument setup={setup} ownerFallback={ownerFallback} viewer="reader" />
                }
              />
              <p id="will-export-hint" className="mt-1 text-xs text-heritage-muted">
                {exportHint(ownerSigned, executorSigned)}
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
          <article aria-label="Di chúc" className="min-w-0">
            <PlanWillDocument
              setup={setup}
              ownerFallback={ownerFallback}
              viewer="owner"
              onGapClick={onGapClick}
            />
          </article>
        </div>
        {isDraft && (
          <WillSignFooter
            key={`${vaultId}:${setup.configVersion}:${setup.policyVersion}:${setup.planStatus}`}
            vaultId={vaultId}
            setup={setup}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
