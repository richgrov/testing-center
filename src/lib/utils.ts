import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parsePocketbaseDate(dateString: string): Date | null {
  if (dateString == null || dateString === "") return null;
  return new Date(dateString.replace(" ", "T"));
}

export function dateToPocketbase(date: Date | number): string {
  const iso = new Date(date).toISOString();
  return `${iso.substring(0, 10)} ${iso.substring(11, 19)}`;
}

/** value Greater Than or Equal to min && value Less Than or Equal to max */
export function gtelte(min: number, value: number, max: number) {
  return min <= value && value <= max;
}
