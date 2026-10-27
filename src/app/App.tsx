import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { AppRoutes } from "@/app/routes/AppRoutes";

/**
 * @description Component gốc của ứng dụng Frontend.
 */
function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Analytics />
    </BrowserRouter>
  );
}

export default App;
