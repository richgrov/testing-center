import { AuthContext, pocketBase } from "../pocketbase";
import { SeatDisplay } from "@/components/SeatDisplay";
import React, { useContext } from "react";
import { Login } from "@/Login";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export function AdminGuard(props: React.PropsWithChildren<{}>) {
  const auth = useContext(AuthContext);
  if (auth) {
    return props.children;
  } else {
    return <div>
      <span>Not an admin</span>
      <Popover>
        <PopoverTrigger>
          <Button>Admin Login</Button>
        </PopoverTrigger>
        <PopoverContent>
          <Login />
        </PopoverContent>
      </Popover>
    </div>;
  }
}

export function AdminApp() {
  return (
    <AdminGuard>
      <Button onClick={() => pocketBase.authStore.clear()}>Logout</Button>
      <SeatDisplay />
    </AdminGuard>
  );
}

export default AdminApp;

