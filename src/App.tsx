import { useState, useContext, useRef } from "react";
import { AuthContext, pb } from "./pocketbase";
import { Button } from "./components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./components/ui/popover";
import { Input } from "./components/ui/input";

function AdminApp() {
  return (
    <>
      <Button onClick={() => pb.authStore.clear()}>Logout</Button>
    </>
  );
}

function Login() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      await pb
        .collection("users")
        .authWithPassword(emailRef.current!.value, passwordRef.current!.value);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <Input name="email" placeholder="Email" type="email" ref={emailRef} />
        <Input
          name="password"
          placeholder="Password"
          type="password"
          ref={passwordRef}
        />
        <Button>Login</Button>
      </form>
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
