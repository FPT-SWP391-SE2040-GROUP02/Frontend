import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { AppRoutes } from "@/app/routes/AppRoutes";
import { MaintenanceGate } from "@/app/providers/MaintenanceGate";

/**
 * @description Component gốc của ứng dụng Frontend.
 */
function App() {
  return (
    <BrowserRouter>
      <MaintenanceGate>
        <AppRoutes />
      </MaintenanceGate>
      <Analytics />
    </BrowserRouter>
  );
}

export default App;
