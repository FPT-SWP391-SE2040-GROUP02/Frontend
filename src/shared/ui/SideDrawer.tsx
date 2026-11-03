import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "./sheet";

export interface SideDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Hàng nút cuối ngăn kéo (Lưu, Hủy…). */
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Ngăn kéo bên phải để thêm, sửa hoặc chọn nhiều mà không rời trang.
 * Bẫy focus và phím Esc do `sheet.tsx` (Base UI Dialog) lo.
 */
export function SideDrawer({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
}: SideDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(next) => onOpenChange(next)}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        <SheetHeader className="pr-16">
          <SheetTitle className="text-xl text-heritage-primary">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <SheetClose
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Đóng"
              className="absolute right-3 top-3 size-11"
            />
          }
        >
          <X aria-hidden="true" />
        </SheetClose>
        <div className="min-h-0 flex-1 overflow-y-auto px-4">{children}</div>
        {footer && <SheetFooter className="border-t border-heritage-border">{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  );
}
