import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Container } from "../../../components/ui/Container";
import { RatingBadge } from "../../../components/ui/RatingBadge";
import { ProductGallery } from "../../../components/product/ProductGallery";
import { ProductPurchasePanel } from "../../../components/product/ProductPurchasePanel";
import { RatingBreakdown } from "../../../components/product/RatingBreakdown";
import { ReviewForm } from "../../../components/product/ReviewForm";
import { ReviewList } from "../../../components/product/ReviewList";
import { RecentlyViewedTracker } from "../../../components/product/RecentlyViewedTracker";
import { RecentlyViewed } from "../../../components/product/RecentlyViewed";
import { ProductShelf } from "../../../components/home/ProductShelf";
import { getProductBySlug, getRelatedProducts } from "../../../lib/serverApi";

interface ProductPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Product not found" };

  const description = product.description.slice(0, 155);
  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const related = await getRelatedProducts(params.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((img) => img.url),
    brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
    aggregateRating:
      product.ratingCount > 0
        ? { "@type": "AggregateRating", ratingValue: product.avgRating, reviewCount: product.ratingCount }
        : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency,
      price: product.basePrice,
      availability: product.variants.some((v) => v.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <Container className="flex flex-col gap-4 py-4">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <RecentlyViewedTracker productId={product.id} />

      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-slate-500">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <Link href="/products" className="hover:text-brand-600">
          All products
        </Link>
        {product.category && (
          <>
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-brand-600">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <span className="font-medium text-slate-700">{product.name}</span>
      </nav>

      <div className="grid gap-8 rounded-md bg-white p-4 shadow-card sm:p-6 lg:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div className="flex flex-col gap-3">
          {product.brand && <p className="text-sm font-medium uppercase tracking-wide text-slate-400">{product.brand.name}</p>}
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{product.name}</h1>
          {product.ratingCount > 0 && (
            <div>
              <RatingBadge rating={product.avgRating} count={product.ratingCount} size="md" />
            </div>
          )}
          <div className="border-t border-slate-100 pt-4">
            <ProductPurchasePanel product={product} />
          </div>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-md bg-white p-4 shadow-card sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Description</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{product.description}</p>
        </div>
        <div className="rounded-md bg-white p-4 shadow-card sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Ratings & reviews</h2>
          <RatingBreakdown avgRating={product.avgRating} ratingCount={product.ratingCount} breakdown={product.ratingBreakdown} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-md bg-white p-4 shadow-card sm:p-6">
          <ReviewForm productId={product.id} />
        </div>
        <div className="rounded-md bg-white p-4 shadow-card sm:p-6">
          <ReviewList productId={product.id} />
        </div>
      </section>

      {related.length > 0 && <ProductShelf title="You might also like" viewAllHref="/products" products={related} />}

      <RecentlyViewed excludeProductId={product.id} />
    </Container>
  );
}
