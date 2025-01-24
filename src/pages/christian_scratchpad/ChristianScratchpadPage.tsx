import { NavLink, Outlet, Route } from "react-router";
import { AdminGuard } from "../Admin";
import TestEnrollmentFabricator from "./TestEnrollmentFabricator";
import { useEffect } from "react";
import { pocketBase } from "@/pocketbase";
import { fetchForward } from "./utils";
import LinkSender from "./LinkSender";
import CrudeSchedulingExporter from "./CrudeSchedulingExporter";
import EmailExtractor from "./EmailExtractor";

export default function ChristianScratchpadRoutes() {
  return <Route path="/christian_scratchpad" element={<Layout />}>
    <Route path="/christian_scratchpad/test_enrollment_fabricator" element={<TestEnrollmentFabricator />} />
    <Route path="/christian_scratchpad/link_sender" element={<LinkSender />} />
    <Route path="/christian_scratchpad/crude_scheduling_exporter" element={<CrudeSchedulingExporter />} />
    <Route path="/christian_scratchpad/email_extractor" element={<EmailExtractor />} />
  </Route>
}

export function Layout() {

  return <AdminGuard>
    <DebuggingStuff />
    <div className="flex flex-col gap-4">
      <div>
        <NavLink to="/christian_scratchpad/test_enrollment_fabricator">Test Enrollment Fabricator</NavLink> | 
        <NavLink to="/christian_scratchpad/link_sender">Link Sender</NavLink> | 
        <NavLink to="/christian_scratchpad/crude_scheduling_exporter">Crude Scheduling Exporter</NavLink> | 
        <NavLink to="/christian_scratchpad/email_extractor">Email Extractor</NavLink> | 
      </div>
      <Outlet />
    </div>
  </AdminGuard>;
}

function DebuggingStuff() {
  //Debugging stuff, only triggered once past AdminGuard
  useEffect(() => {
    (window as any)["pocketBase"] = pocketBase;
    (window as any)["fetchForward"] = fetchForward;
  }, []);
  return null;
}
