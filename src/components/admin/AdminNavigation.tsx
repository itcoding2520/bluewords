import Link from "next/link";

type AdminSection = "requests" | "categories" | "users" | "notifications" | "sentence-builder" | "assessments";

const sections: Array<{ id: AdminSection; label: string; href: string }> = [
  { id: "requests", label: "Publish requests", href: "/admin" },
  { id: "categories", label: "Categories", href: "/admin/categories" },
  { id: "users", label: "Users", href: "/admin/users" },
  { id: "notifications", label: "Send notification", href: "/admin/notifications" },
  { id: "sentence-builder", label: "Sentence Builder", href: "/admin/sentence-builder" },
  { id: "assessments", label: "Assignments", href: "/admin/assessments" },
];

export function AdminNavigation({ active }: { active: AdminSection }) {
  return <nav aria-label="Admin sections" className="admin-navigation mb-6 flex gap-2 overflow-x-auto border-b border-slate-200">
    {sections.map((section) => {
      const isActive = section.id === active;
      return <Link key={section.id} href={section.href} aria-current={isActive ? "page" : undefined} className={`shrink-0 border-b-2 px-3 py-3 text-sm font-semibold transition ${isActive ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
        {section.label}
      </Link>;
    })}
  </nav>;
}
