"use client";

import { ArrowRight, BookOpenCheck, Timer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { AssignmentHistoryList } from "@/components/assignments/AssignmentHistoryList";
import { AssignmentTodoList } from "@/components/assignments/AssignmentTodoList";
import { useAssignmentsController } from "@/hooks/useAssignmentsController";

export function AssignmentsContent() {
  const { outstanding, history, loading, starting, error, tab, setTab, start } = useAssignmentsController();

  return (
    <div className="assignments-page">
      <header className="assignments-hero">
        <div className="assignments-hero-copy">
          <span>Keep learning!</span>
          <h1 className="page-title">My assignments</h1>
          <p className="page-intro-description">Practice your vocabulary and see your progress.</p>
        </div>
        <BookOpenCheck size={58} aria-hidden="true" />
      </header>

      {outstanding.length > 0 && (
        <AssignmentReminder
          count={outstanding.length}
          isStarting={starting === outstanding[0].id}
          isDisabled={starting !== null}
          onStart={() => void start(outstanding[0].id)}
        />
      )}
      {error && <AutoDismissMessage variant="error" className="my-4">{error}</AutoDismissMessage>}

      <nav className="assignment-tabs">
        <button className={tab === "todo" ? "active" : ""} onClick={() => setTab("todo")}>
          To do ({outstanding.length})
        </button>
        <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>
          History ({history.length})
        </button>
      </nav>

      {loading ? (
        <div className="assessment-loading">Loading your assignments…</div>
      ) : tab === "todo" ? (
        <AssignmentTodoList assignments={outstanding} starting={starting} onStart={start} />
      ) : (
        <AssignmentHistoryList entries={history} />
      )}

      <p className="assessment-private-note">🔒 Your test results and history are private. Only you can see them.</p>
    </div>
  );
}

function AssignmentReminder({
  count,
  isStarting,
  isDisabled,
  onStart,
}: {
  count: number;
  isStarting: boolean;
  isDisabled: boolean;
  onStart: () => void;
}) {
  return (
    <section className="assignments-alert">
      <div>
        <Timer />
        <span>
          <strong>{count} {count === 1 ? "test" : "tests"} waiting for you</strong>
          <small>Complete your assigned tests to finish your learning tasks.</small>
        </span>
      </div>
      <Button onClick={onStart} disabled={isDisabled}>
        {isStarting ? "Starting…" : "Start now"} <ArrowRight size={18} />
      </Button>
    </section>
  );
}
