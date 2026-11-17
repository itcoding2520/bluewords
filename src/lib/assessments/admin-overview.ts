import type { AdminClient } from "@/lib/supabase/admin-client";
import { getAdminUserNickname } from "@/lib/admin-user-mapping";

export async function getAdminAssessmentOverview(admin: AdminClient) {
  const [{ data: assignments, error }, { data: attempts, error: attemptsError }, { data: users, error: usersError }] = await Promise.all([
    admin.from("assessments").select("id,title,difficulty,due_at,created_at,assessment_recipients(id,user_id,status,assigned_at)").order("created_at", { ascending: false }).limit(100),
    admin.from("assessment_attempts").select("id,user_id,recipient_id,score,correct_count,elapsed_seconds,result,completed_at,attempt_number").not("completed_at", "is", null).order("completed_at", { ascending: false }).limit(100),
    admin.auth.admin.listUsers({ page: 1, perPage: 500 }),
  ]);
  const errorMessage = error?.message ?? attemptsError?.message ?? usersError?.message;
  if (errorMessage) return { status: "error" as const, message: errorMessage };

  return {
    status: "success" as const,
    assignments: assignments ?? [],
    attempts: attempts ?? [],
    users: users?.users.map((user) => ({
      id: user.id,
      email: user.email,
      nickname: getAdminUserNickname(user),
    })) ?? [],
  };
}
