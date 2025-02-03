import { BrowserRouter, Route, Routes } from "react-router";

import AdminApp from "@/pages/admin/Index";
import IndexPage from "@/pages/Index";
import Layout from "./pages/Layout";
import EditTestSlotPage from "./pages/EditTestSlot";
import AdminLayout from "./pages/admin/Layout";
import TestEnrollmentFabricator from "./pages/christian_scratchpad/TestEnrollmentFabricator";
import LinkSender from "./pages/christian_scratchpad/LinkSender";
import CrudeSchedulingExporter from "./pages/christian_scratchpad/CrudeSchedulingExporter";
import EmailExtractor from "./pages/christian_scratchpad/EmailExtractor";
import { ChristianScratchpadLayout } from "./pages/christian_scratchpad/ChristianScratchpadPage";
import { SeatsAdminApp } from "./pages/admin/Seats";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<IndexPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminApp />} />
            <Route path="seats" element={<SeatsAdminApp />} />
            <Route
              path="christian_scratchpad"
              element={<ChristianScratchpadLayout />}
            >
              <Route
                path="test_enrollment_fabricator"
                element={<TestEnrollmentFabricator />}
              />
              <Route path="link_sender" element={<LinkSender />} />
              <Route
                path="crude_scheduling_exporter"
                element={<CrudeSchedulingExporter />}
              />
              <Route path="email_extractor" element={<EmailExtractor />} />
            </Route>
          </Route>
          <Route
            path="/test_slot/:enrollmentId"
            element={<EditTestSlotPage />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
