"use client";

import { useEffect, useState } from "react";

/**
 * Returns true once the Zustand persisted store has hydrated from localStorage.
 * Use this to avoid SSR redirects before the auth state is available.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // On client, the store hydrates synchronously in the first tick,
    // so by the time useEffect runs it's already done.
    setHydrated(true);
  }, []);

  return hydrated;
}
