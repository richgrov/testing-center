import { useContext } from "react";

import { AuthContext, pocketBase } from "@/pocketbase";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Login } from "@/Login";
import { Outlet } from "react-router";

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
      <div
        className="flex w-100 p-4 items-center"
        style={{ borderBottom: "1px solid #e4e4e7" }}
      >
        <h1 className="text-xl font-bold flex-1">Testing Center Control</h1>
        <Button onClick={() => pocketBase.authStore.clear()}>Logout</Button>
      </div>
      <Outlet />
    </>
  );
}
