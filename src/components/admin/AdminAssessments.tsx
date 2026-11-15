"use client";

import { ClipboardList } from "lucide-react";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { AdminAssessmentTestsPanel } from "@/components/admin/AdminAssessmentTestsPanel";
import { AdminAssessmentAssignmentsPanel } from "@/components/admin/AdminAssessmentAssignmentsPanel";
import { AdminAssessmentResultsPanel } from "@/components/admin/AdminAssessmentResultsPanel";
import { useAdminAssessmentsController } from "@/hooks/useAdminAssessmentsController";

export function AdminAssessments() {
  const {
    activeTab, setActiveTab, users, assignments, attempts, title, setTitle, difficulty, setDifficulty, selected, setSelected,
    allUsers, setAllUsers, dueAt, setDueAt, today, search, setSearch, loading, sending, error, notice,
    visibleUsers, userById, assignmentByRecipientId, refresh, assign,
  } = useAdminAssessmentsController();

  return <div className="assessment-admin-page">
    <header className="assessment-admin-hero"><div className="assessment-admin-hero-copy"><p>Administration</p><h1 className="page-title">Assessment management</h1><span>Create randomized 10-question tests, assign them, and review results.</span></div><ClipboardList size={54} aria-hidden="true" /></header>
    {error && <AutoDismissMessage variant="error" className="my-4">{error}</AutoDismissMessage>}{notice && <AutoDismissMessage variant="success" className="my-4">{notice}</AutoDismissMessage>}
    <nav className="assessment-admin-tabs" aria-label="Assessment management sections">
      {([ ["tests", "Tests"], ["assignments", "Assignments"], ["results", "Results"] ] as const).map(([id, label]) => <button type="button" key={id} className={activeTab === id ? "active" : ""} aria-current={activeTab === id ? "page" : undefined} onClick={() => setActiveTab(id)}>{label}</button>)}
    </nav>
    <div className="assessment-admin-grid">
      {activeTab === "tests" && <AdminAssessmentTestsPanel
        title={title}
        onTitleChange={setTitle}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        onContinue={() => setActiveTab("assignments")}
      />}
      {activeTab === "assignments" && <AdminAssessmentAssignmentsPanel
        title={title}
        difficulty={difficulty}
        users={users}
        assignments={assignments}
        selected={selected}
        onSelectedChange={setSelected}
        allUsers={allUsers}
        onAllUsersChange={setAllUsers}
        dueAt={dueAt}
        onDueAtChange={setDueAt}
        today={today}
        search={search}
        onSearchChange={setSearch}
        loading={loading}
        sending={sending}
        visibleUsers={visibleUsers}
        onRefresh={refresh}
        onAssign={assign}
      />}
      {activeTab === "results" && <AdminAssessmentResultsPanel
        attempts={attempts}
        userById={userById}
        assignmentByRecipientId={assignmentByRecipientId}
        loading={loading}
        onRefresh={refresh}
      />}
    </div>
    <p className="assessment-admin-privacy">Learners can only access their own assignments and results. Test answers are checked on the server.</p>
  </div>;
}
