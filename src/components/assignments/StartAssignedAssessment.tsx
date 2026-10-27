"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";

export function StartAssignedAssessment({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  useEffect(() => { let active = true; void fetch(`/api/assessments/${assignmentId}/start`, { method: "POST" }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Could not start this test."); if (active) router.replace(`/assignments/take/${data.attempt.id}`); }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not start this test."); }); return () => { active = false; }; }, [assignmentId, router]);
  return error ? <div><AutoDismissMessage variant="error">{error}</AutoDismissMessage><a className="assessment-back-link" href="/assignments">Back to my assignments</a></div> : <p className="assessment-loading">Preparing your test…</p>;
}
