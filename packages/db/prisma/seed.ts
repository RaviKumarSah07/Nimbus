import bcrypt from "bcryptjs";
import { PrismaClient, Role, CouponType } from "../src/generated/client";

const prisma = new PrismaClient();

function placeholderImage(seed: string, w = 800, h = 800) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

async function main() {
  console.log("Seeding database...");

  // ---------- Users ----------
  const adminPasswordHash = await bcrypt.hash("Admin123!", 12);
  const customerPasswordHash = await bcrypt.hash("Customer123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash: adminPasswordHash,
      name: "Store Admin",
      role: Role.ADMIN,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      email: "customer@example.com",
      passwordHash: customerPasswordHash,
      name: "Jane Shopper",
      role: Role.CUSTOMER,
      addresses: {
        create: [
          {
            label: "Home",
            fullName: "Jane Shopper",
            phone: "+1 555 010 2020",
            line1: "221B Baker Street",
            city: "Austin",
            state: "TX",
            postalCode: "73301",
            country: "US",
            isDefaultShipping: true,
            isDefaultBilling: true,
          },
        ],
      },
    },
  });

  // ---------- Brands ----------
  const brandNames = ["Apple", "Samsung", "Sony", "Nike", "Adidas", "IKEA", "Generic Goods"];
  const brands: Record<string, string> = {};
  for (const name of brandNames) {
    const brand = await prisma.brand.upsert({
      where: { slug: name.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: { name, slug: name.toLowerCase().replace(/\s+/g, "-") },
    });
    brands[name] = brand.id;
  }

  // ---------- Categories ----------
  const electronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: { name: "Electronics", slug: "electronics", description: "Phones, laptops, audio and more.", imageUrl: placeholderImage("cat-electronics", 600, 400) },
  });
  const laptops = await prisma.category.upsert({
    where: { slug: "laptops" },
    update: {},
    create: { name: "Laptops", slug: "laptops", parentId: electronics.id, imageUrl: placeholderImage("cat-laptops", 600, 400) },
  });
  const smartphones = await prisma.category.upsert({
    where: { slug: "smartphones" },
    update: {},
    create: { name: "Smartphones", slug: "smartphones", parentId: electronics.id, imageUrl: placeholderImage("cat-phones", 600, 400) },
  });
  const audio = await prisma.category.upsert({
    where: { slug: "audio" },
    update: {},
    create: { name: "Audio", slug: "audio", parentId: electronics.id, imageUrl: placeholderImage("cat-audio", 600, 400) },
  });

  const fashion = await prisma.category.upsert({
    where: { slug: "fashion" },
    update: {},
    create: { name: "Fashion", slug: "fashion", description: "Apparel and footwear for every day.", imageUrl: placeholderImage("cat-fashion", 600, 400) },
  });
  const mensClothing = await prisma.category.upsert({
    where: { slug: "mens-clothing" },
    update: {},
    create: { name: "Men's Clothing", slug: "mens-clothing", parentId: fashion.id, imageUrl: placeholderImage("cat-mens", 600, 400) },
  });
  const shoes = await prisma.category.upsert({
    where: { slug: "shoes" },
    update: {},
    create: { name: "Shoes", slug: "shoes", parentId: fashion.id, imageUrl: placeholderImage("cat-shoes", 600, 400) },
  });

  const home = await prisma.category.upsert({
    where: { slug: "home-kitchen" },
    update: {},
    create: { name: "Home & Kitchen", slug: "home-kitchen", description: "Furniture and essentials for the home.", imageUrl: placeholderImage("cat-home", 600, 400) },
  });

  // ---------- Products ----------
  type SeedVariant = { sku: string; size?: string; color?: string; priceOverride?: number; stock: number };
  type SeedProduct = {
    name: string;
    slug: string;
    description: string;
    categoryId: string;
    brandId?: string;
    basePrice: number;
    compareAtPrice?: number;
    isFeatured?: boolean;
    variants: SeedVariant[];
  };

  const products: SeedProduct[] = [
    {
      name: "AeroBook Pro 14",
      slug: "aerobook-pro-14",
      description:
        "A 14-inch ultralight laptop with all-day battery life, a vivid 120Hz display, and a silent fanless design. Built for developers, designers, and anyone who refuses to be tethered to an outlet.",
      categoryId: laptops.id,
      brandId: brands["Apple"],
      basePrice: 1499,
      compareAtPrice: 1699,
      isFeatured: true,
      variants: [
        { sku: "AEROBOOK14-256-SLV", color: "Silver", size: "256GB", stock: 18 },
        { sku: "AEROBOOK14-512-SLV", color: "Silver", size: "512GB", stock: 9, priceOverride: 1699 },
        { sku: "AEROBOOK14-256-GRY", color: "Space Gray", size: "256GB", stock: 4 },
      ],
    },
    {
      name: "GalaxyWave S24",
      slug: "galaxywave-s24",
      description:
        "Flagship smartphone with a 6.5-inch AMOLED display, triple camera system, and 5G connectivity. Ships with a 2-year manufacturer warranty.",
      categoryId: smartphones.id,
      brandId: brands["Samsung"],
      basePrice: 899,
      isFeatured: true,
      variants: [
        { sku: "GWAVE-S24-128-BLK", color: "Black", size: "128GB", stock: 25 },
        { sku: "GWAVE-S24-256-BLK", color: "Black", size: "256GB", stock: 12, priceOverride: 999 },
        { sku: "GWAVE-S24-128-GLD", color: "Gold", size: "128GB", stock: 2 },
      ],
    },
    {
      name: "Sonique Noise-Cancelling Headphones",
      slug: "sonique-anc-headphones",
      description:
        "Over-ear wireless headphones with adaptive noise cancellation, 30-hour battery life, and studio-tuned sound.",
      categoryId: audio.id,
      brandId: brands["Sony"],
      basePrice: 279,
      compareAtPrice: 329,
      isFeatured: true,
      variants: [
        { sku: "SONIQUE-ANC-BLK", color: "Black", stock: 40 },
        { sku: "SONIQUE-ANC-WHT", color: "White", stock: 0 },
      ],
    },
    {
      name: "Pulse Mini Bluetooth Speaker",
      slug: "pulse-mini-speaker",
      description: "Compact, waterproof Bluetooth speaker with 12 hours of playtime and surprisingly big sound.",
      categoryId: audio.id,
      brandId: brands["Generic Goods"],
      basePrice: 49.99,
      variants: [
        { sku: "PULSEMINI-BLU", color: "Blue", stock: 60 },
        { sku: "PULSEMINI-RED", color: "Red", stock: 55 },
        { sku: "PULSEMINI-BLK", color: "Black", stock: 30 },
      ],
    },
    {
      name: "Runner Elite Trainers",
      slug: "runner-elite-trainers",
      description: "Lightweight running shoes with responsive foam cushioning and a breathable knit upper.",
      categoryId: shoes.id,
      brandId: brands["Nike"],
      basePrice: 129.99,
      isFeatured: true,
      variants: [
        { sku: "RUNELITE-9-BLK", size: "US 9", color: "Black", stock: 20 },
        { sku: "RUNELITE-10-BLK", size: "US 10", color: "Black", stock: 15 },
        { sku: "RUNELITE-10-WHT", size: "US 10", color: "White", stock: 8 },
        { sku: "RUNELITE-11-WHT", size: "US 11", color: "White", stock: 0 },
      ],
    },
    {
      name: "StreetForm Track Jacket",
      slug: "streetform-track-jacket",
      description: "Classic three-stripe track jacket in soft brushed fleece. A wardrobe staple that never goes out of style.",
      categoryId: mensClothing.id,
      brandId: brands["Adidas"],
      basePrice: 74.99,
      compareAtPrice: 89.99,
      variants: [
        { sku: "STRTJKT-S-NVY", size: "S", color: "Navy", stock: 14 },
        { sku: "STRTJKT-M-NVY", size: "M", color: "Navy", stock: 22 },
        { sku: "STRTJKT-L-NVY", size: "L", color: "Navy", stock: 17 },
        { sku: "STRTJKT-M-BLK", size: "M", color: "Black", stock: 9 },
      ],
    },
    {
      name: "Nordic Oak Coffee Table",
      slug: "nordic-oak-coffee-table",
      description: "Solid oak coffee table with a minimalist Scandinavian silhouette. Assembly required, hardware included.",
      categoryId: home.id,
      brandId: brands["IKEA"],
      basePrice: 219,
      isFeatured: true,
      variants: [{ sku: "NORDIC-OAK-TABLE", stock: 11 }],
    },
    {
      name: "LumaGlow Desk Lamp",
      slug: "lumaglow-desk-lamp",
      description: "Adjustable LED desk lamp with 5 brightness levels, USB-C charging port, and a flicker-free display-safe glow.",
      categoryId: home.id,
      brandId: brands["Generic Goods"],
      basePrice: 34.99,
      variants: [
        { sku: "LUMAGLOW-WHT", color: "White", stock: 45 },
        { sku: "LUMAGLOW-BLK", color: "Black", stock: 38 },
      ],
    },
    {
      name: "TrailBlaze 40L Backpack",
      slug: "trailblaze-40l-backpack",
      description: "Weatherproof 40-liter hiking backpack with a ventilated back panel and integrated rain cover.",
      categoryId: home.id,
      brandId: brands["Generic Goods"],
      basePrice: 89.99,
      variants: [
        { sku: "TRAILBLAZE-GRN", color: "Forest Green", stock: 19 },
        { sku: "TRAILBLAZE-GRY", color: "Charcoal", stock: 6 },
      ],
    },
    {
      name: "AeroBook Air 13",
      slug: "aerobook-air-13",
      description: "The entry-level sibling of the AeroBook Pro — same silent fanless design in a smaller, lighter, more affordable frame.",
      categoryId: laptops.id,
      brandId: brands["Apple"],
      basePrice: 999,
      variants: [
        { sku: "AEROAIR13-128-SLV", color: "Silver", size: "128GB", stock: 30 },
        { sku: "AEROAIR13-256-SLV", color: "Silver", size: "256GB", stock: 21, priceOverride: 1149 },
      ],
    },
    {
      name: "GalaxyWave Buds Pro",
      slug: "galaxywave-buds-pro",
      description: "True wireless earbuds with active noise cancellation and a compact charging case rated for 24 extra hours.",
      categoryId: audio.id,
      brandId: brands["Samsung"],
      basePrice: 149.99,
      compareAtPrice: 179.99,
      variants: [
        { sku: "GWAVEBUDS-BLK", color: "Black", stock: 50 },
        { sku: "GWAVEBUDS-WHT", color: "White", stock: 41 },
      ],
    },
    {
      name: "Classic Oxford Shirt",
      slug: "classic-oxford-shirt",
      description: "A tailored-fit button-down oxford shirt in breathable cotton. Works equally well with a blazer or rolled sleeves.",
      categoryId: mensClothing.id,
      brandId: brands["Generic Goods"],
      basePrice: 44.99,
      variants: [
        { sku: "OXFORD-S-WHT", size: "S", color: "White", stock: 25 },
        { sku: "OXFORD-M-WHT", size: "M", color: "White", stock: 30 },
        { sku: "OXFORD-M-BLU", size: "M", color: "Light Blue", stock: 18 },
        { sku: "OXFORD-L-BLU", size: "L", color: "Light Blue", stock: 12 },
      ],
    },
  ];

  const createdProducts = [];
  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        categoryId: p.categoryId,
        brandId: p.brandId,
        basePrice: p.basePrice,
        compareAtPrice: p.compareAtPrice,
        isFeatured: p.isFeatured ?? false,
        images: {
          create: [0, 1, 2].map((i) => ({
            url: placeholderImage(`${p.slug}-${i}`),
            altText: `${p.name} photo ${i + 1}`,
            position: i,
          })),
        },
        variants: {
          create: p.variants,
        },
      },
      include: { variants: true },
    });
    createdProducts.push(product);
  }

  // ---------- Reviews (also drives avgRating/ratingCount for realism) ----------
  const reviewSeed = [
    { slug: "aerobook-pro-14", rating: 5, title: "Worth every penny", body: "Silent, fast, and the battery genuinely lasts all day." },
    { slug: "galaxywave-s24", rating: 4, title: "Great camera, so-so battery", body: "Photos are excellent in daylight. Battery is fine, not amazing." },
    { slug: "sonique-anc-headphones", rating: 5, title: "Best ANC I've used", body: "Blocks out my open-plan office almost entirely." },
    { slug: "runner-elite-trainers", rating: 4, title: "Comfortable out of the box", body: "No break-in period needed, great for daily runs." },
  ];

  for (const r of reviewSeed) {
    const product = createdProducts.find((p) => p.slug === r.slug);
    if (!product) continue;
    await prisma.review.upsert({
      where: { productId_userId: { productId: product.id, userId: customer.id } },
      update: {},
      create: {
        productId: product.id,
        userId: customer.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        isVerifiedPurchase: true,
      },
    });
    const agg = await prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.product.update({
      where: { id: product.id },
      data: {
        avgRating: agg._avg.rating ?? 0,
        ratingCount: agg._count.rating,
      },
    });
  }

  // ---------- Coupons ----------
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      type: CouponType.PERCENTAGE,
      value: 10,
      minSubtotal: 50,
      usageLimit: 500,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: "SAVE20" },
    update: {},
    create: {
      code: "SAVE20",
      type: CouponType.FIXED,
      value: 20,
      minSubtotal: 100,
      usageLimit: 200,
      isActive: true,
    },
  });

  // ---------- Banners ----------
  await prisma.banner.createMany({
    data: [
      {
        title: "Summer Tech Sale — up to 20% off audio",
        imageUrl: placeholderImage("banner-audio-sale", 1600, 500),
        linkUrl: "/products?category=audio",
        position: 0,
      },
      {
        title: "New arrivals in Fashion",
        imageUrl: placeholderImage("banner-fashion", 1600, 500),
        linkUrl: "/products?category=fashion",
        position: 1,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed complete.");
  console.log(`Admin login: admin@example.com / Admin123!`);
  console.log(`Customer login: customer@example.com / Customer123!`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
