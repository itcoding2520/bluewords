"use client";

import { useEffect, useState } from "react";
import { fetchMyAssignments } from "@/lib/assignments/api";

export function useSidebarPendingAssignments(authUserId: string | null, isAuthenticated: boolean) {
  const [pendingAssignmentCount, setPendingAssignmentCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !authUserId) {
      const resetTimer = window.setTimeout(() => setPendingAssignmentCount(0), 0);
      return () => window.clearTimeout(resetTimer);
    }
    let active = true;
    async function refreshAssignments() {
      try {
        const assignments = await fetchMyAssignments();
        if (active) {
          setPendingAssignmentCount(assignments.filter((item) => item.status !== "completed").length);
        }
      } catch {
        // Keep the last known badge count while offline.
      }
    }

    void refreshAssignments();
    const timer = window.setInterval(() => { void refreshAssignments(); }, 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [authUserId, isAuthenticated]);

  return pendingAssignmentCount;
}
