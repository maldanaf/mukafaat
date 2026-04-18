/**
 * Mokafaat API Configuration
 *
 * On the client (browser): use empty string so requests go to the same origin
 * and get proxied via Next.js rewrites (avoids CORS).
 *
 * On the server (SSR/metadata): use the full API URL directly.
 */
export const API_BASE_URL =
  typeof window !== "undefined"
    ? "" // Client: same-origin, proxied by Next.js rewrites
    : process.env.NEXT_PUBLIC_API_BASE_URL || "https://mokafat.ivadso.com";
