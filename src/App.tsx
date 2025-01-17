import { useContext } from "react";
import { AuthContext, pocketBase } from "./pocketbase";
import { Button } from "./components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./components/ui/popover";
import { Login } from "./Login";

function AdminApp() {
  return (
    <>
      <Button onClick={() => pocketBase.authStore.clear()}>Logout</Button>
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
  watchSeats()
  const auth = useContext(AuthContext);
  return auth ? <AdminApp /> : <DefaultApp />;
}

async function watchSeats() {
  await pocketBase.realtime.subscribe('seat', (e) => {
    console.log(e)
  })
}

export default App;
