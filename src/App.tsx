import { AppRoutes } from "@/app/routes/AppRoutes";
import { ToastProvider } from "@/shared/ui";

/**
 * @description Component gốc của ứng dụng React, kết nối hệ thống Routing và Global Toast.
 */
function App() {
  return (
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  );
}

export default App;

