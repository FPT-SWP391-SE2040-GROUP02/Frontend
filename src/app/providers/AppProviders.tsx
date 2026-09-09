import { type ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { Provider as ReduxProvider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { ErrorBoundary } from "./ErrorBoundary";
import { queryClient } from "./queryClient";
import { store } from "@/app/store";

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * @description Global Providers bọc toàn bộ ứng dụng:
 * 1. ErrorBoundary: Bắt lỗi sập ứng dụng
 * 2. ReduxProvider: Quản lý Client State toàn cục
 * 3. QueryClientProvider: Quản lý Server State và caching
 * 4. TooltipProvider: Hỗ trợ hiển thị tooltips Shadcn
 * 5. BrowserRouter: Định tuyến URL
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <ReduxProvider store={store}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <BrowserRouter>{children}</BrowserRouter>
          </TooltipProvider>
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </ReduxProvider>
    </ErrorBoundary>
  );
}
