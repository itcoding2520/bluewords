import { MessageCircle, type LucideIcon } from "lucide-react";

export type DashboardFeature = {
  title: string;
  description: string;
  href: string;
  icon: string | LucideIcon;
  illustration: string;
  color: string;
  surface: string;
};

type DashboardGuestAction = Omit<DashboardFeature, "icon"> & { icon: string };

const vocabularyFeature: DashboardGuestAction = {
  title: "My vocabulary",
  description: "Organize and review your words and categories.",
  href: "/vocabulary",
  icon: "/images/ui/icons/vocabulary.svg",
  illustration: "/images/ui/illustrations/vocabulary-books.svg",
  color: "bg-blue-50 text-blue-700",
  surface: "border-emerald-100 bg-[url('/images/ui/backgrounds/card-vocabulary.svg')]",
};

const flashcardsFeature: DashboardGuestAction = {
  title: "Flashcards",
  description: "Practice your vocabulary at your own pace.",
  href: "/flashcards",
  icon: "/images/ui/icons/flashcards.svg",
  illustration: "/images/ui/illustrations/flashcards-apple-cat.svg",
  color: "bg-emerald-50 text-emerald-700",
  surface: "border-pink-100 bg-[url('/images/ui/backgrounds/card-flashcards.svg')]",
};

const gamesFeature: DashboardGuestAction = {
  title: "Games",
  description: "Play Quiz and Word Search with your words.",
  href: "/games",
  icon: "/images/ui/icons/games.svg",
  illustration: "/images/ui/illustrations/game-controller.svg",
  color: "bg-violet-50 text-violet-700",
  surface: "border-violet-100 bg-[url('/images/ui/backgrounds/card-games.svg')]",
};

const sharedFeatures: DashboardFeature[] = [
  vocabularyFeature,
  flashcardsFeature,
  gamesFeature,
  {
    title: "Videos",
    description: "Watch videos selected for vocabulary learners.",
    href: "/videos",
    icon: "/images/ui/icons/videos.svg",
    illustration: "/images/ui/illustrations/videos-penguin.svg",
    color: "bg-rose-50 text-rose-700",
    surface: "border-amber-100 bg-[url('/images/ui/backgrounds/card-videos.svg')]",
  },
  {
    title: "Review results",
    description: "See your Quiz and Word Search history.",
    href: "/reviews",
    icon: "/images/ui/icons/review-results.svg",
    illustration: "/images/ui/illustrations/review-trophy.svg",
    color: "bg-amber-50 text-amber-700",
    surface: "border-sky-100 bg-[url('/images/ui/backgrounds/card-review-results.svg')]",
  },
  {
    title: "Notifications",
    description: "Check updates about your vocabulary requests.",
    href: "/notifications",
    icon: "/images/ui/icons/notifications.svg",
    illustration: "/images/ui/illustrations/notifications-envelope.svg",
    color: "bg-sky-50 text-sky-700",
    surface: "border-rose-100 bg-[url('/images/ui/backgrounds/card-notifications.svg')]",
  },
  {
    title: "My profile",
    description: "Update your name, avatar, and account details.",
    href: "/profile",
    icon: "/images/ui/icons/profile.svg",
    illustration: "/images/ui/illustrations/profile-jenny.svg",
    color: "bg-fuchsia-50 text-fuchsia-700",
    surface: "border-emerald-100 bg-[url('/images/ui/backgrounds/card-profile.svg')]",
  },
];

const communityFeature: DashboardFeature = {
  title: "Publish vocabulary",
  description: "Request a review for words in your collection.",
  href: "/publish",
  icon: "/images/ui/icons/publish.svg",
  illustration: "/images/ui/illustrations/publish-globe-plane.svg",
  color: "bg-indigo-50 text-indigo-700",
  surface: "border-indigo-100 bg-[url('/images/ui/backgrounds/card-publish.svg')]",
};

const englishPracticeFeature: DashboardFeature = {
  title: "English practice",
  description: "Learn useful words, phrases, and conversations by situation.",
  href: "/communication",
  icon: MessageCircle,
  illustration: "/images/ui/illustrations/vocabulary-books.svg",
  color: "bg-cyan-50 text-cyan-700",
  surface: "border-cyan-100 bg-[url('/images/ui/backgrounds/card-vocabulary.svg')]",
};

export function getDashboardFeatures(isAdmin: boolean): DashboardFeature[] {
  return [...sharedFeatures, englishPracticeFeature, ...(isAdmin ? [] : [communityFeature])];
}

export function getGuestHomeFeatures(): DashboardGuestAction[] {
  return [
    {
      ...vocabularyFeature,
      title: "Explore vocabulary",
      description: "Browse default words and community words approved for everyone.",
    },
    {
      ...flashcardsFeature,
      title: "Practice with flashcards",
      description: "Review public vocabulary at your own pace.",
    },
    {
      ...gamesFeature,
      title: "Play a vocabulary game",
      description: "Try Word Search or Quiz using public words.",
    },
  ];
}
