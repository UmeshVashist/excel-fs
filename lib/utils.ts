import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getURL() {
  // If we are in production (Vercel), always use the main domain to avoid redirect_uri mismatches
  if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
    return "https://devboard-ms.vercel.app/";
  }

  // Local development logic
  let url =
    process?.env?.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000/";
  
  url = url.includes("http") ? url : `https://${url}`;
  url = url.replace(/\/+$/, ""); 
  return `${url}/`;
}