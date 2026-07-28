import Image from "next/image";
import Link from "next/link";
import type { BannerDto } from "../../lib/types";

export function HeroBanner({ banners }: { banners: BannerDto[] }) {
  if (banners.length === 0) return null;
  const [primary, ...rest] = banners;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <BannerCard banner={primary} className="lg:col-span-2 lg:aspect-[21/9]" priority />
      {rest.slice(0, 1).map((banner) => (
        <BannerCard key={banner.id} banner={banner} className="lg:aspect-[21/9]" />
      ))}
    </div>
  );
}

function BannerCard({ banner, className, priority }: { banner: BannerDto; className?: string; priority?: boolean }) {
  const content = (
    <div className={`group relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-200 ${className ?? ""}`}>
      <Image
        src={banner.imageUrl}
        alt={banner.title}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 60vw, 100vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <p className="absolute bottom-4 left-4 right-4 text-lg font-semibold text-white sm:text-2xl">{banner.title}</p>
    </div>
  );

  return banner.linkUrl ? <Link href={banner.linkUrl}>{content}</Link> : content;
}
