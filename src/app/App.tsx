import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/app/routes/AppRoutes";

/**
 * @description Component gốc của ứng dụng Frontend.
 */
function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
