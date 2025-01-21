import { BrowserRouter, Route, Routes } from "react-router";

import AdminApp from "@/pages/Admin";
import IndexPage from "@/pages/Index";
import Layout from "./pages/Layout";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<IndexPage />} />
          <Route path="/admin" element={<AdminApp />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
