import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { Auth, AuthContext, pocketBase } from "./pocketbase.ts";

function Root() {
  const [auth, setAuth] = useState<Auth | undefined>(undefined);

  useEffect(() => {
    pocketBase.authStore.onChange((_, record) => {
      if (record) {
        setAuth({});
      } else {
        setAuth(undefined);
      }
    }, true);
  }, []);

  return (
    <AuthContext.Provider value={auth}>
      <App />
    </AuthContext.Provider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
