import { BrowserRouter, Route, Routes } from "react-router";

import Layout from "./pages/Layout";
import EditTestSlotPage from "./pages/EditTestSlot";
import TestEnrollmentFabricator from "./pages/christian_scratchpad/TestEnrollmentFabricator";
import LinkSender from "./pages/christian_scratchpad/LinkSender";
import CrudeSchedulingExporter from "./pages/christian_scratchpad/CrudeSchedulingExporter";
import EmailExtractor from "./pages/christian_scratchpad/EmailExtractor";
import { ChristianScratchpadLayout } from "./pages/christian_scratchpad/ChristianScratchpadPage";
import { SeatsAdminApp } from "./pages/Seats";
import { SignUpPage } from "./pages/SignUp";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<SignUpPage />} />
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
          <Route
            path="/test_slot/:enrollmentId"
            element={<EditTestSlotPage />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
