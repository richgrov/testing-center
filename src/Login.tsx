import { useRef } from "react";

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
      <form onSubmit={onSubmit}>
        <fieldset className="grid">
          <input 
            name="login"
            placeholder="Login"
            aria-label="Login"
            autoComplete="username"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            aria-label="Password"
            autoComplete="current-password"
          />
          <input
            type="submit"
            value="Log in"
          />
        </fieldset>
      </form>
      <button onClick={loginCanvas}>Login with Canvas</button>
    </>
  );
}
