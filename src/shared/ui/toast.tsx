// ==============================================================================
// SWP391 - LegacyVault: Shared Toast Notification System
// Hệ thống Toast thông báo tương tác nổi (Success, Error, Info, Warning)
// ==============================================================================

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "cn";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (options: { type?: ToastType; title?: string; message: string; duration?: number }) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let globalToastHandler: ((item: Omit<ToastItem, "id">) => void) | null = null;

/**
 * @description Tiện ích gọi Toast mọi lúc mọi nơi ngoài React component lifecycle.
 */
export const toast = {
  success: (message: string, title: string = "Thành công") => {
    globalToastHandler?.({ type: "success", title, message });
  },
  error: (message: string, title: string = "Lỗi") => {
    globalToastHandler?.({ type: "error", title, message });
  },
  info: (message: string, title: string = "Thông báo") => {
    globalToastHandler?.({ type: "info", title, message });
  },
  warning: (message: string, title: string = "Cảnh báo") => {
    globalToastHandler?.({ type: "warning", title, message });
  },
};

/**
 * @description Provider cung cấp Context và render Toaster thông báo toàn ứng dụng.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = "info", title, message, duration = 4000 }: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  // Gán handler cho global toast object
  React.useEffect(() => {
    globalToastHandler = addToast;
    return () => {
      globalToastHandler = null;
    };
  }, [addToast]);

  const value: ToastContextValue = {
    toast: addToast,
    success: (msg, title) => addToast({ type: "success", message: msg, title: title || "Thành công" }),
    error: (msg, title) => addToast({ type: "error", message: msg, title: title || "Lỗi" }),
    info: (msg, title) => addToast({ type: "info", message: msg, title: title || "Thông báo" }),
    warning: (msg, title) => addToast({ type: "warning", message: msg, title: title || "Cảnh báo" }),
    removeToast,
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-destructive shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-[#B88E4C] shrink-0" />;
      case "info":
      default:
        return <Info className="w-5 h-5 text-primary dark:text-emerald-400 shrink-0" />;
    }
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "border-emerald-600/30 bg-emerald-50/90 dark:bg-emerald-950/80";
      case "error":
        return "border-destructive/30 bg-red-50/90 dark:bg-red-950/80";
      case "warning":
        return "border-[#B88E4C]/40 bg-[#FBF7EE]/95 dark:bg-[#1F1C13]/95";
      case "info":
      default:
        return "border-border bg-[#FAF9F5]/95 dark:bg-[#0A1D15]/95";
    }
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Container hiển thị danh sách Toast */}
      <div
        aria-live="assertive"
        className="fixed bottom-5 right-5 z-100 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role="alert"
            className={cn(
              "pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in-0",
              getBorderColor(item.type)
            )}
          >
            {getIcon(item.type)}
            <div className="flex-1 min-w-0 pr-1">
              {item.title && (
                <strong className="text-xs font-bold text-foreground block mb-0.5">
                  {item.title}
                </strong>
              )}
              <p className="text-xs text-muted-foreground leading-relaxed">
                {item.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(item.id)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 -mr-1 -mt-1 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * @description Hook sử dụng Toast trong React Components.
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast phải được sử dụng bên trong ToastProvider");
  }
  return context;
}
