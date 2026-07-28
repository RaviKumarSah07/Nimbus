import { Container } from "../components/ui/Container";
import { HeroBanner } from "../components/home/HeroBanner";
import { CategoryTiles } from "../components/home/CategoryTiles";
import { ProductShelf } from "../components/home/ProductShelf";
import { getBanners, getCategoryTree, getProducts } from "../lib/serverApi";

export default async function HomePage() {
  const [banners, categories, featured, newArrivals, trending] = await Promise.all([
    getBanners(),
    getCategoryTree(),
    getProducts({ featured: "true", limit: "8" }),
    getProducts({ sort: "newest", limit: "8" }),
    getProducts({ sort: "popularity", limit: "8" }),
  ]);

  return (
    <Container className="flex flex-col gap-12 py-8">
      <HeroBanner banners={banners} />

      <CategoryTiles categories={categories} />

      <ProductShelf title="Featured picks" viewAllHref="/products?featured=true" products={featured.items} />
      <ProductShelf title="New arrivals" viewAllHref="/products?sort=newest" products={newArrivals.items} />
      <ProductShelf title="Trending now" viewAllHref="/products?sort=popularity" products={trending.items} />
    </Container>
  );
}
