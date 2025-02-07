import { useRef, useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";

import { pocketBase } from "./pocketbase";

export function Login() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      await pocketBase
        .collection("users")
        .authWithPassword(emailRef.current!.value, passwordRef.current!.value);
    } catch (err) {
      if (typeof err === "object" && (err as any).status === 400) {
        setFeedback("Invalid login");
        return;
      }
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
        <p className="text-sm text-red-500 text-center">{feedback}</p>
        <Button>Login</Button>
      </form>
    </>
  );
}
