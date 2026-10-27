"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Lightbulb, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { formatDuration } from "@/components/assignments/AssignmentsContent";

type Question = { type: "vocabulary" | "sentence"; prompt: string; word?: string; meaning?: string; category: string; imagePath?: string | null; imageUrl?: string | null; choices?: string[]; tiles?: string[] };
type Attempt = { id: string; attempt_number: number; started_at: string; title: string; difficulty: string; questions: Question[]; completed_at: string | null; answers: string[] };

export function AssessmentRunner({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<string[]>(Array(10).fill(""));
  const [sentenceTiles, setSentenceTiles] = useState<number[][]>(Array.from({ length: 10 }, () => []));
  const [current, setCurrent] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try { const response = await fetch(`/api/assessments/attempts/${attemptId}`, { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Could not load test."); const value = data.attempt as Attempt; setAttempt(value); setAnswers(value.answers?.length === 10 ? value.answers : Array(10).fill("")); setSeconds(Math.max(0, Math.floor((Date.now() - new Date(value.started_at).getTime()) / 1000))); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load test."); }
    finally { setLoading(false); }
  }, [attemptId]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => { if (!attempt || attempt.completed_at) return; const timer = window.setInterval(() => setSeconds(Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000)), 1000); return () => window.clearInterval(timer); }, [attempt]);

  function setAnswer(index: number, value: string) { setAnswers((previous) => previous.map((answer, position) => position === index ? value : answer)); }
  function toggleSentenceTile(questionIndex: number, tileIndex: number) {
    const question = attempt?.questions[questionIndex]; if (question?.type !== "sentence") return;
    setSentenceTiles((previous) => {
      const next = previous.map((entry) => [...entry]);
      const currentSelection = next[questionIndex];
      if (currentSelection.includes(tileIndex)) next[questionIndex] = currentSelection.filter((entry) => entry !== tileIndex);
      else if (currentSelection.length < (question.tiles?.length ?? 0)) next[questionIndex] = [...currentSelection, tileIndex];
      const result = next[questionIndex].map((entry) => question.tiles?.[entry] ?? "").join(" ").replace(/\s+([.,!?])/g, "$1");
      setAnswers((old) => old.map((answer, position) => position === questionIndex ? result : answer));
      return next;
    });
  }

  async function submit() {
    if (answers.some((answer) => !answer.trim())) { setError("Answer all 10 questions before submitting."); return; }
    setSubmitting(true); setError("");
    try { const response = await fetch(`/api/assessments/attempts/${attemptId}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ answers }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Could not submit test."); router.replace(`/assignments/results/${attemptId}`); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not submit test."); setSubmitting(false); }
  }

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
      {question.type === "vocabulary" ? <div className="assessment-answer-options">{question.choices?.map((choice) => <button key={choice} className={answers[current] === choice ? "selected" : ""} onClick={() => setAnswer(current, choice)}>{choice}</button>)}</div> : <><div className="assessment-sentence-answer" aria-label="Your sentence">{sentenceTiles[current].length ? sentenceTiles[current].map((tileIndex, order) => <button key={`${tileIndex}-${order}`} onClick={() => toggleSentenceTile(current, tileIndex)}>{question.tiles?.[tileIndex]}</button>) : <span>Tap word tiles in the correct order</span>}</div><div className="assessment-sentence-tiles">{question.tiles?.map((tile, index) => <button key={`${tile}-${index}`} disabled={sentenceTiles[current].includes(index)} onClick={() => toggleSentenceTile(current, index)}>{tile}</button>)}</div><button className="assessment-clear-answer" onClick={() => { setSentenceTiles((all) => all.map((entry, idx) => idx === current ? [] : entry)); setAnswer(current, ""); }}>Clear sentence</button></>}
      <p className="assessment-shuffle-note"><Lightbulb size={16} /> Questions mix vocabulary meanings and sentence building. Question order is randomized.</p>
    </section>
    {error && <AutoDismissMessage variant="error" className="my-4">{error}</AutoDismissMessage>}
    <footer className="assessment-test-actions"><Button variant="secondary" onClick={() => setCurrent((index) => Math.max(0, index - 1))} disabled={current === 0}><ArrowLeft size={17} /> Back</Button><Button variant="secondary" onClick={() => setCurrent((index) => Math.min(9, index + 1))} disabled={current === 9}>Next question <ArrowRight size={17} /></Button><Button onClick={() => void submit()} disabled={submitting}>{submitting ? "Submitting…" : "Submit test"} <Send size={17} /></Button></footer>
  </div>;
}
