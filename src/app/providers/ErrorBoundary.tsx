import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorScreen } from "@/shared/ui/ErrorScreen";
import { ERROR_PAGE_CONTENT } from "@/shared/constants/errorPages";

/** Nội dung và giao diện thay thế tùy chọn của boundary. */
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
/** Trạng thái lỗi khi render. */
interface State {
  hasError: boolean;
}
/** Cô lập lỗi render, hiển thị giao diện Heritage và tránh lộ chi tiết lỗi nội bộ. */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };
  /** Chuyển sang giao diện thay thế khi React phát hiện lỗi. */
  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }
  /** Giữ thông tin chẩn đoán cho developer trong console. */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary caught an unhandled error]:", error, errorInfo);
  }
  /** Render nội dung hoặc giao diện lỗi dùng chung. */
  public render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <ErrorScreen {...ERROR_PAGE_CONTENT.runtime} retry />;
    }
    return this.props.children;
  }
}
