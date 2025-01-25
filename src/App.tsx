import { BrowserRouter, Route, Routes } from "react-router";

import AdminApp from "./pages/Admin";
import IndexPage from "./pages/Index";

export function App() {
  return <BrowserRouter>
    <Routes>
      <Route>
        <Route path="/" element={<IndexPage />} />
        <Route path="/admin" element={<AdminApp />} />
      </Route>
    </Routes>
  </BrowserRouter>;
}
