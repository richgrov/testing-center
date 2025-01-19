import { useContext } from "react";
import { AuthContext, pocketBase } from "./pocketbase";
import { Button } from "./components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./components/ui/popover";
import { Login } from "./Login";
import { SeatDisplay } from "./components/SeatDisplay";

function AdminApp() {
  return (
    <>
      <Button onClick={() => pocketBase.authStore.clear()}>Logout</Button>
      <SeatDisplay />
    </>
  );
}

function DefaultApp() {
  return (
    <>
      <Popover>
        <PopoverTrigger>
          <Button>Admin Login</Button>
        </PopoverTrigger>
        <PopoverContent>
          <Login />
        </PopoverContent>
      </Popover>
    </>
  );
}

function App() {
  const auth = useContext(AuthContext);
  return auth ? <AdminApp /> : <DefaultApp />;
}

export default App;
