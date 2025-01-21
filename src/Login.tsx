import { useRef } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";

import { pocketBase } from "./pocketbase";

export function Login() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      await pocketBase
        .collection("_superusers")
        .authWithPassword(emailRef.current!.value, passwordRef.current!.value);
    } catch (err) {
      console.error(err);
    }
  }

  async function loginCanvas() {
    try {
      await pocketBase
        .collection("users")
        .authWithOAuth2({provider: 'gitea'});
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
      <Button onClick={loginCanvas}>Login with Canvas</Button>
    </>
  );
}
