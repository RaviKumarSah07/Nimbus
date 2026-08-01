import { Container } from "../components/ui/Container";
import { HeroCarousel } from "../components/home/HeroCarousel";
import { CategoryTiles } from "../components/home/CategoryTiles";
import { CategoryShowcase } from "../components/home/CategoryShowcase";
import { ProductShelf } from "../components/home/ProductShelf";
import { ValuePropsBar } from "../components/home/ValuePropsBar";
import { DealOfTheDay } from "../components/home/DealOfTheDay";
import { PromoSplit } from "../components/home/PromoSplit";
import { BrandStrip } from "../components/home/BrandStrip";
import { StorefrontStats } from "../components/home/StorefrontStats";
import { getBanners, getBrands, getCategoryTree, getProducts } from "../lib/serverApi";

export default async function HomePage() {
  const [banners, categories, brands, featured, newArrivals, trending, onSale] = await Promise.all([
    getBanners(),
    getCategoryTree(),
    getBrands(),
    getProducts({ featured: "true", limit: "10" }),
    getProducts({ sort: "newest", limit: "10" }),
    getProducts({ sort: "popularity", limit: "10" }),
    getProducts({ onSale: "true", limit: "20" }),
  ]);

  const categoryCount = categories.flatMap((c) => [c, ...c.children]).length;

  return (
    <Container className="flex flex-col gap-4 py-4">
      <CategoryTiles categories={categories} />

      <HeroCarousel banners={banners} />

      <ValuePropsBar />

      <DealOfTheDay products={onSale.items} />

      <ProductShelf title="Featured picks" viewAllHref="/products?featured=true" products={featured.items} />

      <PromoSplit />

      <ProductShelf title="New arrivals" viewAllHref="/products?sort=newest" products={newArrivals.items} />

      <BrandStrip brands={brands} />

      <ProductShelf title="Trending now" viewAllHref="/products?sort=popularity" products={trending.items} />

      <CategoryShowcase categories={categories} />

      <StorefrontStats
        totalProducts={newArrivals.meta.total}
        categoryCount={categoryCount}
        brandCount={brands.length}
        ratedProducts={trending.items}
      />
    </Container>
  );
}
