import { Outlet } from "react-router";

export default function Layout() {
  return (
    <div className="w-screen min-h-screen p-0 m-0 overflow-x-hidden overflow-y-auto justify-items-center">
      <Outlet />
    </div>
  );
}
