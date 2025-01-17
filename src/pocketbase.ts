import PocketBase from "pocketbase";

export const pb = new PocketBase("http://localhost:8090");

import { createContext } from "react";

export interface Auth {}

export const AuthContext = createContext<Auth | undefined>(undefined);
