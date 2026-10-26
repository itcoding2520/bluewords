import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";

const sharedFeatures = [
  {
    title: "My vocabulary",
    description: "Organize and review your words and categories.",
    href: "/vocabulary",
    icon: "/images/ui/icons/vocabulary.svg",
    illustration: "/images/ui/illustrations/vocabulary-books.svg",
    color: "bg-blue-50 text-blue-700",
    surface: "border-emerald-100 bg-[url('/images/ui/backgrounds/card-vocabulary.svg')]",
  },
  {
    title: "Flashcards",
    description: "Practice your vocabulary at your own pace.",
    href: "/flashcards",
    icon: "/images/ui/icons/flashcards.svg",
    illustration: "/images/ui/illustrations/flashcards-apple-cat.svg",
    color: "bg-emerald-50 text-emerald-700",
    surface: "border-pink-100 bg-[url('/images/ui/backgrounds/card-flashcards.svg')]",
  },
  {
    title: "Games",
    description: "Play Quiz and Word Search with your words.",
    href: "/games",
    icon: "/images/ui/icons/games.svg",
    illustration: "/images/ui/illustrations/game-controller.svg",
    color: "bg-violet-50 text-violet-700",
    surface: "border-violet-100 bg-[url('/images/ui/backgrounds/card-games.svg')]",
  },
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

const communityFeature = {
  title: "Publish vocabulary",
  description: "Request a review for words in your collection.",
  href: "/publish",
  icon: "/images/ui/icons/publish.svg",
  illustration: "/images/ui/illustrations/publish-globe-plane.svg",
  color: "bg-indigo-50 text-indigo-700",
  surface: "border-indigo-100 bg-[url('/images/ui/backgrounds/card-publish.svg')]",
};

const adminFeature = {
  title: "Admin tools",
  description: "Review requests and manage shared vocabulary.",
  href: "/admin",
  icon: ShieldCheck,
  illustration: undefined,
  color: "bg-orange-50 text-orange-700",
  surface: "border-orange-100 bg-[url('/images/ui/backgrounds/card-publish.svg')]",
};

export function DashboardFeatures({ isAdmin }: { isAdmin: boolean }) {
  const features = [...sharedFeatures, isAdmin ? adminFeature : communityFeature];

  return (
    <section className="mt-8">
      <div className="mb-4">
        <h2 className="text-xl font-extrabold tracking-tight text-blue-950 sm:text-2xl">Explore BlueWords <span aria-hidden="true">✨</span></h2>
        <p className="page-intro-description mt-2">
          Learn a little, play a little, grow every day!
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[640px]:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {features.map(({ title, description, href, icon, illustration, color, surface }) => (
          <Link key={href} href={href} className="group rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
            <Card className={`ui-art-background relative flex h-full min-h-48 flex-col overflow-hidden border bg-white p-4 transition group-hover:-translate-y-0.5 group-hover:shadow-md sm:min-h-52 sm:p-5 ${surface}`}>
              {illustration && <Image src={illustration} alt="" width={150} height={130} sizes="(min-width: 1441px) 132px, (min-width: 640px) 120px, 96px" className="pointer-events-none absolute bottom-0 right-1 z-0 h-28 w-[43%] max-w-36 object-contain drop-shadow-sm sm:h-32" />}
              <span className={`relative z-10 grid size-10 place-items-center rounded-xl shadow-sm sm:size-11 ${color}`}>
                <FeatureIcon icon={icon} />
              </span>
              <div className="relative z-10 mt-auto flex min-h-24 max-w-[55%] flex-1 flex-col justify-end sm:min-h-28">
                <h3 className="font-extrabold leading-tight text-slate-950">{title}</h3>
                <p className="mt-1 text-xs leading-4 text-slate-600 sm:text-sm sm:leading-5">{description}</p>
                <ArrowRight size={17} className="mt-2 text-slate-500 transition group-hover:translate-x-1 group-hover:text-blue-700" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

function FeatureIcon({ icon }: { icon: string | LucideIcon }) {
  if (typeof icon === "string") {
    return <Image src={icon} alt="" width={30} height={30} />;
  }

  const Icon = icon;
  return <Icon size={25} aria-hidden="true" />;
}
