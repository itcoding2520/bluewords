import type { QuizAnswer, QuizPhase, QuizQuestion } from "@/lib/quiz-model";

export interface QuizSessionState {
  phase: QuizPhase;
  questions: QuizQuestion[];
  questionIndex: number;
  answers: Record<number, QuizAnswer>;
  input: string;
  startedAt: number | null;
  elapsedSeconds: number;
}

export type QuizSessionAction =
  | { type: "start"; questions: QuizQuestion[]; startedAt: number }
  | { type: "answer"; questionIndex: number; answer: QuizAnswer }
  | { type: "input"; value: string }
  | { type: "tick"; elapsedSeconds: number }
  | { type: "advance"; elapsedSeconds: number }
  | { type: "exit" };

export const initialQuizSessionState: QuizSessionState = {
  phase: "setup",
  questions: [],
  questionIndex: 0,
  answers: {},
  input: "",
  startedAt: null,
  elapsedSeconds: 0,
};

export function quizSessionReducer(state: QuizSessionState, action: QuizSessionAction): QuizSessionState {
  switch (action.type) {
    case "start":
      return {
        phase: "playing",
        questions: action.questions,
        questionIndex: 0,
        answers: {},
        input: "",
        startedAt: action.startedAt,
        elapsedSeconds: 0,
      };
    case "answer":
      if (state.phase !== "playing" || action.questionIndex !== state.questionIndex || state.answers[action.questionIndex]) return state;
      return {
        ...state,
        answers: { ...state.answers, [action.questionIndex]: action.answer },
      };
    case "input":
      return state.phase === "playing" ? { ...state, input: action.value } : state;
    case "tick":
      return state.phase === "playing" || state.phase === "results"
        ? { ...state, elapsedSeconds: action.elapsedSeconds }
        : state;
    case "advance":
      if (state.phase !== "playing" || !state.answers[state.questionIndex]) return state;
      if (state.questionIndex + 1 >= state.questions.length) return { ...state, phase: "results", elapsedSeconds: action.elapsedSeconds };
      return {
        ...state,
        questionIndex: state.questionIndex + 1,
        input: "",
      };
    case "exit":
      return { ...state, phase: "setup", startedAt: null };
  }
}
