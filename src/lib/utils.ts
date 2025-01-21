import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parsePocketbaseDate(dateString: string): Date {
  return new Date(dateString.replace(" ", "T"));
}

/** value Greater Than or Equal to min && value Less Than or Equal to max */
export function gtelte(min: number, value: number, max: number) { return min <= value && value <= max; }
