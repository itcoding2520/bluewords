import { Flag, Map } from "lucide-react";
import { WORD_MAZE_QUESTION_COUNT } from "@/lib/word-maze";

const pathNodes = [
  { x: 9, y: 77 },
  { x: 25, y: 67 },
  { x: 40, y: 76 },
  { x: 55, y: 60 },
  { x: 69, y: 67 },
  { x: 83, y: 43 },
];

export function WordMazeMap({ progress, feedback }: { progress: number; feedback: "correct" | "wrong" | null }) {
  const mascot = pathNodes[Math.min(progress, pathNodes.length - 1)];
  return (
    <section className="word-maze-map" aria-label={`Maze progress: ${progress} of ${WORD_MAZE_QUESTION_COUNT} paths opened`}>
      <div className="word-maze-map-sky" />
      <div className="word-maze-mountain">⛰️</div>
      <div className="word-maze-forest word-maze-forest-one">🌲 🌳 🌲</div>
      <div className="word-maze-forest word-maze-forest-two">🌳 🌲 🌳</div>
      <svg className="word-maze-route" viewBox="0 0 600 380" role="img" aria-label="A winding trail through the maze toward the finish flag">
        <path d="M55 292 C95 300 118 248 153 253 S220 319 260 288 S315 217 336 211 S385 260 426 223 S466 149 504 151" pathLength="100" className="word-maze-road" />
        <path d="M55 292 C95 300 118 248 153 253 S220 319 260 288 S315 217 336 211 S385 260 426 223 S466 149 504 151" pathLength="100" className="word-maze-road-open" style={{ strokeDashoffset: `${100 - Math.min(progress, WORD_MAZE_QUESTION_COUNT) * (100 / WORD_MAZE_QUESTION_COUNT)}%` }} />
        {pathNodes.slice(0, WORD_MAZE_QUESTION_COUNT + 1).map((node, index) => <circle key={index} cx={node.x * 6} cy={node.y * 3.8} r="13" className={`word-maze-node ${index <= progress ? "is-open" : ""} ${index === progress ? "is-current" : ""}`} />)}
      </svg>
      <div className={`word-maze-mascot ${feedback === "wrong" ? "is-worried" : ""}`} style={{ left: `${mascot.x}%`, top: `${mascot.y}%` }} aria-hidden="true">📘</div>
      <span className="word-maze-start-sign">START</span>
      <span className="word-maze-finish-sign"><Flag size={18} fill="currentColor" /> FINISH</span>
      <span className="word-maze-rock" aria-hidden="true">🪨</span>
      <p className="word-maze-map-caption"><Map size={16} /> Open the right path to reach the finish!</p>
    </section>
  );
}
