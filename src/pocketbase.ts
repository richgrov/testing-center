import PocketBase from "pocketbase";
import { createContext } from "react";

export const pocketBase = new PocketBase(process.env.BASE_URL);

export interface Auth {}
export const AuthContext = createContext<Auth | undefined>(undefined);

