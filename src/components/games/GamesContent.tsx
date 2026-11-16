import Image from "next/image";
import { Gamepad2, Star } from "lucide-react";

import { GamesLeaderboard } from "@/components/games/GamesLeaderboard";
import { GamesLibrary } from "@/components/games/GamesLibrary";
import { GamesVocabularyPreloader } from "@/components/games/GamesVocabularyPreloader";

export function GamesContent({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div className="games-page">
      <GamesVocabularyPreloader />
      <header className="games-hero">
        <div className="games-heading"><Star className="games-heading-star" aria-hidden="true" /><h1 className="page-title">Games</h1></div>
        <p className="page-intro-description">Choose a quick game to strengthen your vocabulary.</p>
        <div className="games-hero-mascot" aria-hidden="true">
          <span>Learn<br />Play<br />Grow!</span>
          <Image src="/images/ui/illustrations/hero-book-mascot.svg" alt="" width={240} height={200} />
        </div>
      </header>

      {isAuthenticated && <GamesLeaderboard />}

      <GamesLibrary />

      <div className="games-coming-soon">
        <Gamepad2 size={27} aria-hidden="true" />
        <p>More vocabulary games will appear here as they become available.</p>
        <Star className="games-footer-star" aria-hidden="true" />
      </div>
    </div>
  );
}
