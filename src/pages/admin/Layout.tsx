import { useContext } from "react";

import { AuthContext, pocketBase } from "@/pocketbase";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Login } from "@/Login";
import { NavLink, Outlet } from "react-router";

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

export default function AdminLayout() {
  const auth = useContext(AuthContext);

  if (!auth) {
    return (
      <div>
        <span>Not an admin</span>
        <Popover>
          <PopoverTrigger>
            <Button>Admin Login</Button>
          </PopoverTrigger>
          <PopoverContent>
            <Login />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <>
      <nav
        className="flex w-100 p-4 items-center gap-8"
        style={{ borderBottom: "1px solid #e4e4e7" }}
      >
        <h1 className="text-xl font-bold">Testing Center Control</h1>
        <ActiveNavLink to="/admin/">Home</ActiveNavLink>
        <div className="flex-1">
          <ActiveNavLink to="/admin/seats">Seat Management</ActiveNavLink>
        </div>
        <Button onClick={() => pocketBase.authStore.clear()}>Logout</Button>
      </nav>
      <Outlet />
    </>
  );
}
