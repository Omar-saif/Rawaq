import Link from 'next/link';
import { prisma } from '@/lib/prisma';

async function getFeaturedProducts() {
  return await prisma.product.findMany({
    take: 8,
    where: { inStock: true },
    orderBy: { createdAt: 'desc' },
    include: { category: true },
  });
}

async function getCategories() {
  return await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
}

export default async function Home() {
  const products = await getFeaturedProducts();
  const categories = await getCategories();

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="bg-blue-600 rounded-3xl p-8 md:p-16 text-white text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">Welcome to NavyShop</h1>
        <p className="text-xl mb-8 opacity-90">Discover our curated collection of premium products.</p>
        <Link href="/shop" className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-100 transition">
          Shop Now
        </Link>
      </section>

      {/* Categories */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="p-6 bg-white border rounded-xl text-center hover:border-blue-600 hover:shadow-md transition group"
            >
              <span className="text-lg font-semibold group-hover:text-blue-600 transition">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link key={product.id} href={`/product/${product.slug}`} className="group">
              <div className="bg-white border rounded-2xl overflow-hidden hover:shadow-lg transition">
                <div className="aspect-square relative bg-gray-100">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-500 mb-1">{product.category.name}</p>
                  <h3 className="font-bold text-lg group-hover:text-blue-600 transition">{product.name}</h3>
                  <p className="text-blue-600 font-bold mt-2">${Number(product.price).toFixed(2)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
