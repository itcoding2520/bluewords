import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { DashboardFeature } from "@/data/dashboard-features";

type DashboardFeatureCardProps = {
  feature: DashboardFeature;
  layout: "member" | "guest";
};

export function DashboardFeatureCard({ feature, layout }: DashboardFeatureCardProps) {
  const isGuestLayout = layout === "guest";
  const icon = feature.icon;
  const Icon = typeof icon === "string" ? null : icon;

  return (
    <Link href={feature.href} className="group rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
      <Card className={`ui-art-background relative flex h-full flex-col overflow-hidden border bg-white p-4 transition group-hover:-translate-y-0.5 group-hover:shadow-md ${isGuestLayout ? "min-h-52 sm:p-6" : "min-h-48 sm:min-h-52 sm:p-5"} ${feature.surface}`}>
        <Image
          src={feature.illustration}
          alt=""
          width={150}
          height={130}
          sizes={isGuestLayout
            ? "(min-width: 640px) 120px, 96px"
            : "(min-width: 1441px) 132px, (min-width: 640px) 120px, 96px"}
          className="pointer-events-none absolute bottom-0 right-1 z-0 h-28 w-[43%] max-w-36 object-contain drop-shadow-sm sm:h-32"
        />
        <span className={`relative z-10 grid size-10 place-items-center rounded-xl ${isGuestLayout ? "" : "shadow-sm sm:size-11"} ${feature.color}`}>
          {typeof icon === "string"
            ? <Image src={icon} alt="" width={isGuestLayout ? 27 : 30} height={isGuestLayout ? 27 : 30} />
            : Icon && <Icon size={25} aria-hidden="true" />}
        </span>
        {!isGuestLayout && <h3 className="mt-3 font-extrabold leading-tight text-slate-950">{feature.title}</h3>}
        <div className={isGuestLayout
          ? "relative z-10 mt-auto flex min-h-28 max-w-[60%] flex-1 flex-col justify-end"
          : "relative z-10 mt-4 flex min-h-24 max-w-[55%] flex-col sm:min-h-28"}>
          {isGuestLayout && <h2 className="font-extrabold leading-tight text-slate-950">{feature.title}</h2>}
          <p className="mt-1 text-xs leading-4 text-slate-600 sm:text-sm sm:leading-5">{feature.description}</p>
          <ArrowRight size={isGuestLayout ? 18 : 17} className="mt-2 text-slate-500 transition group-hover:translate-x-1 group-hover:text-blue-700" />
        </div>
      </Card>
    </Link>
  );
}
