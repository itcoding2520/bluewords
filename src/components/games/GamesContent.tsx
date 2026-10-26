import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Brain, Gamepad2, Grid3X3, Search, Star } from "lucide-react";

import { GamesLeaderboard } from "@/components/games/GamesLeaderboard";

function WordSearchArtwork() {
  return (
    <div className="game-art game-art-search" aria-hidden="true">
      <div className="game-letter-board">
        {"CATDOGRAINBKSUNFIRBOOKLM".split("").map((letter, index) => (
          <span key={index} className={[1, 9, 13, 17, 21].includes(index) ? "game-letter-highlight" : ""}>{letter}</span>
        ))}
      </div>
      <Search className="game-magnifier" strokeWidth={2.5} />
      <span className="game-leaf game-leaf-one" /><span className="game-leaf game-leaf-two" />
    </div>
  );
}

function QuizArtwork() {
  return (
    <div className="game-art game-art-quiz" aria-hidden="true">
      <div className="game-apple-card"><span>🍎</span><strong>apple</strong></div>
      <div className="game-answers">
        {["apple", "banana", "dog"].map((answer, index) => <span key={answer}><b>{String.fromCharCode(65 + index)}</b>{answer}</span>)}
      </div>
      <span className="game-quiz-spark">✦</span>
    </div>
  );
}

const games = [
  { title: "Word Search", description: "Find your vocabulary hidden across a letter grid.", href: "/games/word-search", icon: Grid3X3, theme: "search", Artwork: WordSearchArtwork },
  { title: "Vocabulary Quiz", description: "Practice meanings or recall words from images.", href: "/quiz", icon: Brain, theme: "quiz", Artwork: QuizArtwork },
];

export function GamesContent({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div className="games-page">
      <header className="games-hero">
        <div className="games-heading"><Star className="games-heading-star" aria-hidden="true" /><h1>Games</h1></div>
        <p>Choose a quick game to strengthen your vocabulary.</p>
        <div className="games-hero-mascot" aria-hidden="true">
          <span>Learn<br />Play<br />Grow!</span>
          <Image src="/images/ui/illustrations/hero-book-mascot.svg" alt="" width={240} height={200} />
        </div>
      </header>

      <div className="games-card-grid">
        {games.map(({ title, description, href, icon: Icon, theme, Artwork }) => (
          <Link key={title} href={href} className={`game-feature game-feature-${theme}`}>
            <div className="game-feature-copy">
              <span className="game-feature-icon"><Icon size={30} strokeWidth={2.5} /></span>
              <h2>{title}</h2>
              <p>{description}</p>
              <span className="game-play-button">Play now <ArrowRight size={21} /></span>
            </div>
            <Artwork />
            <Star className="game-card-star" aria-hidden="true" />
          </Link>
        ))}
      </div>

      {isAuthenticated && <GamesLeaderboard />}

      <div className="games-coming-soon">
        <Gamepad2 size={27} aria-hidden="true" />
        <p>More vocabulary games will appear here as they become available.</p>
        <Star className="games-footer-star" aria-hidden="true" />
      </div>
    </div>
  );
}
