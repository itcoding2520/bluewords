import Link from "next/link";
import type { AdminPageAccess } from "@/lib/supabase/admin-page-access";

type AccessStatus = Exclude<AdminPageAccess["status"], "authorized">;

export function AdminPageAccessState({ status }: { status: AccessStatus }) {
  if (status === "unauthenticated") {
    return (
      <p className="py-12 text-center text-slate-600">
        Please <Link className="text-blue-600" href="/login">sign in</Link> to continue.
      </p>
    );
  }

  return (
    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
      You do not have permission to access admin tools.
    </p>
  );
}
