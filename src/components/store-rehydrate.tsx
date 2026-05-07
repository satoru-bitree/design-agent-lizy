"use client";

import { useEffect } from "react";
import { useJobsStore } from "@/lib/stores/jobs-store";

/**
 * Triggers Zustand persist rehydration after the client mounts. We use
 * `skipHydration: true` on the store to avoid SSR/CSR mismatch — the server
 * renders with initial state, then this effect pulls the localStorage snapshot
 * into the store on the client. Rendered as a no-op component in the root
 * layout.
 */
export function StoreRehydrate() {
  useEffect(() => {
    void useJobsStore.persist.rehydrate();
  }, []);
  return null;
}
