import PocketBase from "pocketbase";
import { createContext } from "react";

export const pocketBase = new PocketBase("http://localhost:8090");

export interface Auth {}
export const AuthContext = createContext<Auth | undefined>(undefined);
