import { AuthContext, pocketBase } from "../pocketbase";
import React, { useContext } from "react";
import { Login } from "../Login";
import TestEnrollmentFabricator from "./components/TestEnrollmentFabricator";


export function AdminGuard(props: React.PropsWithChildren<{}>) {
  const auth = useContext(AuthContext);
  if (auth) {
    return props.children;
  } else {
    return (
      <>
        <header className="container">
          <hgroup>
            <h1>You need to be an admin to access this page</h1>
            <p>Please log in below</p>
          </hgroup>
        </header>
        <main className="container">
          <Login />
        </main>
      </>
    );
  }
}

export default function() {
    return (
      <AdminGuard>
        <header className="container">
          <hgroup>
            <h1>You're logged in!</h1>
            <p>Welcome!</p>
            <nav>
              <button className="secondary" onClick={() => pocketBase.authStore.clear()}>Logout</button>
            </nav>
          </hgroup>
        </header>
        <TestEnrollmentFabricator />
      </AdminGuard>
    );
}

