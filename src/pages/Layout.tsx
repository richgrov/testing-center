import { Outlet } from "react-router";

export default function Layout() {
  return <div className="w-screen min-h-screen p-0 m-0 overflow-x-hidden overflow-y-auto grid items-center justify-items-center" style={{ gridTemplate: "1fr / 100%" }}>
    <Outlet />
  </div>;
}
