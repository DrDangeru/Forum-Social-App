import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
// Tailwind components and class compilation stuff
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get initials from a name (first letter of first and last name)
 * @param name Full name
 * @returns Initials (2 characters max)
 */
export function getInitials(name: string): string {
  if (!name) return '??';
  
  const parts = name.split(' ').filter(Boolean);
  
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
