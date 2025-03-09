import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
// Tailwind components and class compilation stuff
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
