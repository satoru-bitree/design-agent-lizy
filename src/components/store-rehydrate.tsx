"use client";

import { useEffect } from "react";
import { useJobsStore } from "@/lib/stores/jobs-store";

/**
 * Pulls the canonical brand state + project list from the DB into the Zustand
 * store on first mount. We render with empty initial state on the server and
 * fill it in here so the API call never runs at SSR time.
 *
 * Rendered as a no-op component in the root layout.
 */
export function StoreRehydrate() {
  useEffect(() => {
    void useJobsStore.getState().loadBrand();
    void useJobsStore.getState().loadProjects();
  }, []);
  return null;
}
