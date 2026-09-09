import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary caught an unhandled error]:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
          <Card className="w-full max-w-lg shadow-xl border-destructive/20">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive text-2xl font-bold">
                ⚠️
              </div>
              <CardTitle className="text-xl font-bold text-slate-800">
                Đã xảy ra sự cố không mong muốn
              </CardTitle>
              <CardDescription>
                Ứng dụng gặp lỗi trong quá trình xử lý giao diện. Vui lòng thử tải lại trang.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md bg-slate-900 p-3 font-mono text-xs text-rose-300 overflow-auto max-h-40">
                {this.state.error?.message || "Lỗi không xác định"}
              </div>
            </CardContent>
            <CardFooter className="flex justify-center gap-3">
              <Button onClick={this.handleReset} variant="default">
                Tải lại trang
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
