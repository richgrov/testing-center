import PocketBase from "pocketbase";
import { createContext } from "react";

export const pocketBase = new PocketBase(import.meta.env.VITE_POCKETBASE_URL);

export interface Auth {}
export const AuthContext = createContext<Auth | undefined>(undefined);

export function parsePocketbaseDate(dateString: string): Date {
  return new Date(dateString.replace(" ", "T"));
}
