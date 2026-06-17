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

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Try the modern API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy using clipboard API:', err);
    }
  }

  // Fallback to execCommand('copy')
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback copy failed:', err);
    return false;
  }
}