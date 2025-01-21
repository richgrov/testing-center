import { BrowserRouter, Route, Routes } from "react-router";

import AdminApp from "@/pages/Admin";
import IndexPage from "@/pages/Index";

export default function App() {
  return <BrowserRouter>
    <Routes>
      <Route path = "/" element={<IndexPage />} />
      <Route path = "/admin" element={<AdminApp />} />
    </Routes>
  </BrowserRouter>;
}
