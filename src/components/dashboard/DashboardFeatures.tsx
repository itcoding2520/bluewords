import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { getDashboardFeatures, type DashboardFeature } from "@/data/dashboard-features";

export function DashboardFeatures({ isAdmin }: { isAdmin: boolean }) {
  const features = getDashboardFeatures(isAdmin);

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
              <h3 className="font-extrabold leading-tight text-slate-950 mt-3">{title}</h3>
              <div className="relative z-10 mt-4 flex min-h-24 max-w-[55%] flex-col sm:min-h-28">
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

function FeatureIcon({ icon }: { icon: DashboardFeature["icon"] }) {
  if (typeof icon === "string") {
    return <Image src={icon} alt="" width={30} height={30} />;
  }

  const Icon = icon;
  return <Icon size={25} aria-hidden="true" />;
}
