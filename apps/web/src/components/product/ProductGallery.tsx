"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import clsx from "clsx";

interface GalleryImage {
  url: string;
  altText: string | null;
}

export function ProductGallery({ images, productName }: { images: GalleryImage[]; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const active = images[activeIndex];

  if (!active) {
    return <div className="aspect-square w-full rounded-xl bg-slate-100" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setIsZoomed(true)}
        className="group relative aspect-square w-full overflow-hidden rounded-xl bg-slate-100"
        aria-label="Open full-size image"
      >
        <Image
          src={active.url}
          alt={active.altText ?? productName}
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </button>

      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show image ${index + 1}`}
              aria-current={index === activeIndex}
              className={clsx(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2",
                index === activeIndex ? "border-brand-600" : "border-transparent",
              )}
            >
              <Image src={image.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {isZoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} full-size image`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setIsZoomed(false)}
        >
          <button
            type="button"
            onClick={() => setIsZoomed(false)}
            aria-label="Close"
            className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="relative h-full max-h-[85vh] w-full max-w-4xl">
            <Image src={active.url} alt={active.altText ?? productName} fill sizes="90vw" className="object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
