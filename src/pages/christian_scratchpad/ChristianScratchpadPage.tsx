import { NavLink, Outlet } from "react-router";
import { useEffect } from "react";
import { pocketBase } from "@/pocketbase";
import { fetchForward } from "./utils";

export function ChristianScratchpadLayout() {
  return (
    <>
      <DebuggingStuff />
      <div className="flex flex-col gap-4">
        <div>
          <NavLink to="/christian_scratchpad/test_enrollment_fabricator">
            Test Enrollment Fabricator
          </NavLink>{" "}
          |<NavLink to="/christian_scratchpad/link_sender">Link Sender</NavLink>{" "}
          |
          <NavLink to="/christian_scratchpad/crude_scheduling_exporter">
            Crude Scheduling Exporter
          </NavLink>{" "}
          |
          <NavLink to="/christian_scratchpad/email_extractor">
            Email Extractor
          </NavLink>{" "}
          |
        </div>
        <Outlet />
      </div>
    </>
  );
}

function DebuggingStuff() {
  //Debugging stuff, only triggered once past AdminGuard
  useEffect(() => {
    (window as any)["pocketBase"] = pocketBase;
    (window as any)["fetchForward"] = fetchForward;
  }, []);
  return null;
}
