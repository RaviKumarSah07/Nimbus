export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

export interface CategoryNode extends CategorySummary {
  children: CategoryNode[];
}

export interface BrandSummary {
  id: string;
  name: string;
  slug: string;
}

export interface ProductImageDto {
  url: string;
  altText: string | null;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  isFeatured: boolean;
  avgRating: number;
  ratingCount: number;
  category: CategorySummary | null;
  brand: BrandSummary | null;
  image: ProductImageDto | null;
  inStock: boolean;
  priceRange: { min: number; max: number } | null;
}

export interface ProductVariantDto {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  priceOverride: number | null;
  stock: number;
  imageUrl: string | null;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  compareAtPrice: number | null;
  currency: string;
  isFeatured: boolean;
  avgRating: number;
  ratingCount: number;
  category: (CategorySummary & { parent: CategorySummary | null }) | null;
  brand: BrandSummary | null;
  images: { id: string; url: string; altText: string | null; position: number }[];
  variants: ProductVariantDto[];
  ratingBreakdown: { star: number; count: number }[];
}

export interface BannerDto {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  position: number;
}

export interface ReviewDto {
  id: string;
  rating: number;
  title: string;
  body: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  user: { id: string; name: string };
}
