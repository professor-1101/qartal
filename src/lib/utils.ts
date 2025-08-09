import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate a short code from project ID
export function generateShortCode(projectId: string): string {
  // Create a hash from project ID and take first 6 characters
  let hash = 0;
  for (let i = 0; i < projectId.length; i++) {
    const char = projectId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to base36 and take first 6 characters
  const base36 = Math.abs(hash).toString(36);
  return base36.slice(0, 6).padStart(6, '0');
}

// Generate short URL with dynamic domain
export function generateShortUrl(projectId: string): string {
  const shortCode = generateShortCode(projectId);

  // Use dynamic domain based on current location
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const host = window.location.host;
    return `${protocol}//${host}/s/${shortCode}`;
  }

  // Fallback for server-side rendering
  return `http://localhost:3000/s/${shortCode}`;
}

export const toPersianDigits = (input: string | number): string => {
  if (typeof input === 'number') {
    input = input.toString();
  }
  
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return input.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};
