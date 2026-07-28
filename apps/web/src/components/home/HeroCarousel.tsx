"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import type { BannerDto } from "../../lib/types";

const AUTOPLAY_INTERVAL_MS = 5000;

export function HeroCarousel({ banners }: { banners: BannerDto[] }) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goTo = useCallback((next: number) => {
    setIndex((current) => (next + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % banners.length), AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [banners.length, isPaused]);

  if (banners.length === 0) return null;

  const active = banners[index];

  return (
    <div
      className="group relative aspect-[21/9] w-full overflow-hidden rounded-md bg-slate-200 sm:aspect-[3/1]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {banners.map((banner, i) => (
        <BannerSlide key={banner.id} banner={banner} isActive={i === index} priority={i === 0} />
      ))}

      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Previous banner"
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 opacity-0 shadow-card transition-opacity group-hover:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Next banner"
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 opacity-0 shadow-card transition-opacity group-hover:opacity-100"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to banner ${i + 1}`}
                aria-current={i === index}
                className={clsx("h-1.5 rounded-full transition-all", i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/75")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BannerSlide({ banner, isActive, priority }: { banner: BannerDto; isActive: boolean; priority?: boolean }) {
  const content = (
    <div className={clsx("absolute inset-0 transition-opacity duration-500", isActive ? "opacity-100" : "pointer-events-none opacity-0")}>
      <Image src={banner.imageUrl} alt={banner.title} fill priority={priority} sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <p className="absolute bottom-8 left-4 right-4 text-lg font-bold text-white sm:left-8 sm:text-3xl">{banner.title}</p>
    </div>
  );

  return banner.linkUrl ? (
    <Link href={banner.linkUrl} aria-hidden={!isActive} tabIndex={isActive ? 0 : -1}>
      {content}
    </Link>
  ) : (
    content
  );
}
