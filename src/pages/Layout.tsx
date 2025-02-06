import { NavLink, Outlet } from "react-router";

import { AuthContext, pocketBase } from "@/pocketbase";
import { Button } from "@/components/ui/button";
import { useContext } from "react";

function ActiveNavLink({
  to,
  children,
}: React.PropsWithChildren<{ to: string }>) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) => (isActive ? "font-bold" : "")}
    >
      {children}
    </NavLink>
  );
}

export default function Layout() {
  const auth = useContext(AuthContext);

  return (
    <div className="w-screen min-h-screen p-0 m-0 overflow-x-hidden overflow-y-auto justify-items-center">
      <nav
        className="flex w-100 p-4 items-center gap-8"
        style={{ borderBottom: "1px solid #e4e4e7" }}
      >
        <h1 className="text-xl font-bold">The Testing Center</h1>
        <ActiveNavLink to="/">Sign Up For a Test</ActiveNavLink>
        <ActiveNavLink to="/tests">Tests</ActiveNavLink>
        <div className="flex-1">
          <ActiveNavLink to="/seats">Seat Management</ActiveNavLink>
        </div>
        {auth ? (
          <Button onClick={() => pocketBase.authStore.clear()}>Logout</Button>
        ) : (
          <Button onClick={() => {}}>Login</Button>
        )}
      </nav>
      <Outlet />
    </div>
  );
}
