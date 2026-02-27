import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge class names
 *
 * @param inputs Tailwind css classes
 * @returns Classes with duplicate removed
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
