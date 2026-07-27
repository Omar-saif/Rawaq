import { PrismaClient, DiscountType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // ── Admin User ────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin@Rawaq2025!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@rawaq.sa" },
    update: {},
    create: {
      email: "admin@rawaq.sa",
      name: "Rawaq Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // ── Categories ────────────────────────────────────────────────────────────
  const clothingCat = await prisma.category.upsert({
    where: { slug: "clothing" },
    update: {},
    create: {
      name: "Clothing",
      nameAr: "الملابس",
      slug: "clothing",
      sortOrder: 1,
      attributeSchema: [
        { key: "size", label: "Size (cm)", labelAr: "المقاس", type: "select", options: ["48", "50", "52", "54", "56", "58", "60", "62"], unit: "cm" },
        { key: "fabric", label: "Fabric", labelAr: "القماش", type: "select", options: ["Cotton", "Linen", "Polyester", "Silk-blend", "Wool"] },
        { key: "color", label: "Color", labelAr: "اللون", type: "multiselect", options: ["White", "Cream", "Black", "Navy", "Gray", "Beige", "Brown"] },
      ],
    },
  });

  const perfumesCat = await prisma.category.upsert({
    where: { slug: "perfumes" },
    update: {},
    create: {
      name: "Perfumes",
      nameAr: "العطور",
      slug: "perfumes",
      sortOrder: 2,
      attributeSchema: [
        { key: "volume", label: "Volume", labelAr: "الحجم", type: "select", options: ["3ml", "6ml", "10ml", "30ml", "50ml", "100ml"], unit: "ml" },
        { key: "scent_family", label: "Scent Family", labelAr: "عائلة العطر", type: "multiselect", options: ["Oud", "Musk", "Rose", "Amber", "Sandalwood", "Citrus", "Floral", "Woody"] },
        { key: "concentration", label: "Concentration", labelAr: "التركيز", type: "select", options: ["Attar Oil", "Eau de Parfum", "Eau de Toilette"] },
      ],
    },
  });

  // Clothing subcategories
  const thobesCat = await prisma.category.upsert({
    where: { slug: "thobes-thawbs" },
    update: {},
    create: { name: "Thobes & Thawbs", nameAr: "الأثواب", slug: "thobes-thawbs", parentId: clothingCat.id, sortOrder: 1,
      attributeSchema: [
        { key: "size", label: "Size (cm)", labelAr: "المقاس", type: "select", options: ["48","50","52","54","56","58","60","62"], unit: "cm" },
        { key: "fabric", label: "Fabric", labelAr: "القماش", type: "select", options: ["Cotton","Linen","Polyester","Silk-blend"] },
        { key: "color", label: "Color", labelAr: "اللون", type: "multiselect", options: ["White","Cream","Black","Gray","Beige"] },
        { key: "collar_style", label: "Collar Style", labelAr: "نوع الياقة", type: "select", options: ["Mandarin","Band","Classic"] },
      ],
    },
  });

  const abayasCat = await prisma.category.upsert({
    where: { slug: "abayas" },
    update: {},
    create: { name: "Abayas", nameAr: "العبايات", slug: "abayas", parentId: clothingCat.id, sortOrder: 2,
      attributeSchema: [
        { key: "size", label: "Size", labelAr: "المقاس", type: "select", options: ["XS","S","M","L","XL","XXL"] },
        { key: "fabric", label: "Fabric", labelAr: "القماش", type: "select", options: ["Nidha","Crepe","Chiffon","Lace","Velvet"] },
        { key: "color", label: "Color", labelAr: "اللون", type: "multiselect", options: ["Black","Navy","Beige","Gray","Brown"] },
        { key: "style", label: "Style", labelAr: "الأسلوب", type: "select", options: ["Classic","Open-front","Butterfly","Kimono"] },
      ],
    },
  });

  const outerwearCat = await prisma.category.upsert({
    where: { slug: "modest-outerwear" },
    update: {},
    create: { name: "Modest Outerwear", nameAr: "الملابس الخارجية", slug: "modest-outerwear", parentId: clothingCat.id, sortOrder: 3,
      attributeSchema: [
        { key: "size", label: "Size", labelAr: "المقاس", type: "select", options: ["XS","S","M","L","XL","XXL"] },
        { key: "color", label: "Color", labelAr: "اللون", type: "multiselect", options: ["Black","Navy","Beige","Camel","Gray"] },
      ],
    },
  });

  const prayerDressCat = await prisma.category.upsert({
    where: { slug: "prayer-dresses" },
    update: {},
    create: { name: "Prayer Dresses", nameAr: "فساتين الصلاة", slug: "prayer-dresses", parentId: clothingCat.id, sortOrder: 4,
      attributeSchema: [
        { key: "size", label: "Size", labelAr: "المقاس", type: "select", options: ["One Size","S/M","L/XL"] },
        { key: "color", label: "Color", labelAr: "اللون", type: "multiselect", options: ["White","Cream","Gray","Pink","Blue"] },
      ],
    },
  });

  const accessoriesCat = await prisma.category.upsert({
    where: { slug: "clothing-accessories" },
    update: {},
    create: { name: "Accessories", nameAr: "الإكسسوارات", slug: "clothing-accessories", parentId: clothingCat.id, sortOrder: 5,
      attributeSchema: [
        { key: "type", label: "Type", labelAr: "النوع", type: "select", options: ["Ghutrah","Agal","Belt","Cufflinks","Scarf"] },
      ],
    },
  });

  // Perfume subcategories
  const oudCat = await prisma.category.upsert({
    where: { slug: "oud" },
    update: {},
    create: { name: "Oud", nameAr: "العود", slug: "oud", parentId: perfumesCat.id, sortOrder: 1,
      attributeSchema: [
        { key: "volume", label: "Volume", labelAr: "الحجم", type: "select", options: ["3ml","6ml","10ml","30ml","50ml","100ml"], unit: "ml" },
        { key: "origin", label: "Origin", labelAr: "المصدر", type: "select", options: ["Hindi","Cambodi","Saudi","Assami","Malaysian"] },
      ],
    },
  });

  const attarCat = await prisma.category.upsert({
    where: { slug: "attar-oils" },
    update: {},
    create: { name: "Attar & Oils", nameAr: "العطر والزيوت", slug: "attar-oils", parentId: perfumesCat.id, sortOrder: 2,
      attributeSchema: [
        { key: "volume", label: "Volume", labelAr: "الحجم", type: "select", options: ["3ml","6ml","10ml","30ml"], unit: "ml" },
        { key: "scent_family", label: "Scent Family", labelAr: "عائلة العطر", type: "multiselect", options: ["Rose","Musk","Amber","Jasmine","Sandalwood"] },
      ],
    },
  });

  const edpCat = await prisma.category.upsert({
    where: { slug: "eau-de-parfum" },
    update: {},
    create: { name: "Eau de Parfum", nameAr: "أو دو بارفان", slug: "eau-de-parfum", parentId: perfumesCat.id, sortOrder: 3,
      attributeSchema: [
        { key: "volume", label: "Volume", labelAr: "الحجم", type: "select", options: ["30ml","50ml","100ml"], unit: "ml" },
        { key: "scent_family", label: "Scent Family", labelAr: "عائلة العطر", type: "multiselect", options: ["Oud","Floral","Woody","Fresh","Oriental"] },
      ],
    },
  });

  const giftSetsCat = await prisma.category.upsert({
    where: { slug: "perfume-gift-sets" },
    update: {},
    create: { name: "Gift Sets", nameAr: "طقم الهدايا", slug: "perfume-gift-sets", parentId: perfumesCat.id, sortOrder: 4,
      attributeSchema: [
        { key: "pieces", label: "Pieces", labelAr: "القطع", type: "select", options: ["2-piece","3-piece","5-piece"] },
      ],
    },
  });

  console.log("✅ Categories created");

  // ── Products ────────────────────────────────────────────────────────────────
  // Product 1: Classic White Thobe
  const thobe1 = await prisma.product.upsert({
    where: { slug: "classic-white-cotton-thobe" },
    update: {},
    create: {
      title: "Classic White Cotton Thobe",
      titleAr: "ثوب قطني أبيض كلاسيكي",
      slug: "classic-white-cotton-thobe",
      sku: "THOB-001",
      description: "A timeless white cotton thobe crafted from premium Egyptian cotton. Features a classic mandarin collar, precise stitching, and breathable fabric perfect for daily wear and formal occasions.",
      descriptionAr: "ثوب أبيض كلاسيكي مصنوع من القطن المصري الفاخر. يتميز بياقة ماندرين أنيقة وخياطة دقيقة وقماش تنفسي مثالي للاستخدام اليومي والمناسبات الرسمية.",
      categoryId: thobesCat.id,
      images: [
        "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
      ],
      price: 189,
      inventoryCount: 120,
      isActive: true,
      variants: {
        create: [
          { variantType: "size", value: "50", skuSuffix: "-50", stockCount: 20, priceModifier: null },
          { variantType: "size", value: "52", skuSuffix: "-52", stockCount: 30, priceModifier: null },
          { variantType: "size", value: "54", skuSuffix: "-54", stockCount: 30, priceModifier: null },
          { variantType: "size", value: "56", skuSuffix: "-56", stockCount: 25, priceModifier: null },
          { variantType: "size", value: "58", skuSuffix: "-58", stockCount: 15, priceModifier: null },
        ],
      },
    },
  });

  // Product 2: Luxury Linen Thobe
  const thobe2 = await prisma.product.upsert({
    where: { slug: "luxury-linen-thobe-cream" },
    update: {},
    create: {
      title: "Luxury Linen Thobe — Cream",
      titleAr: "ثوب كتاني فاخر — كريمي",
      slug: "luxury-linen-thobe-cream",
      sku: "THOB-002",
      description: "Premium Belgian linen thobe in warm cream. Lightweight and breathable, ideal for warm climates. Features delicate embroidery on the collar and cuffs.",
      descriptionAr: "ثوب كتاني بلجيكي فاخر بلون كريمي دافئ. خفيف الوزن وتنفسي، مثالي للمناخات الدافئة. يتميز بتطريز رقيق على الياقة والأكمام.",
      categoryId: thobesCat.id,
      images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80"],
      price: 349,
      salePrice: 299,
      inventoryCount: 60,
      isActive: true,
      variants: {
        create: [
          { variantType: "size", value: "50", skuSuffix: "-50", stockCount: 10, priceModifier: null },
          { variantType: "size", value: "52", skuSuffix: "-52", stockCount: 15, priceModifier: null },
          { variantType: "size", value: "54", skuSuffix: "-54", stockCount: 15, priceModifier: null },
          { variantType: "size", value: "56", skuSuffix: "-56", stockCount: 12, priceModifier: null },
          { variantType: "size", value: "58", skuSuffix: "-58", stockCount: 8, priceModifier: null },
        ],
      },
    },
  });

  // Product 3: Classic Black Abaya
  const abaya1 = await prisma.product.upsert({
    where: { slug: "classic-black-abaya" },
    update: {},
    create: {
      title: "Classic Black Abaya",
      titleAr: "عباءة سوداء كلاسيكية",
      slug: "classic-black-abaya",
      sku: "ABAY-001",
      description: "An elegant everyday abaya in premium Nidha fabric. A-line silhouette with subtle flare, full-length sleeves, and a concealed front zipper for a polished look.",
      descriptionAr: "عباءة يومية أنيقة من قماش النيدا الفاخر. قصة A مع انسدال رقيق، أكمام طويلة وسحاب أمامي مخفي لمظهر أنيق.",
      categoryId: abayasCat.id,
      images: ["https://images.unsplash.com/photo-1585412459212-88786c0c46d5?w=800&q=80"],
      price: 259,
      inventoryCount: 80,
      isActive: true,
      variants: {
        create: [
          { variantType: "size", value: "XS", skuSuffix: "-XS", stockCount: 10, priceModifier: null },
          { variantType: "size", value: "S", skuSuffix: "-S", stockCount: 20, priceModifier: null },
          { variantType: "size", value: "M", skuSuffix: "-M", stockCount: 25, priceModifier: null },
          { variantType: "size", value: "L", skuSuffix: "-L", stockCount: 15, priceModifier: null },
          { variantType: "size", value: "XL", skuSuffix: "-XL", stockCount: 10, priceModifier: null },
        ],
      },
    },
  });

  // Product 4: Embroidered Butterfly Abaya
  const abaya2 = await prisma.product.upsert({
    where: { slug: "embroidered-butterfly-abaya" },
    update: {},
    create: {
      title: "Embroidered Butterfly Abaya",
      titleAr: "عباءة فراشة مطرزة",
      slug: "embroidered-butterfly-abaya",
      sku: "ABAY-002",
      description: "A graceful butterfly-cut abaya in luxurious crepe fabric, adorned with delicate floral embroidery on the sleeves. Perfect for special occasions.",
      descriptionAr: "عباءة فراشة راقية من قماش الكريب الفاخر، مزينة بتطريز زهري رقيق على الأكمام. مثالية للمناسبات الخاصة.",
      categoryId: abayasCat.id,
      images: ["https://images.unsplash.com/photo-1607335614466-9a7ecbc8d1c1?w=800&q=80"],
      price: 449,
      inventoryCount: 40,
      isActive: true,
      variants: {
        create: [
          { variantType: "size", value: "S", skuSuffix: "-S", stockCount: 8, priceModifier: null },
          { variantType: "size", value: "M", skuSuffix: "-M", stockCount: 12, priceModifier: null },
          { variantType: "size", value: "L", skuSuffix: "-L", stockCount: 12, priceModifier: null },
          { variantType: "size", value: "XL", skuSuffix: "-XL", stockCount: 8, priceModifier: null },
        ],
      },
    },
  });

  // Product 5: Hindi Oud Oil
  const oud1 = await prisma.product.upsert({
    where: { slug: "hindi-oud-oil-pure" },
    update: {},
    create: {
      title: "Pure Hindi Oud Oil",
      titleAr: "زيت عود هندي خالص",
      slug: "hindi-oud-oil-pure",
      sku: "OUD-001",
      description: "Premium aged Hindi oud oil with a rich, deep, and smoky profile. Notes of dark woods, earth, and sweet balsam. A true connoisseur's oud, sourced from wild agarwood.",
      descriptionAr: "زيت عود هندي فاخر معتق بخصائص غنية وعميقة ودخانية. روائح الأخشاب الداكنة والتربة والبلسم الحلو. عود حقيقي للخبراء، مستخرج من شجر العود البري.",
      categoryId: oudCat.id,
      images: ["https://images.unsplash.com/photo-1541643600914-78b084683702?w=800&q=80"],
      price: 599,
      inventoryCount: 30,
      isActive: true,
      variants: {
        create: [
          { variantType: "volume", value: "3ml", skuSuffix: "-3ML", stockCount: 10, priceModifier: null },
          { variantType: "volume", value: "6ml", skuSuffix: "-6ML", stockCount: 10, priceModifier: 400 },
          { variantType: "volume", value: "10ml", skuSuffix: "-10ML", stockCount: 10, priceModifier: 750 },
        ],
      },
    },
  });

  // Product 6: Rose Musk Attar
  const attar1 = await prisma.product.upsert({
    where: { slug: "rose-musk-attar-oil" },
    update: {},
    create: {
      title: "Rose Musk Attar Oil",
      titleAr: "زيت عطر المسك بالورد",
      slug: "rose-musk-attar-oil",
      sku: "ATT-001",
      description: "A soft and romantic attar blending Taif rose with white musk and a hint of sandalwood. Long-lasting and alcohol-free. Perfect for daily wear.",
      descriptionAr: "عطر ناعم ورومانسي يجمع وردة الطائف مع المسك الأبيض ولمسة من خشب الصندل. دائم الرائحة وخالٍ من الكحول. مثالي للاستخدام اليومي.",
      categoryId: attarCat.id,
      images: ["https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&q=80"],
      price: 149,
      inventoryCount: 80,
      isActive: true,
      variants: {
        create: [
          { variantType: "volume", value: "6ml", skuSuffix: "-6ML", stockCount: 30, priceModifier: null },
          { variantType: "volume", value: "10ml", skuSuffix: "-10ML", stockCount: 30, priceModifier: 100 },
          { variantType: "volume", value: "30ml", skuSuffix: "-30ML", stockCount: 20, priceModifier: 250 },
        ],
      },
    },
  });

  // Product 7: Amber Oud EDP
  const edp1 = await prisma.product.upsert({
    where: { slug: "amber-oud-eau-de-parfum" },
    update: {},
    create: {
      title: "Amber Oud Eau de Parfum",
      titleAr: "عطر العنبر والعود أو دو بارفان",
      slug: "amber-oud-eau-de-parfum",
      sku: "EDP-001",
      description: "A bold and luxurious EDP featuring top notes of saffron and rose, a heart of pure oud, and a base of amber, vanilla, and musk. Long-lasting 8-10 hours.",
      descriptionAr: "عطر أو دو بارفان جريء وفاخر يتميز بنوتات رأسية من الزعفران والورد، وقلب من العود الخالص، وقاعدة من العنبر والفانيليا والمسك. يدوم 8-10 ساعات.",
      categoryId: edpCat.id,
      images: ["https://images.unsplash.com/photo-1619994403073-2cec844b8e63?w=800&q=80"],
      price: 389,
      salePrice: 339,
      inventoryCount: 45,
      isActive: true,
      variants: {
        create: [
          { variantType: "volume", value: "30ml", skuSuffix: "-30ML", stockCount: 15, priceModifier: null },
          { variantType: "volume", value: "50ml", skuSuffix: "-50ML", stockCount: 20, priceModifier: 120 },
          { variantType: "volume", value: "100ml", skuSuffix: "-100ML", stockCount: 10, priceModifier: 250 },
        ],
      },
    },
  });

  // Product 8: Royal Oud Gift Set
  const giftSet1 = await prisma.product.upsert({
    where: { slug: "royal-oud-gift-set-3piece" },
    update: {},
    create: {
      title: "Royal Oud Gift Set — 3 Piece",
      titleAr: "طقم هدايا العود الملكي — 3 قطع",
      slug: "royal-oud-gift-set-3piece",
      sku: "GIFT-001",
      description: "A curated luxury gift set featuring our bestselling Amber Oud EDP (50ml), Pure Hindi Oud Oil (6ml), and Rose Musk Attar (10ml). Presented in an elegant navy gift box.",
      descriptionAr: "طقم هدايا فاخر مختار يضم عطر العنبر والعود (50مل) وزيت العود الهندي الخالص (6مل) وعطر المسك بالورد (10مل). يُقدَّم في علبة هدايا أنيقة باللون الكحلي.",
      categoryId: giftSetsCat.id,
      images: ["https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80"],
      price: 699,
      inventoryCount: 20,
      isActive: true,
      variants: {
        create: [
          { variantType: "pieces", value: "3-piece", skuSuffix: "-3PC", stockCount: 20, priceModifier: null },
        ],
      },
    },
  });

  // Product 9: Prayer Dress Set
  const prayerDress1 = await prisma.product.upsert({
    where: { slug: "classic-prayer-dress-white" },
    update: {},
    create: {
      title: "Classic Prayer Dress — White",
      titleAr: "فستان صلاة كلاسيكي — أبيض",
      slug: "classic-prayer-dress-white",
      sku: "PRAY-001",
      description: "A flowing, full-coverage prayer dress in soft white jersey fabric. One-piece design with a built-in head covering. Machine washable and wrinkle-resistant.",
      descriptionAr: "فستان صلاة فضفاض كامل التغطية من قماش الجيرسيه الأبيض الناعم. تصميم من قطعة واحدة مع غطاء رأس مدمج. يمكن غسله في الغسالة ومقاوم للتجعد.",
      categoryId: prayerDressCat.id,
      images: ["https://images.unsplash.com/photo-1592155931584-901ac15763e3?w=800&q=80"],
      price: 89,
      inventoryCount: 100,
      isActive: true,
      variants: {
        create: [
          { variantType: "size", value: "One Size", skuSuffix: "-OS", stockCount: 60, priceModifier: null },
          { variantType: "size", value: "S/M", skuSuffix: "-SM", stockCount: 25, priceModifier: null },
          { variantType: "size", value: "L/XL", skuSuffix: "-LXL", stockCount: 15, priceModifier: null },
        ],
      },
    },
  });

  // Product 10: Traditional Ghutrah
  const accessory1 = await prisma.product.upsert({
    where: { slug: "traditional-white-ghutrah" },
    update: {},
    create: {
      title: "Traditional White Ghutrah",
      titleAr: "غترة بيضاء تقليدية",
      slug: "traditional-white-ghutrah",
      sku: "ACC-001",
      description: "Premium quality white ghutrah (headscarf) made from fine Egyptian cotton. Generous size, crisp white, and easy to style with an agal.",
      descriptionAr: "غترة بيضاء عالية الجودة مصنوعة من القطن المصري الفاخر. مقاس سخي ولون أبيض ناصع وسهلة التشكيل مع العقال.",
      categoryId: accessoriesCat.id,
      images: ["https://images.unsplash.com/photo-1577900232427-18219b9166a0?w=800&q=80"],
      price: 45,
      inventoryCount: 200,
      isActive: true,
      variants: {
        create: [
          { variantType: "size", value: "Standard (135x135cm)", skuSuffix: "-STD", stockCount: 150, priceModifier: null },
          { variantType: "size", value: "Large (145x145cm)", skuSuffix: "-LRG", stockCount: 50, priceModifier: 10 },
        ],
      },
    },
  });

  console.log("✅ Products created:", [thobe1, thobe2, abaya1, abaya2, oud1, attar1, edp1, giftSet1, prayerDress1, accessory1].map(p => p.slug).join(", "));

  // ── Coupons ──────────────────────────────────────────────────────────────────
  const coupon = await prisma.coupon.upsert({
    where: { code: "RAWAQ10" },
    update: {},
    create: {
      code: "RAWAQ10",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      minCartValue: 100,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      usageLimit: 1000,
      timesUsed: 0,
    },
  });

  const coupon2 = await prisma.coupon.upsert({
    where: { code: "WELCOME50" },
    update: {},
    create: {
      code: "WELCOME50",
      discountType: DiscountType.FIXED,
      discountValue: 50,
      minCartValue: 200,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      usageLimit: 500,
      timesUsed: 0,
    },
  });

  console.log("✅ Coupons created:", coupon.code, coupon2.code);
  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📋 Admin credentials:");
  console.log("   Email: admin@rawaq.sa");
  console.log("   Password: Admin@Rawaq2025!");
  console.log("\n🏷️  Sample coupons:");
  console.log("   RAWAQ10  — 10% off, min cart 100 SAR");
  console.log("   WELCOME50 — 50 SAR off, min cart 200 SAR");

  // ── Hero Slides ───────────────────────────────────────────────────────────
  const slidesData = [
    {
      title:      "Premium Islamic Fashion",
      titleAr:    "أزياء إسلامية فاخرة",
      subtitle:   "Thobes, Abayas & more — crafted with tradition",
      subtitleAr: "أثواب وعبايات وأكثر — مصنوعة بإتقان وتراث",
      imageUrl:   "https://images.unsplash.com/photo-1594938298603-c8148c4b4a0e?w=1600&q=80",
      ctaLabel:   "Shop Clothing",
      ctaLabelAr: "تسوق الملابس",
      ctaLink:    "/category/clothing",
      sortOrder:  0,
      isActive:   true,
    },
    {
      title:      "Royal Perfume Collection",
      titleAr:    "مجموعة العطور الملكية",
      subtitle:   "Oud, Attar & Arabic fragrances — scents that captivate",
      subtitleAr: "عود وعطر وأو دو بارفان — روائح تسحر وتبقى",
      imageUrl:   "https://images.unsplash.com/photo-1619994403073-2cec844b8e63?w=1600&q=80",
      ctaLabel:   "Explore Perfumes",
      ctaLabelAr: "استكشف العطور",
      ctaLink:    "/category/perfumes",
      sortOrder:  1,
      isActive:   true,
    },
    {
      title:      "Ramadan Special Offer",
      titleAr:    "عرض رمضان المميز",
      subtitle:   "Up to 30% off selected items — limited time",
      subtitleAr: "خصم يصل إلى ٣٠٪ على منتجات مختارة — لفترة محدودة",
      imageUrl:   "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1600&q=80",
      ctaLabel:   "View Offers",
      ctaLabelAr: "عرض العروض",
      ctaLink:    "/category/clothing",
      sortOrder:  2,
      isActive:   true,
    },
  ];

  for (const slide of slidesData) {
    await prisma.slide.upsert({
      where:  { id: `seed-slide-${slide.sortOrder}` as any },
      // upsert by title since we don't have a unique slug; just use createMany skip
      update: slide,
      create: slide,
    });
  }

  // simpler approach — just delete and recreate slides on each seed run
  await prisma.slide.deleteMany({ where: { title: { in: slidesData.map((s) => s.title) } } });
  await prisma.slide.createMany({ data: slidesData });
  console.log("\n🎞️  Hero slides seeded:", slidesData.length);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
