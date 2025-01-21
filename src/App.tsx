import { BrowserRouter, Route, Routes } from "react-router";

import AdminApp from "@/pages/Admin";
import IndexPage from "@/pages/Index";
import Layout from "./pages/Layout";
import ChristianScratchpadRoutes from "./pages/christian_scratchpad/ChristianScratchpadPage";
import EditTestSlotPage from "./pages/EditTestSlot";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<IndexPage />} />
          <Route path="/admin" element={<AdminApp />} />
          <Route
            path="/test_slot/:enrollmentId"
            element={<EditTestSlotPage />}
          />
          {ChristianScratchpadRoutes()}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
