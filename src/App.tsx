import { useState, useContext } from "react";
import { AuthContext, pb } from "./pocketbase";
import { Button } from "./components/ui/button";

function AdminApp() {
  return (
    <>
      <Button onClick={() => pb.authStore.clear()}>Logout</Button>
    </>
  );
}

function DefaultApp() {
  return <p>Default App</p>;
}

function App() {
  const auth = useContext(AuthContext);
  return auth ? <AdminApp /> : <DefaultApp />;
}

export default App;
