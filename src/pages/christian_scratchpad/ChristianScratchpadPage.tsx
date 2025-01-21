import { NavLink, Outlet, Route } from "react-router";
import { AdminGuard } from "../Admin";
import TestEnrollmentFabricator from "./TestEnrollmentFabricator";
import { useEffect } from "react";
import { pocketBase } from "@/pocketbase";
import { fetchForward } from "./utils";

export default function ChristianScratchpadRoutes() {
  return <Route path="/christian_scratchpad" element={<Layout />}>
    <Route path="/christian_scratchpad/test_enrollment_fabricator" element={<TestEnrollmentFabricator />} />
  </Route>
}

export function Layout() {

  return <AdminGuard>
    <DebuggingStuff />
    <div className="flex flex-col gap-4">
      <div>
        <NavLink to="/christian_scratchpad/test_enrollment_fabricator">Test Enrollment Fabricator</NavLink><br/>
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
