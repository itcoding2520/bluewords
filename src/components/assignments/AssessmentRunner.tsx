"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { formatDuration } from "@/lib/assignments/format-duration";
import { useAssessmentRunnerController } from "@/hooks/useAssessmentRunnerController";
import { AssessmentQuestionCard } from "@/components/assignments/AssessmentQuestionCard";
import { AssessmentProgressNavigation } from "@/components/assignments/AssessmentProgressNavigation";

export function AssessmentRunner({ attemptId }: { attemptId: string }) {
  const {
    test: { attempt, loading, error },
    progress: { current, setCurrent, seconds, submitting },
    answers: { answers, sentenceTiles, setAnswer, toggleSentenceTile, clearSentence },
    actions: { submit },
  } = useAssessmentRunnerController(attemptId);
  const answered = useMemo(() => answers.filter(Boolean).length, [answers]);

  if (loading) return <div className="assessment-loading">Loading your test…</div>;
  if (!attempt) return <AutoDismissMessage variant="error">{error || "Test not found."}</AutoDismissMessage>;
  const question = attempt.questions[current];
  return <div className="assessment-runner-page">
    <Link className="assessment-back-link" href="/assignments"><ArrowLeft size={17} /> My assignments</Link>
    <header className="assessment-test-header"><div><span>Assigned test · {attempt.difficulty}</span><h1>{attempt.title}</h1><p>Each correct answer is worth 10 points. You need more than 50 points to pass.</p></div><div className="assessment-live-stats"><span><Clock3 />{formatDuration(seconds)}</span><span><CheckCircle2 />{answered}/10 answered</span></div></header>
    <AssessmentProgressNavigation
      questions={attempt.questions}
      answers={answers}
      current={current}
      onQuestionSelect={setCurrent}
    />
    <AssessmentQuestionCard
      question={question}
      answer={answers[current]}
      sentenceTiles={sentenceTiles[current]}
      onAnswer={(answer) => setAnswer(current, answer)}
      onSentenceTileToggle={(tileIndex) => toggleSentenceTile(current, tileIndex)}
      onClearSentence={() => clearSentence(current)}
    />
    {error && <AutoDismissMessage variant="error" className="my-4">{error}</AutoDismissMessage>}
    <footer className="assessment-test-actions"><Button variant="secondary" onClick={() => setCurrent((index) => Math.max(0, index - 1))} disabled={current === 0}><ArrowLeft size={17} /> Back</Button><Button variant="secondary" onClick={() => setCurrent((index) => Math.min(9, index + 1))} disabled={current === 9}>Next question <ArrowRight size={17} /></Button><Button onClick={() => void submit()} disabled={submitting}>{submitting ? "Submitting…" : "Submit test"} <Send size={17} /></Button></footer>
  </div>;
}
