import { NavLink, Outlet } from "react-router";

import { AuthContext, pocketBase } from "@/pocketbase";
import { Button } from "@/components/ui/button";
import { useContext } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Login } from "@/Login";

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
    <div className="w-screen min-h-screen p-0 m-0 overflow-x-hidden overflow-y-auto">
      <div style={{ borderBottom: "1px solid #e4e4e7" }}>
        <nav className="flex p-4 items-center gap-8 w-full max-w-screen-lg mx-auto">
          <h1 className="text-xl font-bold">The Testing Center</h1>
          <ActiveNavLink to="/">Sign Up For a Test</ActiveNavLink>
          {auth && <ActiveNavLink to="/tests">Tests</ActiveNavLink>}
          <div className="flex-1">
            {auth && <ActiveNavLink to="/seats">Seat Management</ActiveNavLink>}
          </div>
          {auth ? (
            <Button onClick={() => pocketBase.authStore.clear()}>Logout</Button>
          ) : (
            <Popover>
              <PopoverTrigger>
                <Button>Admin Login</Button>
              </PopoverTrigger>
              <PopoverContent>
                <Login />
              </PopoverContent>
            </Popover>
          )}
        </nav>
      </div>
      <div className="justify-self-center">
        <Outlet />
        </div>
    </div>
  );
}
