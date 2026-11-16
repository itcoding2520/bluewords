"use client";

import { ClipboardList, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { DifficultyOptions } from "@/components/ui/DifficultyOptions";
import { ASSESSMENT_QUESTION_COUNT, ASSESSMENT_QUESTION_COUNTS } from "@/lib/assessments/constants";

export function AdminAssessmentTestsPanel({
  title,
  onTitleChange,
  difficulty,
  onDifficultyChange,
  onContinue,
}: {
  title: string;
  onTitleChange: (value: string) => void;
  difficulty: string;
  onDifficultyChange: (value: string) => void;
  onContinue: () => void;
}) {
  return <>
    <section className="assessment-admin-card assessment-create-form">
      <div className="assessment-card-heading"><span><ClipboardList size={19} /></span><div><h2>Create a test</h2><p>Choose a title and level. BlueWords builds a fresh set of {ASSESSMENT_QUESTION_COUNT} questions.</p></div></div>
      <label>Test title<input required maxLength={120} value={title} onChange={(event) => onTitleChange(event.target.value)} placeholder="e.g. Everyday English" /></label>
      <label>Difficulty<Select aria-label="Difficulty" containerClassName="w-full" className="!h-[2.65rem] !rounded-xl !border-slate-200 !px-3 !text-sm" value={difficulty} onChange={(event) => onDifficultyChange(event.target.value)}><DifficultyOptions labelStyle="bilingual-dot" /></Select></label>
      <p className="assessment-fixed-info">Each correct answer earns 10 points. Learners pass with more than 50 points; 50 or less means they try again.</p>
      <Button type="button" disabled={!title.trim()} onClick={onContinue}>Continue to assignments <Send size={17} /></Button>
    </section>
    <section className="assessment-admin-card assessment-test-blueprint"><div className="assessment-card-heading"><span><ClipboardList size={19} /></span><div><h2>Test blueprint</h2><p>Questions are selected from the active word and sentence banks.</p></div></div><div className="assessment-blueprint-grid"><article><b>{ASSESSMENT_QUESTION_COUNTS.vocabulary}</b><strong>Vocabulary</strong><span>Meaning choices with picture clues</span></article><article><b>{ASSESSMENT_QUESTION_COUNTS.sentence}</b><strong>Sentence building</strong><span>Arrange tiles from a Vietnamese clue</span></article></div><p className="assessment-private-note">All {ASSESSMENT_QUESTION_COUNT} questions are shuffled for each learner and each retry.</p></section>
  </>;
}
