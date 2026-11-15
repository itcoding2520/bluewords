"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Lightbulb, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { formatDuration } from "@/lib/assignments/format-duration";
import { useAssessmentRunnerController } from "@/hooks/useAssessmentRunnerController";

export function AssessmentRunner({ attemptId }: { attemptId: string }) {
  const {
    attempt, answers, sentenceTiles, current, setCurrent, seconds, loading, submitting, error,
    setAnswer, toggleSentenceTile, clearSentence, submit,
  } = useAssessmentRunnerController(attemptId);

  if (loading) return <div className="assessment-loading">Loading your test…</div>;
  if (!attempt) return <AutoDismissMessage variant="error">{error || "Test not found."}</AutoDismissMessage>;
  const question = attempt.questions[current];
  const answered = answers.filter(Boolean).length;
  return <div className="assessment-runner-page">
    <Link className="assessment-back-link" href="/assignments"><ArrowLeft size={17} /> My assignments</Link>
    <header className="assessment-test-header"><div><span>Assigned test · {attempt.difficulty}</span><h1>{attempt.title}</h1><p>Each correct answer is worth 10 points. You need more than 50 points to pass.</p></div><div className="assessment-live-stats"><span><Clock3 />{formatDuration(seconds)}</span><span><CheckCircle2 />{answered}/10 answered</span></div></header>
    <div className="assessment-progress"><div><span>Question {current + 1} of 10</span><b>{current + 1} / 10</b></div><div className="assessment-progress-track"><i style={{ width: `${(current + 1) * 10}%` }} /></div><div className="assessment-question-dots">{attempt.questions.map((item, index) => <button key={index} aria-label={`Go to question ${index + 1}`} className={`${index === current ? "active" : ""} ${answers[index] ? "answered" : ""}`} onClick={() => setCurrent(index)}>{index + 1}</button>)}</div></div>
    <section className="assessment-question-card"><span className={`assessment-question-type ${question.type}`}>{question.type === "sentence" ? "Build the sentence" : "Vocabulary"}</span><h2>{question.prompt}</h2>
      {question.type === "vocabulary" && question.imageUrl && <Image src={question.imageUrl} alt={question.word ? `Picture clue for ${question.word}` : "Vocabulary picture clue"} width={220} height={150} unoptimized className="assessment-question-image" />}
      {question.type === "vocabulary" ? <div className="assessment-answer-options">{question.choices?.map((choice) => <button key={choice} className={answers[current] === choice ? "selected" : ""} onClick={() => setAnswer(current, choice)}>{choice}</button>)}</div> : <><div className="assessment-sentence-answer" aria-label="Your sentence">{sentenceTiles[current].length ? sentenceTiles[current].map((tileIndex, order) => <button key={`${tileIndex}-${order}`} onClick={() => toggleSentenceTile(current, tileIndex)}>{question.tiles?.[tileIndex]}</button>) : <span>Tap word tiles in the correct order</span>}</div><div className="assessment-sentence-tiles">{question.tiles?.map((tile, index) => <button key={`${tile}-${index}`} disabled={sentenceTiles[current].includes(index)} onClick={() => toggleSentenceTile(current, index)}>{tile}</button>)}</div><button className="assessment-clear-answer" onClick={() => clearSentence(current)}>Clear sentence</button></>}
      <p className="assessment-shuffle-note"><Lightbulb size={16} /> Questions mix vocabulary meanings and sentence building. Question order is randomized.</p>
    </section>
    {error && <AutoDismissMessage variant="error" className="my-4">{error}</AutoDismissMessage>}
    <footer className="assessment-test-actions"><Button variant="secondary" onClick={() => setCurrent((index) => Math.max(0, index - 1))} disabled={current === 0}><ArrowLeft size={17} /> Back</Button><Button variant="secondary" onClick={() => setCurrent((index) => Math.min(9, index + 1))} disabled={current === 9}>Next question <ArrowRight size={17} /></Button><Button onClick={() => void submit()} disabled={submitting}>{submitting ? "Submitting…" : "Submit test"} <Send size={17} /></Button></footer>
  </div>;
}
